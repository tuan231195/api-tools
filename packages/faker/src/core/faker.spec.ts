import { getOperation, parse } from '@vdtn359/api-tools-core';
import { fakeOperationResponse } from 'src/core/generator';
import path from 'path';
import * as generatorService from './generator';
import { faker } from 'src/core/faker';

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

describe('faker', () => {
	it('should call fakeOperationResponse', async () => {
		jest.spyOn(generatorService, 'fakeOperationResponse').mockResolvedValue(
			'result'
		);

		const filePath = path.resolve(testDir, 'v3', 'petstore.json');
		const fakerService = await faker(filePath);

		const parsedDocument = await parse(filePath);

		const operationSchema = getOperation(parsedDocument, {
			operationId: 'createUser',
		});

		const overrides = { id: 1 };
		const mergeOptions = jest.fn();

		const result = await fakerService.fakeResponse({
			operationId: 'createUser',
			mergeOptions,
			overrides,
		});
		expect(result).toEqual('result');
		expect(generatorService.fakeOperationResponse).toHaveBeenCalledWith({
			schema: operationSchema.schema,
			overrides,
			mergeOptions,
		});
	});
});
