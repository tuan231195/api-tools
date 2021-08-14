import {
	OpenAPI,
	parse,
	ParsedSchema,
	Schema,
	validate,
} from '@vdtn359/api-tools-core';
import fs from 'fs-extra';
import path from 'path';
import logger from 'src/logger';
import { kebabCase } from 'lodash';
import { compileTemplate } from 'src/templates';
import { prepare, prettify, toTsType, toTsTypes } from 'src/generators/utils';

const handlerTemplate = compileTemplate(
	path.resolve(__dirname, '..', 'templates', 'express', 'handler.hbs')
);

export const generateExpressTypes = async (uri: string, outDir: string) => {
	const document = await validate(uri);
	const parsedSchema = await parse(document);
	await prepare(outDir);

	await generateHandlers(document, parsedSchema, outDir);
};

const generateHandlers = async (
	document: OpenAPI.Document,
	parsedSchema: ParsedSchema,
	outDir: string
) => {
	await Promise.all(
		Object.entries(parsedSchema).map(
			async ([operationId, { schema: operationSchema }]) => {
				try {
					const writeFile = path.resolve(
						outDir,
						`${kebabCase(operationId)}.ts`
					);
					logger(`Write ${operationId} to file ${writeFile}`);

					const allStatuses = Object.entries(
						operationSchema.responseBody.statuses
					);
					const templateContent = handlerTemplate({
						hasHeaders: !!operationSchema.headers,
						hasParams: !!operationSchema.params,
						hasQueries: !!operationSchema.queries,
						hasRequestBody: !!operationSchema.requestBody,
						hasResponse: !!operationSchema.responseBody.all,
						requestBodyType: await toTsType(
							operationSchema.requestBody
						),
						allResponses: await toTsTypes(
							[
								...allStatuses.map(([, schema]) => schema),
								operationSchema.responseBody.all,
							].filter(Boolean) as Schema[]
						),
						responseTypes: allStatuses.map(([status, schema]) => ({
							statusCode: status,
							name: schema.content.$id,
						})),
						paramsType: await toTsType(operationSchema.params),
						queriesType: await toTsType(operationSchema.queries),
						headersType: await toTsType(operationSchema.headers),
					});
					await fs.writeFile(writeFile, prettify(templateContent));
				} catch (e) {
					console.error(
						`Failed to generate types for ${operationId}`,
						e
					);
				}
			}
		)
	);
};
