import { OpenAPI } from 'openapi-types';
import { HTTP_METHODS } from 'src/constants';
import { HttpMethod, Operation } from 'src/types';

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
