import { omit } from 'lodash';

expect.addSnapshotSerializer({
	test(value: any) {
		return value && value.id && 'openApiVersion' in value;
	},
	print(value: any) {
		return JSON.stringify(value.content);
	},
});

expect.addSnapshotSerializer({
	test(value: any) {
		return value && value.operation && value.operationId;
	},
	print(value: any) {
		return JSON.stringify(omit(value, 'operation'));
	},
});
