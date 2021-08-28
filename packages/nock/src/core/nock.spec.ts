import { nock } from 'src/core/nock';
import path from 'path';
import axios from 'axios';
import { createClient, createClientWithAxiosResponse } from 'src/generated';
import { initSeed } from '@vdtn359/api-tools-faker';
import { MockApi } from 'src/core/types';

initSeed('123');

const testDir = path.resolve(__dirname, '..', '..', '..', '..', 'test');

const baseURL = 'http://test.com';

describe('nock', () => {
	let mockApi: MockApi;

	beforeEach(async () => {
		mockApi = await nock(
			baseURL,
			path.resolve(testDir, 'v3', 'petstore.json')
		);
	});

	it('should mock the response', async () => {
		const axiosInstance = axios.create({
			baseURL,
		});
		const client = createClient(axiosInstance);
		mockApi
			.mock({
				operationId: 'createUser',
			})
			.fakeReply(200, {
				overrides: {
					id: 1,
				},
			});
		const response = await client.createUser({
			body: {
				id: '1',
			} as any,
		});
		expect(response).toMatchSnapshot();
	});

	it('should allow override function', async () => {
		const axiosInstance = axios.create({
			baseURL,
		});
		const overrideFunction = jest
			.fn()
			.mockImplementation(() => mockResponse);
		const client = createClientWithAxiosResponse(axiosInstance);
		const mockResponse: any = {
			id: 1,
			username: 'blah',
		};
		const mockRequest: any = {
			id: 1,
			firstName: 'John',
			lastName: 'Doe',
		};
		mockApi
			.mock(
				{
					methodName: 'put',
					path: '/user/{username}',
				},
				mockRequest
			)
			.fakeReply(
				{
					overrides: overrideFunction,
				},
				{
					'x-header': 'test',
				}
			);
		const response = await client.updateUser({
			body: mockRequest,
			path: {
				username: mockResponse.username,
			},
		});
		expect(response.data).toEqual(mockResponse);
		expect(response.headers).toEqual({
			'x-header': 'test',
			'content-type': 'application/json',
		});
		expect(overrideFunction).toHaveBeenCalledWith({
			body: mockRequest,
			fakeResponse: expect.objectContaining({ id: expect.any(String) }),
			uri: '/user/blah',
			params: { username: 'blah' },
		});
	});
});
