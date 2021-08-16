import { promiseAll } from './utils';

describe('promiseAll', () => {
	it('should resolve promises correctly', async () => {
		expect(
			await promiseAll({
				a: Promise.resolve(1),
				b: Promise.resolve(2),
				c: 3,
				d: null,
			})
		).toEqual({
			a: 1,
			b: 2,
			c: 3,
			d: null,
		});
	});
});
