import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { Schema as MixSchema } from 'dtsgenerator';
import { HTTP_METHODS } from 'src/constants';
import type { JsonSchemaDraft07 } from 'dtsgenerator/src/core/jsonSchemaDraft07';

export type SchemaObject = OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject;

export type Parameter = OpenAPIV3.ParameterObject | OpenAPIV2.Parameter;

export type JsonSchema = JsonSchemaDraft07.SchemaObject;

export type Schema = Omit<MixSchema, 'content'> & {
	content: JsonSchema;
};

export const supportedMediaTypes = [
	'application/json',
	'application/x-www-form-urlencoded',
	'multipart/form-data',
] as const;

type SUPPORT_MEDIA_TYPE = typeof supportedMediaTypes[number];

export type ParsedOperationSchema = {
	params: Schema | null;
	queries: Schema | null;
	headers: Schema | null;
	requestBody: ParsedRequestBodySchema | null;
	responseBody: ParsedResponseBodySchema;
};

export type ParsedRequestBodySchema = {
	type: 'json' | 'form';
	contentType: SUPPORT_MEDIA_TYPE;
	schema: Schema;
};

export type ParsedResponseBodySchema = {
	statuses: Record<number, Schema>;
	all: Schema | null;
	success: Schema | null;
};

export type HttpMethod = typeof HTTP_METHODS[number];

export type Operation = {
	method: HttpMethod;
	path: string;
	operationId: string;
	operation: OpenAPI.Operation;
};

export type ParsedOperationSchemaWithInfo = {
	info: Operation;
	schema: ParsedOperationSchema;
};

export type GetOperationArgs =
	| {
			operationId: string;
	  }
	| {
			methodName: HttpMethod;
			path: string;
	  };

export type ParsedSchema = Record<string, ParsedOperationSchemaWithInfo>;

export type ParsedDocument = {
	document: OpenAPI.Document;
	schema: ParsedSchema;
};
