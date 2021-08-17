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

export function wrap<W extends object, B>(wrapper: W, base: B): W & B {
	const proxy = new Proxy(wrapper, {
		get(target, property) {
			if (property in target) {
				return getProperty(target, property, proxy);
			}

			return getProperty(base, property, proxy);
		},
	}) as W & B;
	return proxy;
}

export function getProperty(
	object: any,
	property: string | symbol,
	proxy: any
) {
	const propertyValue: any = object[property];
	if (typeof propertyValue === 'function' && !propertyValue.__proxy) {
		const oldFunction = propertyValue;
		object[property] = function (...args: any[]) {
			const value = oldFunction.apply(object, args);
			return value === object ? proxy : value;
		} as any;

		propertyValue.__proxy = true;
	}
	return propertyValue;
}
