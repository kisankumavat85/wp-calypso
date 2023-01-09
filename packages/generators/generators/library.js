import { actions, prompts } from './constants.js';

const libraryGenerator = {
	description: 'Add a library package',
	prompts,
	actions: () => [
		...actions,
		{
			type: 'add',
			path: '../{{kebabCase name}}/package.json',
			templateFile: 'templates/library/package.json.hbs',
			abortOnFail: true,
		},
		{
			type: 'add',
			path: '../{{kebabCase name}}/src/index.ts',
			templateFile: 'templates/library/index.js.hbs',
			abortOnFail: true,
		},
	],
};

export default libraryGenerator;
