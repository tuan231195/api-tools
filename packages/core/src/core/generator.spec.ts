import path from 'path';
import { mapValues } from 'lodash';
import { parse } from './parser';
import { generate } from './generator';
import { promiseAll } from './utils';

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

describe('generate', () => {
	it.each([
		['/v2/petstore.json', path.resolve(testDir, 'v2', 'petstore.json')],
		['/v3/petstore.json', path.resolve(testDir, 'v3', 'petstore.json')],
	])('%s', async (testName, filePath) => {
		const result = await parse(filePath);
		const mappedResult = await promiseAll(
			mapValues(result.schema, ({ schema }) => generate(schema))
		);

		expect(mappedResult).toMatchSnapshot();
	});
});
