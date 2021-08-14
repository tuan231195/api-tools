import { CommandModule } from 'yargs';
import { generateAxiosTypes } from 'src/generators/axios';

const commandModule: CommandModule<
	{},
	{
		outDir: string;
		uri: string;
	}
> = {
	describe: 'generate axios types',
	handler: async function ({ uri, outDir }) {
		return generateAxiosTypes(uri, outDir);
	},
	command: 'axios',
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
