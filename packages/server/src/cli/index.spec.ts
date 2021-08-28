import yargs from '../cli';
import * as mockServer from 'src/server';
import path from 'path';

describe('server module', () => {
	it('call generate axios function', async () => {
		const startServerSpy = jest
			.spyOn(mockServer, 'startServer')
			.mockImplementation(jest.fn());

		await yargs.parse('--config-file config.json --seed 123');

		expect(startServerSpy).toHaveBeenCalledWith(
			path.resolve(process.cwd(), 'config.json'),
			'123'
		);
	});
});
