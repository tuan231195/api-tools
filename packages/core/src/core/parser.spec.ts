import path from 'path';
import { parse, validate } from './parser';

const testDir = path.resolve(__dirname, '..', '..', 'test');

describe('parse', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const result = await parse(filePath);
		const document = await validate(filePath);

		expect(result.document).toEqual(document);
		expect(Object.keys(result.schema)).toMatchSnapshot();
		expect(Object.values(result.schema)).toMatchSnapshot();
	});
});
