import { generateTypes } from 'src/generators/types';
import { CommandModule } from 'yargs';

const commandModule: CommandModule<
	{},
	{
		outDir: string;
		uri: string;
	}
> = {
	describe: 'generate typescript types',
	handler: async function ({ uri, outDir }) {
		return generateTypes(uri, outDir);
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
