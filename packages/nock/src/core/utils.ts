import { match } from 'path-to-regexp';

export const ramlToExpress = (ramlPath: string) => {
	return ramlPath.replace(/\/{(.+?)}/g, '/:$1');
};

export const matchUri = (pattern: string) => {
	const matchFn = match(pattern, { decode: decodeURIComponent });
	return (uri: string) => !!matchFn(uri);
};

export const parseUri = <T extends object>(uri: string, pattern: string) => {
	const matchFn = match<T>(pattern, { decode: decodeURIComponent });
	const matches = matchFn(uri);
	if (!matches) {
		throw new Error(`${pattern} does not match ${uri}`);
	}
	return matches;
};
