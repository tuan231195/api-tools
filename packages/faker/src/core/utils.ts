import fs from 'fs-extra';
import prettier from 'prettier';
import { transform, isObject } from 'lodash';

export const prepare = async (outDir: string) => {
	await fs.mkdirp(outDir);
};

export const prettify = (content: string) => {
	return prettier.format(content, {
		semi: true,
		parser: 'typescript',
		useTabs: true,
		tabWidth: 4,
		singleQuote: true,
	});
};

export const replaceKeys = (object: any, keyMap: Record<string, string>) => {
	if (!object) {
		return object;
	}
	return transform(object, (result: any, value: any, key: string) => {
		const currentKey = keyMap[key] || key;
		result[currentKey] = isObject(value)
			? replaceKeys(value, keyMap)
			: value;
	});
};
