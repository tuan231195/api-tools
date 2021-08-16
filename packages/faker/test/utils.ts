import { fromPairs } from 'lodash';
import path from 'path';
import { fs } from 'memfs';
import { promiseAll } from '@vdtn359/api-tools-core';
import * as utils from 'util';

const readFileAsync: any = utils.promisify(fs.readFile.bind(fs));

export const matchFsSnapshot = async (dir: string) => {
	const fileNames = fs.readdirSync(dir);

	const fileMap = await promiseAll(
		fromPairs(
			fileNames.map((fileName) => {
				const fileContent = readFileAsync(
					path.resolve(dir, fileName as string),
					{
						encoding: 'utf-8',
					}
				);
				return [fileName, fileContent];
			})
		)
	);
	expect(fileMap).toMatchSnapshot();
};
