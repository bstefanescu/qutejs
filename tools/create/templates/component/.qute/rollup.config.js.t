import BuildConfig  from './build.js';

const devMode = process.env.NODE_ENV === 'development';
const testMode = process.env.NODE_ENV === 'test';

const build = new BuildConfig({
	componentName: "%%componentName%%",
	devServerPort: parseInt(process.env.DEV_SERVER_PORT)
});

let config;

if (devMode) {
	// build a web bundle and starts a dev server
	config = build.dev();
} else if (testMode) {
	// build a test bundle containing all test files
	config = build.test();
} else {
	// build for production
	config = [
		build.lib(),
		build.web(),
		build.web({
			web: {minimize:true}
		}),
	];
}
export default config;
