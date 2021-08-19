import {
	getOperation,
	GetOperationArgs,
	parse,
	ParsedDocument,
	ParsedOperationSchemaWithInfo,
	matchUri,
	parseUri,
	ramlToExpress,
} from '@vdtn359/api-tools-core';
import { mergeWith } from 'lodash';
import nockBase, {
	Interceptor,
	Options,
	ReplyHeaders,
	RequestBodyMatcher,
	Scope,
} from 'nock';
import { wrap } from 'src/core/utils';
import {
	ExtendedInterceptor,
	ExtendedNockInterceptor,
	MockApi,
	OverrideOptions,
} from 'src/core/types';
import { fakeOperationResponse } from '@vdtn359/api-tools-faker';

export const nock = async (baseUrl: string, uri: string): Promise<MockApi> => {
	const parsedDocument = await parse(uri);
	const scope = nockBase(baseUrl);

	return new MockApiImpl(scope, parsedDocument);
};

class MockApiImpl implements MockApi {
	constructor(public scope: Scope, private parsedDocument: ParsedDocument) {}

	mock(
		options: GetOperationArgs,
		requestBody?: RequestBodyMatcher,
		interceptorOptions?: Options
	): ExtendedNockInterceptor {
		const operation = getOperation(this.parsedDocument, options);
		const operationMethod = operation.info.method;
		const expressPathStyle = ramlToExpress(operation.info.path);
		const operationInterceptor = this.scope[operationMethod](
			matchUri(expressPathStyle),
			requestBody,
			interceptorOptions
		);

		return wrap(
			new ExtendedInterceptorImpl(operation, operationInterceptor),
			operationInterceptor
		);
	}
}

class ExtendedInterceptorImpl implements ExtendedInterceptor {
	constructor(
		private operation: ParsedOperationSchemaWithInfo,
		private interceptor: Interceptor
	) {}

	fakeReply(overrideOptions?: OverrideOptions, headers?: ReplyHeaders): Scope;
	fakeReply(
		status: number,
		overrideOptions?: OverrideOptions,
		headers?: ReplyHeaders
	): Scope;
	fakeReply(
		firstArg?: OverrideOptions | number,
		secondArg?: ReplyHeaders | OverrideOptions,
		thirdArg?: ReplyHeaders
	): Scope {
		let responseStatus: number | undefined;
		let headers: ReplyHeaders | undefined;
		let overrideOptions: OverrideOptions | undefined;
		let status: number;
		if (typeof firstArg !== 'number') {
			headers = secondArg as ReplyHeaders | undefined;
			overrideOptions = firstArg as OverrideOptions | undefined;
			status = 200;
			responseStatus = undefined;
		} else {
			headers = thirdArg as ReplyHeaders | undefined;
			overrideOptions = secondArg as OverrideOptions | undefined;
			status = firstArg;
			responseStatus = status;
		}
		return this.interceptor.reply(
			status,
			async (uri: string, body?: any) => {
				const expressPathStyle = ramlToExpress(
					this.operation.info.path
				);

				const fakeResponse = await fakeOperationResponse({
					schema: this.operation.schema,
					mergeOptions: overrideOptions?.mergeOptions,
					status: responseStatus,
				});
				let responseBody: any;
				if (typeof overrideOptions?.overrides === 'function') {
					const { params } = parseUri(uri, expressPathStyle);
					responseBody = overrideOptions.overrides({
						uri,
						body,
						fakeResponse,
						params,
					});
				} else if (overrideOptions?.overrides) {
					responseBody = mergeWith(
						fakeResponse,
						overrideOptions.overrides,
						overrideOptions.mergeOptions
					);
				}
				return responseBody;
			},
			headers
		);
	}
}
