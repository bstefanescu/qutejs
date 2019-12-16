/* An implementation for the Build task */
const rollup = require('rollup').rollup;


function buildProject(project, config) {
	rollup(config).then(bundle => Promise.all(
			outputs.map(output => bundle.write(output))
		)
	).catch(e=>onError(e, project, config));
}

module.exports = async function (project, config, args) {
	return await rollup(config).then(bundle => Promise.all(
			config.output.map(output => bundle.write(output))
		)
	);
}

