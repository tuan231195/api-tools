import * as _ from 'lodash';
import { readFileSync } from 'fs';
import * as Handlebars from 'handlebars';

Handlebars.registerHelper('kebabCase', _.kebabCase);
Handlebars.registerHelper('uppercase', _.upperCase);
Handlebars.registerHelper('capitalize', (val) =>
	_.upperFirst(_.camelCase(val))
);

export const compileTemplate = (templatePath: string) => {
	return Handlebars.compile(readFileSync(templatePath, 'utf-8').toString(), {
		noEscape: true,
	});
};
