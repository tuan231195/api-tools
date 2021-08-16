#! /usr/bin/env node

import yargs from 'yargs';

yargs
	.scriptName('generate-api-types')
	.command(require('./cli/axios').default)
	.command(require('./cli/express').default)
	.command(require('./cli/typescript').default)
	.strict(true)
	.showHelpOnFail(false);

if (require.main === module) {
	yargs.argv;
}

export default yargs;
