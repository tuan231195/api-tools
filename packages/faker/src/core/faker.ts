import { getOperation, parse } from '@vdtn359/api-tools-core';
import { fakeOperationResponse } from 'src/core/generator';
import { OperationOverrideOptions } from 'src/core/types';

export const faker = async (uri: string) => {
	const parsedDocument = await parse(uri);

	return {
		fakeResponse(options: OperationOverrideOptions) {
			const operationSchema = getOperation(parsedDocument, options);

			return fakeOperationResponse({
				schema: operationSchema.schema,
				status: options.status,
				overrides: options.overrides,
				mergeOptions: options.mergeOptions,
			});
		},
	};
};
