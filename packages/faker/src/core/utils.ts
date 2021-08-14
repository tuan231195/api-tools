import fs from 'fs-extra';
import prettier from 'prettier';

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
