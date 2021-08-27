import { Request } from 'express';

export default function handler({
	request,
	fakeResponse,
}: {
	request: Request;
	fakeResponse: any;
}) {
	return fakeResponse.map((pet: any, index: number) => ({
		...pet,
		name: `Pet ${index} (Query ${request.query.status || ''})`,
	}));
}
