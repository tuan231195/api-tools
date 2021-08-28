import { Express, NextFunction, Request, Response } from 'express';
import { InvalidRequestError, InvalidResponseError } from '../src';

export default function setup(app: Express) {
	app.use(function (req, res, next) {
		res.setHeader('X-Powered-By', 'mock-swagger-server');
		next();
	});

	return () => {
		app.use(
			(err: Error, req: Request, res: Response, next: NextFunction) => {
				if (err instanceof InvalidRequestError) {
					res.status(400).json({
						errors: err.errors.map((error) => ({
							code: 'InvalidRequestError',
							message: error.message,
							path: error.path,
						})),
					});
				}
				if (err instanceof InvalidResponseError) {
					res.status(500).json({
						errors: err.errors.map((error) => ({
							code: 'InvalidResponseError',
							message: error.message,
							path: error.path,
						})),
					});
				}
				next(err);
			}
		);
	};
}
