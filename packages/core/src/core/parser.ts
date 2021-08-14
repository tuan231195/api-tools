import SwaggerParser from '@apidevtools/swagger-parser';
import { parseSchema } from 'dtsgenerator';
import { omit, omitBy, startCase } from 'lodash';
import { OpenAPI } from 'openapi-types';
import { HTTP_METHODS, JSON_SCHEMA_7 } from 'src/constants';
import logger from 'src/logger';
import {
	JsonSchema,
	Parameter,
	ParsedSchema,
	ParsedSchemaOperation,
	ParsedSchemaRequestBody,
	ParsedSchemaResponseBody,
	Schema,
	SchemaObject,
	supportedMediaTypes,
} from 'src/types';

export async function validate(uri: string): Promise<OpenAPI.Document> {
	return SwaggerParser.validate(uri);
}

export const parse = async (
	uri: string | OpenAPI.Document
): Promise<ParsedSchema> => {
	const schema = typeof uri === 'string' ? await validate(uri) : uri;
	const result: ParsedSchema = {};

	await Promise.all(
		Object.keys(schema.paths).map(async (pathName) => {
			const schemaPathComponent = schema.paths[pathName] || {};
			for (const methodName of HTTP_METHODS) {
				const schemaOperationComponent =
					schemaPathComponent[methodName];
				if (!schemaOperationComponent) {
					continue;
				}
				if (!schemaOperationComponent.operationId) {
					logger(
						`Skip ${methodName.toUpperCase()} ${pathName}. Operation does not have operationId`
					);
					continue;
				}
				const defaultParameters = schemaPathComponent['parameters'];
				result[schemaOperationComponent.operationId] = {
					schema: await generateApiPathSchema(
						schemaOperationComponent,
						defaultParameters
					),
					operation: {
						operationId: schemaOperationComponent.operationId,
						operation: schemaOperationComponent,
						path: pathName,
						method: methodName,
					},
				};
			}
		})
	);

	return result;
};

const generateApiPathSchema = async (
	schema: OpenAPI.Operation,
	defaultParameters: OpenAPI.Parameters = []
): Promise<ParsedSchemaOperation> => {
	logger(`Processing ${schema.operationId}`);

	const operationParameters = schema.parameters ?? defaultParameters;
	const parametersSchema = generateParametersSchema(
		operationParameters as Parameter[]
	);
	const requestBodySchema = generateRequestBodySchema(schema);
	const responseBodySchema = generateResponseBodySchema(schema);
	return {
		headers: parametersSchema['header'] ?? null,
		queries: parametersSchema['query'] ?? null,
		params: parametersSchema['path'] ?? null,
		requestBody: requestBodySchema,
		responseBody: responseBodySchema,
	};
};

const generateRequestBodySchema = (
	schema: OpenAPI.Operation
): ParsedSchemaRequestBody | null => {
	let requestBody = getRequestBodySchema(schema);
	if (requestBody) {
		return requestBody;
	}
	requestBody = getBodyParameter(schema);
	return requestBody;
};

const generateResponseBodySchema = (
	schemaOperation: OpenAPI.Operation
): ParsedSchemaResponseBody => {
	if (!schemaOperation.responses) {
		return {
			statuses: {},
			all: null,
			success: null,
		};
	}
	const allStatusSchema = getAllStatusSchema(schemaOperation);
	const allSchema: Schema = toSchema({
		$id: 'Response',
		oneOf: Object.values(allStatusSchema).map((response) => ({
			$ref: response.content.$id,
		})),
	});

	const successResponses: Schema[] = Object.entries(allStatusSchema)
		.filter(([status]) => {
			const statusCode = parseInt(status, 10);
			return statusCode >= 200 && statusCode < 300;
		})
		.map(([, schema]) => schema);

	let successSchema: Schema | null = null;
	if (successResponses.length > 0) {
		successSchema = toSchema({
			$id: 'ResponseOk',
			oneOf: successResponses.map((response) => {
				return {
					$ref: response.content.$id,
				};
			}),
		});
	}

	return {
		all: allSchema,
		success: successSchema,
		statuses: allStatusSchema,
	};
};

export const getAllStatusSchema = (
	schemaOperation: OpenAPI.Operation
): ParsedSchemaResponseBody['statuses'] => {
	return Object.entries(schemaOperation.responses || []).reduce(
		(agg, [status, response]) => {
			const statusCode =
				status === 'default' ? 200 : parseInt(status, 10);
			const id = `Response${statusCode}`;
			const jsonBody =
				response.content && response.content['application/json'];

			const schema = jsonBody
				? toSchema({
						...jsonBody.schema,
						$id: id,
						example: jsonBody.example ?? null,
				  })
				: nullSchema(id);
			return {
				...agg,
				[statusCode]: schema,
			};
		},
		{} as ParsedSchemaResponseBody['statuses']
	);
};

const getRequestBodySchema = (
	schemaOperation: OpenAPI.Operation
): ParsedSchemaRequestBody | null => {
	const content = (schemaOperation as any).requestBody?.content;
	const requestContentType = supportedMediaTypes.find(
		(supportedType) => content && content[supportedType]
	);
	const requestBody = content && content[requestContentType || ''];
	if (!(requestBody && requestContentType)) {
		return null;
	}
	return {
		type: requestContentType === 'application/json' ? 'json' : 'form',
		contentType: requestContentType,
		schema: toSchema({
			...requestBody.schema,
			$id: 'RequestBody',
			example: requestBody.example ?? null,
		}),
	};
};

const getBodyParameter = (
	schemaOperation: OpenAPI.Operation
): ParsedSchemaRequestBody | null => {
	const parameterGroup = getParameterGroup(
		(schemaOperation.parameters || []) as Parameter[]
	);

	let schema: Schema | null = null;
	let requestType: ParsedSchemaRequestBody['type'] | null = null;
	let requestContentType: ParsedSchemaRequestBody['contentType'] | null =
		null;
	if (parameterGroup['body'] && parameterGroup['body'].length > 0) {
		requestType = 'json';
		requestContentType = 'application/json';
		const bodyParameter = parameterGroup['body'][0];
		schema = toSchema({
			...bodyParameter.schema,
			$id: 'RequestBody',
			example: bodyParameter.example ?? null,
		});
	} else if (parameterGroup['formData']) {
		requestType = 'form';
		requestContentType =
			'consumes' in schemaOperation &&
			(schemaOperation.consumes || []).includes('multipart/form-data')
				? 'multipart/form-data'
				: 'application/x-www-form-urlencoded';
		const bodyParameters = parameterGroup['formData'];
		schema = parseParameters('RequestBody', bodyParameters);
	}

	if (!(schema && requestType && requestContentType)) {
		return null;
	}

	return {
		type: requestType,
		contentType: requestContentType,
		schema,
	};
};

const getParameterGroup = (parameters: Parameter[]) => {
	const parameterGroup: Record<string, Parameter[]> = {};
	for (const parameter of parameters) {
		const schemaType = parameter.in;
		(parameterGroup[schemaType] = parameterGroup[schemaType] || []).push(
			parameter
		);
	}
	return parameterGroup;
};

const generateParametersSchema = (parameters: Parameter[]) => {
	const parameterGroup = getParameterGroup(parameters);
	// we don't want body parameters
	delete parameterGroup['body'];
	delete parameterGroup['formData'];

	return Object.entries(parameterGroup).reduce((agg, [group, parameters]) => {
		const id = startCase(group);
		return {
			...agg,
			[group]: parseParameters(id, parameters),
		};
	}, {} as Record<string, Schema>);
};

const parseParameters = (id: string, parameters: Parameter[]) => {
	const parameterProperties = parameters.reduce((agg, parameter) => {
		const parameterSchema =
			'schema' in parameter
				? parameter.schema
				: omit(parameter, ['collectionFormat', 'in', 'name']);

		return {
			...agg,
			[parameter.name]: parameterSchema,
		};
	}, {} as Record<string, SchemaObject>);

	const requiredProps = parameters
		.filter((parameter) => parameter.required)
		.map((parameter) => parameter.name);

	return toSchema({
		type: 'object',
		$id: id,
		properties: parameterProperties as any,
		additionalProperties: false,
		required: requiredProps,
	});
};

const nullSchema = (id: string) => {
	return toSchema({
		$id: id,
		type: 'boolean',
		not: true,
	});
};

const toSchema = (schema: JsonSchema): Schema => {
	return parseSchema({
		...omitBy(schema, (value) => value == null),
		$schema: JSON_SCHEMA_7,
	}) as Schema;
};
