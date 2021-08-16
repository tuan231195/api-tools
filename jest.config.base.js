const { pathsToModuleNameMapper } = require('ts-jest/utils');

module.exports = (dirname) => {
	const { compilerOptions } = require(`${dirname}/tsconfig.json`);
	return {
		roots: ['<rootDir>/src'],
		clearMocks: true,
		preset: 'ts-jest',
		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		testURL: 'http://localhost',
		testRegex: '.*\\.(spec)\\.[tj]sx?$',
		moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
			prefix: `${dirname}/`,
		}),
		globals: {
			'ts-jest': {
				compiler: 'ttypescript',
				diagnostics: false,
				tsconfig: `${dirname}/tsconfig.json`,
			},
		},
	};
};
