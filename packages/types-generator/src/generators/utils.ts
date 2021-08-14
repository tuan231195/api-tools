import prettier from 'prettier';
import fs from 'fs-extra';
import {
	generate,
	ParsedSchemaOperation,
	Schema,
} from '@vdtn359/api-tools-core';
import os from 'os';

export const prettify = (content: string) => {
	return prettier.format(content, {
		semi: true,
		parser: 'typescript',
		useTabs: true,
		tabWidth: 4,
		singleQuote: true,
	});
};

export const prepare = async (outDir: string) => {
	await fs.mkdirp(outDir);
};

export const toTsType = async (schema: Schema | null) => {
	if (!schema) {
		return null;
	}
	return toTsTypes([schema]);
};

export const toTsTypes = async (schema: ParsedSchemaOperation | Schema[]) => {
	return (await generate(schema))
		.replace(/^declare interface/gm, 'export interface')
		.replace(/^declare type/gm, 'export type')
		.replace(/(\r?\nexport)/g, (match) => `${os.EOL}${match}`);
};
