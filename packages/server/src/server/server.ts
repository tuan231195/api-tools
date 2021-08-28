import {
	Config,
	defaultValidateOptions,
	InvalidRequestError,
	InvalidResponseError,
	ValidateOptions,
} from 'src/server/types';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import {
	OpenAPI,
	parse,
	ParsedOperationSchemaWithInfo,
	ramlToExpress,
} from '@vdtn359/api-tools-core';
import fs from 'fs';
import requireDir from 'require-dir';
import { fakeOperationResponse, initSeed } from '@vdtn359/api-tools-faker';
import { camelCase, mapKeys } from 'lodash';
import { Express, NextFunction, Request, Response } from 'express';
import logger from 'src/logger';
import { ValidationErrorItem } from 'express-openapi-validator/dist/framework/types';

export const setupServer = async (config: Config) => {
	logger('Running with config', config);
	if (config.seed != null) {
		initSeed(config.seed);
	}

	const express = require('express');
	const app = express();
	const router = express.Router();
	app.set('port', config.port || 3000);
	app.use(morgan('combined', { stream: { write: (msg) => logger(msg) } }));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	let cleanupFunction: Function | null = null;
	if (config.init && fs.existsSync(config.init)) {
		const init = require(config.init).default;
		logger('Call custom init');
		cleanupFunction = await init(app);
	}

	const { schema: parsedSchema, document } = await parse(config.uri);
	if (config.validate) {
		let validateOptions: ValidateOptions;
		if (typeof config.validate === 'boolean') {
			validateOptions = defaultValidateOptions;
		} else {
			validateOptions = {
				...defaultValidateOptions,
				...config.validate,
			};
		}
		logger('Init swagger validator middleware');
		initSwaggerMiddleware({ app, document, validateOptions, config });
	}

	if (config.routes && fs.existsSync(config.routes)) {
		const setupExtraRoutes = require(config.routes).default;
		logger('Call custom setup routes');
		await setupExtraRoutes(router);
	}
	let overrides: Record<string, any> = {};
	if (config.overrides && fs.existsSync(config.overrides)) {
		overrides = mapKeys(
			requireDir(config.overrides, {
				recurse: false,
				extensions: ['.js', '.ts'],
			}),
			(value, key) => camelCase(key)
		);
	}

	const apiRouter = express.Router();
	await Promise.all(
		Object.entries(parsedSchema).map(async ([operationId, operation]) => {
			logger(`Setup ${operationId}`);
			const expressUrl = ramlToExpress(operation.info.path);
			const overrideFunction =
				overrides[operationId] &&
				typeof overrides[operationId].default === 'function'
					? overrides[operationId].default
					: undefined;

			apiRouter[operation.info.method](
				expressUrl,
				getRouteHandler(operation, config.seed, overrideFunction)
			);
		})
	);
	router.use(config.baseUrl, apiRouter);
	app.use(router);

	if (cleanupFunction) {
		cleanupFunction();
	}
	app.use(errorHandler());

	return app;
};

const getRouteHandler = (
	operation: ParsedOperationSchemaWithInfo,
	seed?: string,
	overrideFunc?: Function
) => {
	const defaultStatusStr = Object.keys(
		operation.schema.responseBody.statuses
	).find((key) => {
		const statusCode = parseInt(key, 10);
		return statusCode >= 200 && statusCode < 300;
	});
	const responseStatus = defaultStatusStr
		? parseInt(defaultStatusStr, 10)
		: 200;

	const defaultResponseGetter = (() => {
		let cachedDefaultResponse: any;

		return {
			async get(): Promise<any> {
				if (cachedDefaultResponse) {
					return cachedDefaultResponse;
				}
				const defaultResponse = defaultStatusStr
					? await fakeOperationResponse({
							schema: operation.schema,
							status: responseStatus,
					  })
					: undefined;
				if (seed != null) {
					cachedDefaultResponse = defaultResponse;
					return cachedDefaultResponse;
				} else {
					return defaultResponse;
				}
			},
		};
	})();

	return async (request: Request, response: Response, next: NextFunction) => {
		let defaultResponse: any;
		try {
			defaultResponse = await defaultResponseGetter.get();
		} catch (e) {
			defaultResponse = null;
		}

		try {
			let finalResponse = defaultResponse;
			if (overrideFunc) {
				logger(
					`Use override handler for ${operation.info.operationId}`
				);
				finalResponse = await overrideFunc({
					request,
					response,
					fakeResponse: defaultResponse,
				});
			}
			if (!response.headersSent) {
				if (finalResponse != undefined) {
					if (finalResponse && typeof finalResponse === 'object') {
						response.status(responseStatus).json(finalResponse);
					} else {
						response.status(responseStatus).send(finalResponse);
					}
				} else {
					response.sendStatus(responseStatus);
				}
			}
		} catch (err) {
			logger(`Route handler ${operation.info.operationId} failed`, err);
			next(err);
		}
	};
};

function initSwaggerMiddleware({
	app,
	document,
	validateOptions,
	config,
}: {
	app: Express;
	document: OpenAPI.Document;
	validateOptions: ValidateOptions;
	config: Config;
}) {
	if ('swagger' in document) {
		const validator = require('swagger-express-validator');
		const schema = {
			...document,
			basePath: config.baseUrl,
		};
		delete schema.definitions;
		// swagger v2
		app.use(
			validator({
				...validateOptions,
				returnRequestErrors: validateOptions.validateRequests,
				returnResponseErrors: validateOptions.validateResponses,
				schema,
				requestValidationFn: (
					req: Request,
					data: any,
					errors: any[]
				) => {
					throw new InvalidRequestError(
						ajvErrorsToValidatorError(errors)
					);
				},
				responseValidationFn: (
					req: Request,
					data: any,
					errors: any[]
				) => {
					throw new InvalidResponseError(
						ajvErrorsToValidatorError(errors)
					);
				},
			})
		);
	} else {
		// swagger v3
		const OpenApiValidator = require('express-openapi-validator');
		app.use(
			OpenApiValidator.middleware({
				...validateOptions,
				apiSpec: {
					...document,
					servers: [
						{
							url: config.baseUrl,
						},
					],
				},
			})
		);

		app.use(
			(err: Error, req: Request, res: Response, next: NextFunction) => {
				if (err instanceof OpenApiValidator.error.BadRequest) {
					return next(new InvalidRequestError((err as any).errors));
				}
				if (err instanceof OpenApiValidator.error.InternalServerError) {
					return next(new InvalidResponseError((err as any).errors));
				}
				next(err);
			}
		);
	}
}

function ajvErrorsToValidatorError(errors: any[]): ValidationErrorItem[] {
	return errors.map((e) => {
		const params: any = e.params;
		const required =
			params?.missingProperty &&
			e.dataPath + '.' + params.missingProperty;
		const additionalProperty =
			params?.additionalProperty &&
			e.dataPath + '.' + params.additionalProperty;
		const path =
			required ?? additionalProperty ?? e.dataPath ?? e.schemaPath;
		return {
			path,
			message: e.message,
			error_code: `${e.keyword}.openapi.validation`,
		};
	});
}
