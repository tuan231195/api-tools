import { CommandModule } from 'yargs';
import path from 'path';
import { startServer } from 'src/server';
import { initSeed } from '@vdtn359/api-tools-faker';

const commandModule: CommandModule<
	{},
	{
		configFile: string;
		seed?: string;
	}
> = {
	describe: 'run mock swagger server',
	handler: async function ({ configFile, seed }) {
		if (!path.isAbsolute(configFile)) {
			configFile = path.resolve(process.cwd(), configFile);
		}
		return startServer(configFile, seed);
	},
	command: '$0',
	builder: {
		configFile: {
			demandOption: true,
			type: 'string',
			description: 'The config file',
			alias: 'c',
		},
		seed: {
			demandOption: false,
			type: 'string',
			description: 'The seed. Used for predictable response',
			alias: 's',
		},
	},
};

export default commandModule;
