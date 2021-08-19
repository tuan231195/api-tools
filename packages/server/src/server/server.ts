import { Config } from 'src/server/types';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import {
	parse,
	ParsedOperationSchemaWithInfo,
	ramlToExpress,
} from '@vdtn359/api-tools-core';
import fs from 'fs';
import requireDir from 'require-dir';
import { fakeOperationResponse } from '@vdtn359/api-tools-faker';
import { camelCase, mapKeys } from 'lodash';
import { NextFunction, Request, Response } from 'express';
import logger from 'src/logger';

export const startServer = async (config: Config) => {
	const express = require('express');

	const app = express();
	const router = express.Router();
	app.set('port', config.port || 3000);
	app.use(morgan('combined', { stream: { write: (msg) => logger(msg) } }));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	if (config.init && fs.existsSync(config.init)) {
		const init = require(config.init).default;
		logger('Call custom init');
		await init(app);
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
			}),
			(key) => camelCase(key)
		);
	}

	const { schema: parsedSchema } = await parse(config.uri);

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
				getRouteHandler(operation, overrideFunction)
			);
		})
	);
	router.use(config.baseUrl, apiRouter);
	app.use(router);

	app.use(errorHandler());

	app.listen(app.get('port'), function () {
		logger(`Express server listening on port ${app.get('port')}`);
	});
};

const getRouteHandler = (
	operation: ParsedOperationSchemaWithInfo,
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

	return async (request: Request, response: Response, next: NextFunction) => {
		const defaultResponse = defaultStatusStr
			? await fakeOperationResponse({
					schema: operation.schema,
					status: responseStatus,
			  })
			: undefined;
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
				if (finalResponse !== undefined) {
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
