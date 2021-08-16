import path from 'path';
import { parse, validate } from './parser';
import { getByMethodAndPath, getByOperationId, getOperation } from './get';

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

describe('getByOperationId', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const document = await validate(filePath);
		let operation = await getByOperationId(document, 'addPet');
		expect(operation).toMatchSnapshot();

		operation = await getByOperationId(document, 'blah');
		expect(operation).toBeNull();
	});
});

describe('getByMethodAndPath', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const document = await validate(filePath);
		let operation = await getByMethodAndPath(document, 'post', '/pet');
		expect(operation).toMatchSnapshot();

		operation = await getByMethodAndPath(document, 'post', '/blah');
		expect(operation).toBeNull();
	});
});

describe('getByMethodAndPath', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const document = await parse(filePath);
		let operation = await getOperation(document, { operationId: 'addPet' });
		expect(operation).toMatchSnapshot();

		operation = await getOperation(document, {
			methodName: 'post',
			path: '/pet',
		});
		expect(operation).toMatchSnapshot();
	});
});
