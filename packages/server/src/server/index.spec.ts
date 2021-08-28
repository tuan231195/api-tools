import { Express } from 'express';
import path from 'path';
import Chance from 'chance';
import { initServer } from 'src/server';
import request from 'supertest';

const chance = new Chance();

describe('initServer', () => {
	let app: Express;

	describe.each(['config.v2.json', 'config.v3.json'])('%s', (file) => {
		beforeAll(async () => {
			app = await initServer(
				path.resolve(__dirname, '..', '..', 'example', file),
				'123'
			);
		});

		it('should allow custom routes', async () => {
			const response = await request(app).get('/hello').expect(200);
			expect(response.text).toEqual('ok');
		});

		it('should allow custom middlewares', async () => {
			const response = await request(app).get('/hello').expect(200);
			expect(response.headers['x-powered-by']).toEqual(
				'mock-swagger-server'
			);
		});

		it('should perform request validation', async () => {
			const response = await request(app)
				.post('/api/user')
				.send({})
				.expect(400);
			expect(response.body).toMatchSnapshot();
		});

		it('should allow valid request and return mock response', async () => {
			const response = await request(app)
				.post('/api/user')
				.send({
					id: chance.guid(),
					firstName: chance.first(),
					lastName: chance.last(),
					username: chance.word(),
					password: chance.word(),
				})
				.expect(200);
			expect(response.body).toMatchSnapshot();
		});

		it('should allow customised response', async () => {
			const response = await request(app)
				.get('/api/pet/findByStatus')
				.query({
					status: 'available',
				})
				.expect(200);
			expect(response.body).toMatchSnapshot();
		});
	});
});
