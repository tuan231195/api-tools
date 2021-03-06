#! /usr/bin/env node

import yargs from 'yargs';

yargs
	.scriptName('fake-api-types')
	.command(require('./cli/generator').default)
	.strict(true)
	.showHelpOnFail(false);

if (require.main === module) {
	yargs.argv;
}

export default yargs;
