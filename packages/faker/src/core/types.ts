import { MergeWithCustomizer } from 'lodash';
import {
	GetOperationArgs,
	ParsedOperationSchema,
} from '@vdtn359/api-tools-core';

export type FakeOperation = {
	headers: any;
	params: any;
	queries: any;
	requestBody: any;
	defaultResponse: any;
	responseByStatuses: Record<number, any>;
};

export type OverrideOptions = {
	overrides?: any | ((schema: ParsedOperationSchema, fakeData: any) => any);
	mergeOptions?: MergeWithCustomizer;
};

export type OperationOverrideOptions = OverrideOptions &
	GetOperationArgs & {
		status?: number;
	};

export type OperationSchemaOverrideOptions = OverrideOptions & {
	status?: number;
	schema: ParsedOperationSchema;
};
