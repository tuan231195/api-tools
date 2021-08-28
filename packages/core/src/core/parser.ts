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
	ParsedOperationSchema,
	ParsedRequestBodySchema,
	ParsedResponseBodySchema,
	Schema,
	SchemaObject,
	supportedMediaTypes,
	ParsedDocument,
} from 'src/types';

export async function validate(uri: string): Promise<OpenAPI.Document> {
	return SwaggerParser.validate(uri);
}

export const parse = async (
	uri: string | OpenAPI.Document
): Promise<ParsedDocument> => {
	const document = typeof uri === 'string' ? await validate(uri) : uri;
	const result: ParsedSchema = {};

	await Promise.all(
		Object.keys(document.paths).map(async (pathName) => {
			const schemaPathComponent = document.paths[pathName] || {};
			for (const methodName of HTTP_METHODS) {
				const operationSchemaComponent =
					schemaPathComponent[methodName];
				if (!operationSchemaComponent) {
					continue;
				}
				if (!operationSchemaComponent.operationId) {
					logger(
						`Skip ${methodName.toUpperCase()} ${pathName}. Operation does not have operationId`
					);
					continue;
				}
				const defaultParameters = schemaPathComponent['parameters'];
				result[operationSchemaComponent.operationId] = {
					schema: await generateApiPathSchema(
						operationSchemaComponent,
						defaultParameters
					),
					info: {
						operationId: operationSchemaComponent.operationId,
						operation: operationSchemaComponent,
						path: pathName,
						method: methodName,
					},
				};
			}
		})
	);

	return {
		document,
		schema: result,
	};
};

const generateApiPathSchema = async (
	schema: OpenAPI.Operation,
	defaultParameters: OpenAPI.Parameters = []
): Promise<ParsedOperationSchema> => {
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
): ParsedRequestBodySchema | null => {
	let requestBody = getRequestBodySchema(schema);
	if (requestBody) {
		return requestBody;
	}
	requestBody = getBodyParameter(schema);
	return requestBody;
};

const generateResponseBodySchema = (
	operationSchema: OpenAPI.Operation
): ParsedResponseBodySchema => {
	if (!operationSchema.responses) {
		return {
			statuses: {},
			all: null,
			success: null,
		};
	}
	const allStatusSchema = getAllStatusSchema(operationSchema);
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
	operationSchema: OpenAPI.Operation
): ParsedResponseBodySchema['statuses'] => {
	return Object.entries(operationSchema.responses || []).reduce(
		(agg, [status, response]) => {
			const statusCode =
				status === 'default' ? 200 : parseInt(status, 10);
			const id = `Response${statusCode}`;
			let jsonBody: any;
			if (response.content && response.content['application/json']) {
				jsonBody = response.content['application/json'];
			} else if (response.schema) {
				jsonBody = response;
			}

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
		{} as ParsedResponseBodySchema['statuses']
	);
};

const getRequestBodySchema = (
	operationSchema: OpenAPI.Operation
): ParsedRequestBodySchema | null => {
	const content = (operationSchema as any).requestBody?.content;
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
	operationSchema: OpenAPI.Operation
): ParsedRequestBodySchema | null => {
	const parameterGroup = getParameterGroup(
		(operationSchema.parameters || []) as Parameter[]
	);

	let schema: Schema | null = null;
	let requestType: ParsedRequestBodySchema['type'] | null = null;
	let requestContentType: ParsedRequestBodySchema['contentType'] | null =
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
			'consumes' in operationSchema &&
			(operationSchema.consumes || []).includes('multipart/form-data')
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
