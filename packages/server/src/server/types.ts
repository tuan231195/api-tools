export type Config = {
	port?: number;
	baseUrl?: string;
	overrides?: string;
	routes?: string;
	init?: string;
	uri: string;
	seed?: string;
	validate?: boolean | ValidateOptions;
};

export type ValidateOptions = {
	validateRequests?: boolean;
	validateResponses?: boolean;
};

export const defaultValidateOptions: ValidateOptions = {
	validateRequests: true,
	validateResponses: false,
};

export class InvalidRequestError extends Error {
	constructor(public readonly errors: ValidationErrorItem[]) {
		super('Invalid Request Error');
		this.name = 'InvalidRequestError';
	}
}

export class InvalidResponseError extends Error {
	constructor(public readonly errors: ValidationErrorItem[]) {
		super('Invalid Response Error');
		this.name = 'InvalidResponseError';
	}
}

export interface ValidationErrorItem {
	message: string;
	error_code?: string;
	path?: string;
}
