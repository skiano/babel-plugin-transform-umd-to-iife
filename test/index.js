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
  {
    file: 'classnames.min.js',
    test: (cn) => {
      cn('a', 'b')
    }
  },
]

function evalInContext(js, context) {
  return function() { return eval(js); }.call(context);
}

async function runTest({ file, options, test }, idx) {
  console.log(`> starting: ${file}`)

  options = Object.assign({
    globalName: `TestName${idx}`,
  }, options)

  const script = await readFile(require.resolve(`./fixtures/${file}`))

  let code

  try {
    const r = await transform(script, {
      plugins: [
        [require.resolve('../babel-plugin-transform-umd-to-iife.js'), options],
      ],
    })

    code = r.code

    global.window = {}
    eval(code)

    test(global[options.globalName] || global.window[options.globalName])
  } catch (e) {
    console.log(`> failed: ${file}\n\n${e.stack}\n\n${code.slice(0, 1500)}...`)
  } finally {
    delete global[options.globalName]
  }

  console.log(`> passed: ${file}`)
}

async function main() {
	await Promise.all(tests.map(runTest))
}

main().catch(e => {
  console.log(e)
  process.exit(1)
})
