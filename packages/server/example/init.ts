import { Express, NextFunction, Request, Response } from 'express';

export default function setup(app: Express) {
	app.use(function (req, res, next) {
		res.setHeader('X-Powered-By', 'mock-swagger-server');
		next();
	});

	return () => {
		app.use(
			(err: Error, req: Request, res: Response, next: NextFunction) => {
				if (err.name === 'InvalidRequestError') {
					return res.status(400).json({
						errors: (err as any).errors.map((error: any) => ({
							code: 'InvalidRequestError',
							message: error.message,
							path: error.path,
						})),
					});
				}
				if (err.name === 'InvalidResponseError') {
					return res.status(500).json({
						errors: (err as any).errors.map((error: any) => ({
							code: 'InvalidResponseError',
							message: error.message,
							path: error.path,
						})),
					});
				}
				console.error(err);
				next(err);
			}
		);
	};
}
