import yargs from '../cli';
import * as typesService from 'src/generators/types';

describe('types module', () => {
	it('call generate typescript function', async () => {
		const generateTypesSpy = jest
			.spyOn(typesService, 'generateTypes')
			.mockImplementation(jest.fn());

		await yargs.parse('--out-dir out --uri http://uri');

		expect(generateTypesSpy).toHaveBeenCalledWith('http://uri', 'out');
	});
});
