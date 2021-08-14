import {
	getByMethodAndPath,
	parse,
	ParsedSchemaOperation,
	validate,
} from '@vdtn359/api-tools-core';
import { mergeWith } from 'lodash';
import { generateFakerOperation } from 'src/core/generator';
import {
	MethodPathOverrideOptions,
	OperationIdOverrideOptions,
	OverrideOptions,
} from 'src/core/types';

export const faker = async (uri: string) => {
	const document = await validate(uri);
	const parsedSchema = await parse(uri);

	return {
		fakeByOperationId({
			operationId,
			overrides,
			mergeOptions,
		}: OperationIdOverrideOptions) {
			const schemaOperation = parsedSchema[operationId];
			if (!schemaOperation) {
				throw new Error(`Operation ${operationId} not found`);
			}
			return fakeOperation({
				operationId,
				schema: schemaOperation.schema,
				overrides,
				mergeOptions,
			});
		},
		fakeByMethodPath({
			methodName,
			path,
			mergeOptions,
			overrides,
		}: MethodPathOverrideOptions) {
			const operation = getByMethodAndPath(document, methodName, path);
			if (!operation) {
				throw new Error(
					`Operation ${methodName.toUpperCase()} ${path} not found`
				);
			}
			const schemaOperation = parsedSchema[operation.operationId];
			if (!schemaOperation) {
				throw new Error(`Operation ${operation.operationId} not found`);
			}
			return fakeOperation({
				operationId: operation.operationId,
				schema: schemaOperation.schema,
				overrides,
				mergeOptions,
			});
		},
	};
};

const fakeOperation = async ({
	operationId,
	schema,
	overrides,
	mergeOptions,
}: {
	operationId: string;
	schema: ParsedSchemaOperation;
} & OverrideOptions) => {
	const fakeData = await generateFakerOperation(schema);
	if (!fakeData.responseBody) {
		throw new Error(`Operation ${operationId} does not have response body`);
	}
	if (typeof overrides === 'function') {
		return overrides(fakeData.responseBody);
	}
	return mergeWith(fakeData.responseBody, overrides, mergeOptions);
};
