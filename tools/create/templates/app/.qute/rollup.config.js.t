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
		//build.lib(), // web only build web artifacts for applications
		build.web({
			css: {
				extract: true // extract the css in a file
			}
		}),
		build.web({
			minimize:true,
			css: {
				extract: true // extract the css in a file
			}
		}),
	];
}
export default config;
