import path from 'path';
import { getOperation, parse } from '@vdtn359/api-tools-core';
import {
	fakeOperation,
	fakeOperationResponse,
	writeFake,
} from 'src/core/generator';
import { matchFsSnapshot } from '#test/utils';
import { initSeed } from 'src/core/jsf';

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

initSeed('123');

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

describe('fakeOperation', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const document = await parse(filePath);
		const { schema } = getOperation(document, {
			operationId: 'placeOrder',
		});
		const result = await fakeOperation(schema);

		expect(result).toMatchSnapshot();
	});
});

describe('writeFake', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		await writeFake(filePath, 'out');
		expect(matchFsSnapshot('out'));
	});
});

describe('fakeOperationResponse', () => {
	it('should accept override objects', async () => {
		const document = await parse(
			path.resolve(testDir, 'v3', 'petstore.json')
		);
		const { schema } = getOperation(document, {
			operationId: 'createUser',
		});
		const result = await fakeOperationResponse({
			schema,
			status: 200,
			overrides: {
				id: 1,
			},
		});
		expect(result).toMatchSnapshot();
	});

	it('should call override functions with fake data', async () => {
		const document = await parse(
			path.resolve(testDir, 'v3', 'petstore.json')
		);
		const operation = getOperation(document, {
			operationId: 'createUser',
		});
		const overridesFunction = jest.fn().mockResolvedValue(1);
		const result = await fakeOperationResponse({
			schema: operation.schema,
			overrides: overridesFunction,
		});
		expect(result).toEqual(1);
		expect(overridesFunction).toHaveBeenCalledWith(
			operation.schema,
			expect.any(Object)
		);
		expect(overridesFunction.mock.calls[0][1]).toMatchSnapshot();
	});
});
