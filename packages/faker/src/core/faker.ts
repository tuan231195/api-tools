import {
	getByMethodAndPath,
	parse,
	ParsedOperationSchema,
	ParsedOperationSchemaWithInfo,
	validate,
} from '@vdtn359/api-tools-core';
import { mergeWith } from 'lodash';
import { fakeOperation } from 'src/core/generator';
import { OperationOverrideOptions, OverrideOptions } from 'src/core/types';

export const faker = async (uri: string) => {
	const document = await validate(uri);
	const parsedSchema = await parse(uri);

	return {
		fakeResponse(options: OperationOverrideOptions) {
			let operationSchema: ParsedOperationSchemaWithInfo;
			let operationId: string;

			if ('operationId' in options) {
				operationId = options.operationId;
				operationSchema = parsedSchema[operationId];
				if (!operationSchema) {
					throw new Error(`Operation ${operationId} not found`);
				}
			} else {
				const operation = getByMethodAndPath(
					document,
					options.methodName,
					options.path
				);
				if (!operation) {
					throw new Error(
						`Operation ${options.methodName.toUpperCase()} ${
							options.path
						} not found`
					);
				}
				operationId = operation.operationId;
				operationSchema = parsedSchema[operation.operationId];
			}
			if (!operationSchema) {
				throw new Error(`Operation ${operationId} not found`);
			}

			return fakeOperationResponse({
				operationId,
				schema: operationSchema.schema,
				overrides: options.overrides,
				mergeOptions: options.mergeOptions,
			});
		},
	};
};

const fakeOperationResponse = async ({
	operationId,
	schema,
	overrides,
	mergeOptions,
}: {
	operationId: string;
	schema: ParsedOperationSchema;
} & OverrideOptions) => {
	const fakeData = await fakeOperation(schema);
	if (!fakeData.responseBody) {
		throw new Error(`Operation ${operationId} does not have response body`);
	}
	if (typeof overrides === 'function') {
		return overrides(fakeData.responseBody);
	}
	return mergeWith(fakeData.responseBody, overrides, mergeOptions);
};
