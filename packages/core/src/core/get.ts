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
			const schemaOperationComponent = schemaPathComponent[methodName];
			if (
				!(
					schemaOperationComponent &&
					schemaOperationComponent.operationId !== operationId
				)
			) {
				continue;
			}
			return {
				operationId: schemaOperationComponent.operationId!,
				method: methodName,
				path: pathName,
				operation: schemaOperationComponent,
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
	const schemaOperationComponent = schemaPathComponent[method];
	if (!schemaOperationComponent) {
		return null;
	}
	return {
		operationId: schemaOperationComponent.operationId!,
		method,
		path,
		operation: schemaOperationComponent,
	};
};
