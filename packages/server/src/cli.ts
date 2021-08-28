#! /usr/bin/env node
require('ts-node/register/transpile-only');

import yargs from 'yargs';

yargs
	.scriptName('mock-swagger-server')
	.command(require('./cli/index').default)
	.strict(true)
	.showHelpOnFail(false);

if (require.main === module) {
	yargs.argv;
}

export default yargs;
