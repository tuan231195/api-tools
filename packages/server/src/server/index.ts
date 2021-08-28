import { setupServer } from 'src/server/server';
import path from 'path';
import { Config } from 'src/server/types';
import fs from 'fs';

export const initServer = async (configFile: string, seed?: string) => {
	const config = parseConfig(configFile);

	return setupServer({
		...config,
		seed,
	});
};

export const startServer = async (configFile: string, seed?: string) => {
	const app = await initServer(configFile, seed);

	app.listen(app.get('port'), function () {
		console.info(`Express server listening on port ${app.get('port')}`);
	});
};

const parseConfig = (configFile: string): Config => {
	const config = require(configFile);
	const dirname = path.dirname(configFile);

	if (!config.uri) {
		throw new Error('uri is required');
	}

	return {
		...config,
		init: resolveFile(dirname, config.init),
		uri: resolveFile(dirname, config.uri, true),
		baseUrl: config.baseUrl ?? '/',
		overrides: resolveFile(dirname, config.overrides),
		routes: resolveFile(dirname, config.routes),
	};
};

const resolveFile = (dirname: string, file?: string, allowUri = false) => {
	if (!file) {
		return file;
	}

	if (allowUri && isValidHttpUrl(file)) {
		return file;
	}

	let absolutePath;

	if (path.isAbsolute(file)) {
		absolutePath = file;
	} else {
		absolutePath = path.resolve(dirname, file);
	}

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`${absolutePath} not found`);
	}
	return absolutePath;
};

export function isValidHttpUrl(string: string) {
	let url;

	try {
		url = new URL(string);
	} catch {
		return false;
	}

	return url.protocol === 'http:' || url.protocol === 'https:';
}

export * from './types';
