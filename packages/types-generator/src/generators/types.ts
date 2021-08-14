import { parse } from '@vdtn359/api-tools-core';
import path from 'path';
import { kebabCase } from 'lodash';
import logger from 'src/logger';
import fs from 'fs-extra';
import { prepare, prettify, toTsTypes } from 'src/generators/utils';

export const generateTypes = async (uri: string, outDir: string) => {
	const parsedSchema = await parse(uri);
	await prepare(outDir);
	await Promise.all(
		Object.entries(parsedSchema).map(
			async ([operationId, { schema: operationSchema }]) => {
				const writeFile = path.resolve(
					outDir,
					`${kebabCase(operationId)}.ts`
				);
				logger(`Write ${operationId} to file ${writeFile}`);

				const content = await toTsTypes(operationSchema);
				await fs.writeFile(writeFile, prettify(content));
			}
		)
	);
};
