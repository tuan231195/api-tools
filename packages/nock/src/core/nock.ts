import { getOperation, GetOperationArgs, parse } from '@vdtn359/api-tools-core';
import nockBase, { Options, ReplyHeaders, RequestBodyMatcher } from 'nock';
import { matchUri, ramlToExpress } from 'src/core/utils';
import { ExtendedNockInterceptor } from 'src/core/types';
import {
	fakeOperationResponse,
	OverrideOptions,
} from '@vdtn359/api-tools-faker';

export const nock = async (baseUrl: string, uri: string) => {
	const parsedDocument = await parse(uri);
	const scope = nockBase(baseUrl);

	return {
		scope,
		mock(
			options: GetOperationArgs,
			requestBody?: RequestBodyMatcher,
			interceptorOptions?: Options
		): ExtendedNockInterceptor {
			const operation = getOperation(parsedDocument, options);
			const operationMethod = operation.info.method;
			const operationInterceptor = scope[operationMethod](
				matchUri(ramlToExpress(operation.info.path)),
				requestBody,
				interceptorOptions
			);

			return {
				...operationInterceptor,
				fakeReply(
					status: number,
					overrideOptions?: OverrideOptions,
					headers?: ReplyHeaders
				) {
					const responseBody = fakeOperationResponse({
						schema: operation.schema,
						overrides: overrideOptions?.overrides,
						mergeOptions: overrideOptions?.mergeOptions,
						status,
					});
					return operationInterceptor.reply(
						status,
						responseBody,
						headers
					);
				},
			} as ExtendedNockInterceptor;
		},
	};
};
