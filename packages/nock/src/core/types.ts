import nock, { ReplyHeaders } from 'nock';
import { OverrideOptions } from '@vdtn359/api-tools-faker';

export type ExtendedNockInterceptor = nock.Interceptor & {
	fakeReply: (
		status: number,
		overrideOptions?: OverrideOptions,
		headers?: ReplyHeaders
	) => nock.Scope;
};
