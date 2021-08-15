import * as uuid from 'uuid';
import * as jsf from 'json-schema-faker';
import Chance from 'chance';

jsf.option({
	minLength: 1,
	useDefaultValue: true,
	alwaysFakeOptionals: true,
});

jsf.format('uuid', () => uuid.v4());

jsf.extend('chance', () => {
	const chance = new Chance();
	chance.mixin({
		currency_code: () => chance.currency().code.toLowerCase(),
	});
	return chance;
});

export const generate = (schema: any) => {
	return jsf.resolve(schema) as Promise<any>;
};
