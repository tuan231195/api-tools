import { startServer } from 'src/server/server';
import path from 'path';
import { Config } from 'src/server/types';

export const init = async (configFile: string, uri: string) => {
	const config = parseConfig(configFile);

	await startServer({
		...config,
		uri,
	});
};

const parseConfig = (configFile: string): Config => {
	const config = require(configFile);
	const dirname = path.dirname(configFile);

	return {
		...config,
		init: resolveFile(dirname, config.init),
		baseUrl: config.baseUrl ?? '/',
		overrides: resolveFile(dirname, config.overrides),
		routes: resolveFile(dirname, config.routes),
	};
};

const resolveFile = (dirname: string, file?: string) => {
	if (!file) {
		return file;
	}

	if (path.isAbsolute(file)) {
		return file;
	}

	return path.resolve(dirname, file);
};
