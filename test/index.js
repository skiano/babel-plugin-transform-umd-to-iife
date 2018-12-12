const fs = require('fs')
const util = require('util')
const path = require('path')
const babel = require('@babel/core')
const assert = require('assert')
const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const transform = util.promisify(babel.transform)

async function runTest(file, idx) {
  const globalName = `TestName${idx}`
  const script = await readFile(require.resolve(`./fixtures/${file}`))

  let code

  try {
    const r = await transform(script, {
      plugins: [
        [require.resolve('../babel-plugin-transform-umd-to-iife.js'), {
          globalName: globalName,
        }],
      ],
    })

    code = r.code

    global.window = {}
    eval(code)

    assert(global[globalName] || global.window[globalName], `${globalName} is defined by ${file}`)

    console.log(`> passed: ${file}`)
  } catch (e) {
    console.log(`> failed: ${file}\n\n${e.stack}\n\n${'='.repeat(75)}\n\n${(code || '').slice(0, 1000)}...`)
  } finally {
    delete global[globalName]
  }
}

async function main() {
  const substring = process.argv[2] || '.js'

  const files = await readDir(path.resolve(__dirname, 'fixtures'))
  const tests = files.filter(v => v.includes(substring))

	await Promise.all(tests.map(runTest))
}

main().catch(e => {
  console.log(e)
  process.exit(1)
})
