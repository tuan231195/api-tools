import { zipObject } from 'lodash';

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

type ResolvedPromise<T extends Record<string, any>> = {
	[k in keyof T]: Awaited<T[k]>;
};

export const promiseAll = async <T extends Record<string, any>>(
	object: T
): Promise<ResolvedPromise<T>> => {
	const keys = Object.keys(object);
	const resolvedArray = await Promise.all(keys.map((key) => object[key]));
	return zipObject(keys, resolvedArray) as ResolvedPromise<T>;
};
