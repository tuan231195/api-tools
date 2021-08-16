import * as jsf from 'json-schema-faker';
import Chance from 'chance';

const chance = new Chance();
chance.mixin({
	currency_code: () => chance.currency().code.toLowerCase(),
});

jsf.option({
	minLength: 1,
	useDefaultValue: true,
	alwaysFakeOptionals: true,
	failOnInvalidFormat: false,
	failOnInvalidTypes: false,
});

jsf.format('uuid', () => chance.guid());

jsf.extend('chance', () => {
	return chance;
});

export const generate = (schema: any) => {
	if (!!schema.not) {
		return null;
	}
	return jsf.resolve(schema) as Promise<any>;
};
