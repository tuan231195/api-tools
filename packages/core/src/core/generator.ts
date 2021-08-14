import { ParsedSchemaOperation, Schema } from 'src/types';
import dtsGenerator, { Options } from 'dtsgenerator';

export const generate = async (
	parsedSchema: ParsedSchemaOperation | Schema[],
	config: Options['config'] = {}
) => {
	const contents = Array.isArray(parsedSchema)
		? parsedSchema
		: ([
				parsedSchema.headers,
				parsedSchema.queries,
				parsedSchema.params,
				parsedSchema.requestBody,
				...Object.values(parsedSchema.responseBody.statuses),
		  ].filter(Boolean) as Schema[]);
	return dtsGenerator({ contents, config });
};
