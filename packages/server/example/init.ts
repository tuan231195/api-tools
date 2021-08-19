import { Express } from 'express';

export default function setup(app: Express) {
	app.use(function (req, res, next) {
		res.setHeader('X-Powered-By', 'mock-api-server');
		next();
	});
}
