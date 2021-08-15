import {
	fromPairs,
	kebabCase,
	mapKeys,
	mapValues,
	mergeWith,
	omit,
	omitBy,
} from 'lodash';
import {
	parse,
	ParsedOperationSchema,
	promiseAll,
} from '@vdtn359/api-tools-core';
import path from 'path';
import { prepare, prettify } from 'src/core/utils';
import logger from 'src/logger';
import fs from 'fs-extra';
import os from 'os';
import { generate } from 'src/core/jsf';
import { FakeOperation, OperationSchemaOverrideOptions } from 'src/core/types';

export const fakeOperation = async (
	operationSchema: ParsedOperationSchema
): Promise<FakeOperation> => {
	const defaultResponse = Object.entries(
		operationSchema.responseBody.statuses
	).find(([key]) => {
		const statusCode = parseInt(key, 10);
		return statusCode >= 200 && statusCode < 300;
	});
	return promiseAll({
		headers: operationSchema.headers
			? generate(operationSchema.headers.content)
			: null,
		queries: operationSchema.queries
			? generate(operationSchema.queries.content)
			: null,
		params: operationSchema.params
			? generate(operationSchema.params.content)
			: null,
		requestBody: operationSchema.requestBody
			? generate(operationSchema.requestBody.schema.content)
			: null,
		defaultResponse: defaultResponse
			? generate(defaultResponse[1].content)
			: null,
		responseByStatuses: promiseAll(
			mapValues(operationSchema.responseBody.statuses, (schema) =>
				generate(schema.content)
			)
		),
	});
};

export const getResponseByStatus = async (
	schema: ParsedOperationSchema,
	status?: number
) => {
	const fakeData = await fakeOperation(schema);
	const responseBody = status
		? fakeData.responseByStatuses[status]
		: fakeData.defaultResponse;
	if (!responseBody) {
		throw new Error('Could not find response for the operation');
	}
	return responseBody;
};

export const fakeOperationResponse = async ({
	schema,
	overrides,
	mergeOptions,
	status,
}: OperationSchemaOverrideOptions) => {
	const responseBody = getResponseByStatus(schema, status);
	if (typeof overrides === 'function') {
		return overrides(responseBody);
	}
	return mergeWith(responseBody, overrides, mergeOptions);
};

export const writeFake = async (uri: string, outDir: string) => {
	const parsedDocument = await parse(uri);
	await prepare(outDir);

	for (const [operationId, { schema: operationSchema }] of Object.entries(
		parsedDocument.schema
	)) {
		try {
			const writeFile = path.resolve(
				outDir,
				`${kebabCase(operationId)}.ts`
			);
			logger(`Write ${operationId} to file ${writeFile}`);

			const fakeData = await fakeOperation(operationSchema);
			const exampleObject = omitBy(
				{
					...omit(fakeData, 'responseByStatuses'),
					...mapKeys(
						fakeData.responseByStatuses,
						(value, key) => `response${key}`
					),
				},
				(value) => value == null
			);

			const output = Object.entries(exampleObject)
				.map(([type, example]) => {
					return `export const ${type} = ${JSON.stringify(example)}`;
				})
				.join(os.EOL.repeat(2));

			await fs.writeFile(writeFile, prettify(output));
		} catch (e) {
			console.error(`Failed to generate fake data for ${operationId}`);
		}
	}
};
