import yargs from '../cli';
import * as expressService from 'src/generators/express';

describe('express module', () => {
	it('call generate express function', async () => {
		const generateExpressSpy = jest
			.spyOn(expressService, 'generateExpressTypes')
			.mockImplementation(jest.fn());

		await yargs.parse('express --out-dir out --uri http://uri');

		expect(generateExpressSpy).toHaveBeenCalledWith('http://uri', 'out');
	});
});
