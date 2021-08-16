import yargs from '../cli';
import * as axiosService from 'src/generators/axios';

describe('axios module', () => {
	it('call generate axios function', async () => {
		const generateAxiosSpy = jest
			.spyOn(axiosService, 'generateAxiosTypes')
			.mockImplementation(jest.fn());

		await yargs.parse('axios --out-dir out --uri http://uri');

		expect(generateAxiosSpy).toHaveBeenCalledWith('http://uri', 'out');
	});
});
