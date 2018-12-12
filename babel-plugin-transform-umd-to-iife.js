const { codeFrameColumns } = require('@babel/code-frame')

// there will be a define that references the global scope
// it will most likely exist inside a ternary or an if/elseif/else tree

// @see https://github.com/amdjs/amdjs-api/wiki/AMD for specs

// the call signiture for a define is
// define(id?, dependencies?, factory);

/**
 * debugging helper
 */
function viewNode(state, node, msg) {
  if (node.node) node = node.node // also handle paths
  const result = codeFrameColumns(state.file.code, node.loc);
  console.log(`\n${msg}\n\n${result}\n`)
}

module.exports = function transformBundleImports(o) {
  const { types: t } = o
  return {
    visitor: {
      CallExpression(defineCall, state) {
        const callee = defineCall.get('callee')

        if (t.isIdentifier(callee.node, { name: 'define' })) {
          const caller = defineCall.getFunctionParent()
          const callerBody = caller.get('body')
          const defineAgs = defineCall.get('arguments')
          const factoryArg = defineAgs[defineAgs.length - 1]
          const dependencyArg = defineAgs.find(t.isArrayExpression)

          const globalRef = caller.node.params[0]
            ? caller.node.params[0].name
            : 'window'

          // walk out until you hit the calling functions body
          // the last thing you walked from should be the ternary or logic block
          // that needs to be replaces
          let i = 0
          let umdLogic
          defineCall.findParent((p) => {
            if (p === callerBody) return true
            umdLogic = p
          })

          console.log('dependencies')
          console.log(dependencyArg.node)

          // if exports
          //   factoryArg(globalRef.globalName = {})
          // else
          //   window.globalName = factoryArg()



          // console.log(defineCall.node)

          // viewNode(state, prev, `umd logic`)

          // path.replaceWithMultiple([
          //   t.expressionStatement(t.stringLiteral("Is this the real life?")),
          //   t.expressionStatement(t.stringLiteral("Is this just fantasy?")),
          //   t.expressionStatement(t.stringLiteral("(Enjoy singing the rest of the song in your head)")),
          // ]);

          // console.log(instantiator)
          //
          // // The dependencies argument is optional. If omitted, it should default to ["require", "exports", "module"].
          //
          // if (defineAgs.length = 1) {
          //
          // }

          // if the

          // console.log(path.get('arguments').length)
        }
      },
    }
  }
}
