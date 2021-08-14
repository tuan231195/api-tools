import { kebabCase, omitBy } from 'lodash';
import {
	parse,
	ParsedSchemaOperation,
	promiseAll,
} from '@vdtn359/api-tools-core';
import path from 'path';
import { prepare, prettify } from 'src/core/utils';
import logger from 'src/logger';
import fs from 'fs-extra';
import os from 'os';
import { generate } from 'src/core/jsf';
import { FakeOperation } from 'src/core/types';

export const generateFakerOperation = async (
	schemaOperation: ParsedSchemaOperation
): Promise<FakeOperation> => {
	const defaultResponse = Object.entries(
		schemaOperation.responseBody.statuses
	).find(([key]) => {
		const statusCode = parseInt(key, 10);
		return statusCode >= 200 && statusCode < 300;
	});
	return promiseAll({
		headers: schemaOperation.headers
			? generate(schemaOperation.headers.content)
			: null,
		queries: schemaOperation.queries
			? generate(schemaOperation.queries.content)
			: null,
		params: schemaOperation.params
			? generate(schemaOperation.params.content)
			: null,
		requestBody: schemaOperation.requestBody
			? generate(schemaOperation.requestBody.schema.content)
			: null,
		responseBody: defaultResponse
			? generate(defaultResponse[1].content)
			: null,
	});
};

export const writeFake = async (uri: string, outDir: string) => {
	const parsedSchema = await parse(uri);
	await prepare(outDir);

	for (const [operationId, { schema: schemaOperation }] of Object.entries(
		parsedSchema
	)) {
		try {
			const writeFile = path.resolve(
				outDir,
				`${kebabCase(operationId)}.ts`
			);
			logger(`Write ${operationId} to file ${writeFile}`);

			const exampleObject = omitBy(
				await generateFakerOperation(schemaOperation),
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
