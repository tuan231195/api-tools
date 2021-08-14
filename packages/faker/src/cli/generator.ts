import { CommandModule } from 'yargs';
import { writeFake } from 'src/core';

const commandModule: CommandModule<
	{},
	{
		outDir: string;
		uri: string;
	}
> = {
	describe: 'generate fake data for api',
	handler: async function ({ uri, outDir }) {
		return writeFake(uri, outDir);
	},
	command: '$0',
	builder: {
		outDir: {
			demandOption: true,
			type: 'string',
			description: 'The output directory',
			alias: 'o',
		},
		uri: {
			demandOption: true,
			type: 'string',
			description: 'The swagger file uri',
			alias: 'u',
		},
	},
};

export default commandModule;
