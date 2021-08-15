import { OpenAPI } from 'openapi-types';
import { HTTP_METHODS } from 'src/constants';
import {
	GetOperationArgs,
	HttpMethod,
	Operation,
	ParsedDocument,
	ParsedOperationSchemaWithInfo,
} from 'src/types';

export const getByOperationId = (
	document: OpenAPI.Document,
	operationId: string
): Operation | null => {
	for (const pathName of Object.keys(document.paths)) {
		const schemaPathComponent = document.paths[pathName] || {};
		for (const methodName of HTTP_METHODS) {
			const operationSchemaComponent = schemaPathComponent[methodName];
			if (
				!(
					operationSchemaComponent &&
					operationSchemaComponent.operationId !== operationId
				)
			) {
				continue;
			}
			return {
				operationId: operationSchemaComponent.operationId!,
				method: methodName,
				path: pathName,
				operation: operationSchemaComponent,
			};
		}
	}
	return null;
};

export const getByMethodAndPath = (
	document: OpenAPI.Document,
	method: HttpMethod,
	path: string
): Operation | null => {
	const schemaPathComponent = document.paths[path];
	if (!schemaPathComponent) {
		return null;
	}
	const operationSchemaComponent = schemaPathComponent[method];
	if (!operationSchemaComponent) {
		return null;
	}
	return {
		operationId: operationSchemaComponent.operationId!,
		method,
		path,
		operation: operationSchemaComponent,
	};
};

export const getOperation = (
	parsedDocument: ParsedDocument,
	args: GetOperationArgs
): ParsedOperationSchemaWithInfo => {
	let operationSchema: ParsedOperationSchemaWithInfo;
	let operationId: string;

	if ('operationId' in args) {
		operationId = args.operationId;
		operationSchema = parsedDocument.schema[operationId];
		if (!operationSchema) {
			throw new Error(`Operation ${operationId} not found`);
		}
	} else {
		const operation = getByMethodAndPath(
			parsedDocument.document,
			args.methodName,
			args.path
		);
		if (!operation) {
			throw new Error(
				`Operation ${args.methodName.toUpperCase()} ${
					args.path
				} not found`
			);
		}
		operationId = operation.operationId;
		operationSchema = parsedDocument.schema[operation.operationId];
	}
	if (!operationSchema) {
		throw new Error(`Operation ${operationId} not found`);
	}
	return operationSchema;
};
