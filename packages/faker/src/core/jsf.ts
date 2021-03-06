import * as jsf from 'json-schema-faker';
import Chance from 'chance';
import seedrandom from 'seedrandom';
import logger from 'src/logger';

let jsfInstance: typeof jsf;

export const initSeed = (seed?: string) => {
	if (seed) {
		logger(`Use seed ${seed}`);
	}
	const chance = seed ? new Chance(seed) : new Chance();
	chance.mixin({
		currency_code: () => chance.currency().code.toLowerCase(),
		date_time: () => new Date(chance.timestamp() * 1000).toJSON(),
	});

	jsf.option({
		minLength: 1,
		useDefaultValue: true,
		alwaysFakeOptionals: true,
		failOnInvalidFormat: false,
		failOnInvalidTypes: false,
	});
	jsf.format('uuid', () => chance.guid());
	jsf.extend('chance', () => chance);
	if (seed) {
		jsf.option({
			random: seedrandom(seed.toString()),
		});
	}
	jsfInstance = jsf;

	return jsf;
};

export const generate = (schema: any) => {
	if (!jsfInstance) {
		jsfInstance = initSeed();
	}
	if (!!schema.not) {
		return null;
	}
	return jsfInstance.resolve(schema) as Promise<any>;
};
