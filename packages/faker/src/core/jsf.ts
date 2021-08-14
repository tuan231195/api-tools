import * as uuid from 'uuid';
import * as jsf from 'json-schema-faker';

jsf.option({
	minLength: 1,
	useDefaultValue: true,
	alwaysFakeOptionals: true,
});

jsf.format('uuid', () => uuid.v4());

export const generate = (schema: any) => {
	return jsf.resolve(schema) as Promise<any>;
};
