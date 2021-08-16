import path from 'path';
import { generateAxiosTypes } from 'src/generators/axios';
import { matchFsSnapshot } from '#test/utils';

const testDir = path.resolve(__dirname, '..', '..', 'test');

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

describe('generateAxiosTypes', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		await generateAxiosTypes(filePath, 'out');
		await matchFsSnapshot('out');
	});
});
