const fs = require('fs')
const util = require('util')
const babel = require('@babel/core')
const readFile = util.promisify(fs.readFile)
const transform = util.promisify(babel.transform)

const tests = [
	{
		file: 'react.js',
		test: (react) => {
			react.createElement('div', 'hello world')
		}
	},
	{
		file: 'react.min.js',
		test: (react) => {
			react.createElement('div', 'hello world')
		}
	},
	{
		file: 'redux.min.js',
		test: (redux) => {
			redux.createStore(_ => _)
		}
	},
]

function evalInContext(js, context) {
  return function() { return eval(js); }.call(context);
}

async function runTest({ file, options, test }) {
	options = Object.assign({
		globalName: 'TestName',
	}, options)

	console.log(`> running: ${file}`)
	const script = await readFile(require.resolve(`./fixtures/${file}`))
	const { code } = await transform(script, {
		plugins: [
			[require.resolve('../babel-plugin-transform-umd-to-iife.js'), options],
		],
	})

	eval(code)

	try {
		test(global[options.globalName])
	} catch (e) {
		console.log(`> failed: ${file}\n\n${code.slice(0, 1000)}`)
	} finally {
		delete global[options.globalName]
	}

	console.log(`> passed: ${file}`)
}

async function main() {
	for (let i = 0; i < tests.length; i += 1) {
		await runTest(tests[i])
	}
}

main().catch(e => {
	console.log(e)
	process.exit(1)
})
