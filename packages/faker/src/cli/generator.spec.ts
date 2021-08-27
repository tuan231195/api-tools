import yargs from '../cli';
import * as generatorService from 'src/core/generator';

describe('generator module', () => {
	it('call generate fake response', async () => {
		const writeFakeSpy = jest
			.spyOn(generatorService, 'writeFake')
			.mockImplementation(jest.fn());

		await yargs.parse('--out-dir out --uri http://uri');

		expect(writeFakeSpy).toHaveBeenCalledWith('http://uri', 'out');
	});
});
