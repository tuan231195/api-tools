import { CommandModule } from 'yargs';
import { generateExpressTypes } from 'src/generators/express';

const commandModule: CommandModule<
	{},
	{
		outDir: string;
		uri: string;
	}
> = {
	describe: 'generate express types',
	handler: async function ({ uri, outDir }) {
		return generateExpressTypes(uri, outDir);
	},
	command: 'express',
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
