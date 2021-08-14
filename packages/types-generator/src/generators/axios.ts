import {
	parse,
	ParsedSchema,
	ParsedSchemaOperation,
	promiseAll,
	Schema,
	validate,
} from '@vdtn359/api-tools-core';
import fs from 'fs-extra';
import path from 'path';
import logger from 'src/logger';
import { kebabCase } from 'lodash';
import { compileTemplate } from 'src/templates';
import { prepare, prettify, toTsType, toTsTypes } from 'src/generators/utils';

const operationTemplate = compileTemplate(
	path.resolve(__dirname, '..', 'templates', 'axios', 'operation.hbs')
);

const indexTemplate = compileTemplate(
	path.resolve(__dirname, '..', 'templates', 'axios', 'index.hbs')
);

export const generateAxiosTypes = async (uri: string, outDir: string) => {
	const document = await validate(uri);
	const parsedSchema = await parse(document);
	await prepare(outDir);

	await generateOperations(parsedSchema, outDir);
	await generateIndex(parsedSchema, outDir);
};

const generateIndex = async (parsedSchema: ParsedSchema, outDir: string) => {
	const operations = Object.entries(parsedSchema).map(
		([operationId, { schema: operationSchema }]) => {
			const successResponses = getSuccessResponseSchema(operationSchema);
			return {
				hasResponse: successResponses.length > 0,
				operationId,
			};
		}
	);
	const writeFile = path.resolve(outDir, 'index.ts');
	logger(`Write index to file ${writeFile}`);

	const templateContent = indexTemplate({
		operations,
	});
	await fs.writeFile(writeFile, prettify(templateContent));
};

const generateOperations = async (
	parsedSchema: ParsedSchema,
	outDir: string
) => {
	await Promise.all(
		Object.entries(parsedSchema).map(
			async ([operationId, { schema: operationSchema, operation }]) => {
				try {
					const writeFile = path.resolve(
						outDir,
						`${kebabCase(operationId)}.ts`
					);
					logger(`Write ${operationId} to file ${writeFile}`);

					const successResponses =
						getSuccessResponseSchema(operationSchema);

					const templateContent = operationTemplate(
						promiseAll({
							url: createUrl(operation.path),
							httpMethod: operation.method,
							hasHeaders: !!operationSchema.headers,
							hasParams: !!operationSchema.params,
							hasQueries: !!operationSchema.queries,
							hasRequestBody: !!operationSchema.requestBody,
							hasResponse: successResponses.length > 0,
							requestBodyType: operationSchema.requestBody
								? toTsType(operationSchema.requestBody.schema)
								: '',
							isForm:
								operationSchema.requestBody?.type === 'form',
							responseType: successResponses.length
								? toTsTypes(successResponses)
								: '',
							paramsType: toTsType(operationSchema.params),
							queriesType: toTsType(operationSchema.queries),
							headersType: toTsType(operationSchema.headers),
						})
					);
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

const getSuccessResponseSchema = (schema: ParsedSchemaOperation) => {
	const successResponses: Schema[] = Object.entries(
		schema.responseBody.statuses
	)
		.filter(([status]) => {
			const statusCode = parseInt(status, 10);
			return statusCode >= 200 && statusCode < 300;
		})
		.map(([, schema]) => schema);
	if (schema.responseBody.success) {
		schema.responseBody.success.content.$id = 'Response';
		successResponses.push(schema.responseBody.success);
	}
	return successResponses;
};

export const createUrl = (pathName: string): string => {
	return pathName
		.split('/')
		.map((item) => {
			if (item.startsWith('{')) {
				return `\${encodeURIComponent(request.path['${item.substring(
					1,
					item.length - 1
				)}'] as any)}`;
			}
			return item;
		})
		.join('/');
};
