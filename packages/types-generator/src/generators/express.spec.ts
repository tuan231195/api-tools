import path from 'path';
import { matchFsSnapshot } from '#test/utils';
import { generateExpressTypes } from 'src/generators/express';

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

jest.mock('fs-extra', () => {
	const { fs } = require('memfs');
	const util = require('util');
	const originalFs = jest.requireActual('fs-extra');

	return {
		...originalFs,
		mkdirp: util.promisify(fs.mkdirp.bind(fs)),
		writeFile: util.promisify(fs.writeFile.bind(fs)),
	};
});

describe('generateExpressTypes', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		await generateExpressTypes(filePath, 'out');
		await matchFsSnapshot('out');
	});
});
