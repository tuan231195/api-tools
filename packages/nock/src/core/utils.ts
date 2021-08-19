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
