import { MergeWithCustomizer } from 'lodash';
import { HttpMethod } from '@vdtn359/api-tools-core';

export type FakeOperation = {
	headers: any;
	params: any;
	queries: any;
	responseBody: any;
	requestBody: any;
};

export type OverrideOptions = {
	overrides?: any | ((fakeData: any) => any);
	mergeOptions?: MergeWithCustomizer;
};

export type OperationOverrideOptions = OverrideOptions &
	(
		| {
				operationId: string;
		  }
		| {
				methodName: HttpMethod;
				path: string;
		  }
	);
