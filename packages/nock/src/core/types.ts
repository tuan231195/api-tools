import nock, { Options, ReplyHeaders, RequestBodyMatcher } from 'nock';
import { MergeWithCustomizer } from 'lodash';
import { GetOperationArgs } from '@vdtn359/api-tools-core';

export interface ExtendedInterceptor {
	fakeReply(
		overrideOptions?: OverrideOptions,
		headers?: ReplyHeaders
	): nock.Scope;

	fakeReply(
		status: number,
		overrideOptions?: OverrideOptions,
		headers?: ReplyHeaders
	): nock.Scope;
}
export type ExtendedNockInterceptor = nock.Interceptor & ExtendedInterceptor;

export type OverrideOptions = {
	overrides?:
		| any
		| ((args: {
				uri: string;
				params: Record<string, string>;
				fakeResponse: any;
				body?: any;
		  }) => any);
	mergeOptions?: MergeWithCustomizer;
};

export interface MockApi {
	scope: nock.Scope;
	mock: (
		options: GetOperationArgs,
		requestBody?: RequestBodyMatcher,
		interceptorOptions?: Options
	) => ExtendedNockInterceptor;
}
