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

module.exports = function transformBundleImports({ types: t }) {
  return {
    visitor: {
      CallExpression(defineCall, state) {
        const callee = defineCall.get('callee')

        if (t.isIdentifier(callee.node, { name: 'define' })) {
          const caller = defineCall.getFunctionParent()
          const callerBody = caller.get('body')
          const defineAgs = defineCall.get('arguments')
          const factoryArg = defineAgs[defineAgs.length - 1]
          const dependencyArg = defineAgs.find(t.isArrayExpression) || []
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

          const newFactoryArgs = dependencyArg.node.elements.map(d => {
            console.log(d)
            return t.MemberExpression(
              t.Identifier(globalRef),
              t.stringLiteral(d.value),
              true,
              false,
            )
          })

          // if there is no 'exports'
          // umdLogic.replaceWith(t.AssignmentExpression(
          //   "=",
          //   t.MemberExpression(
          //     t.Identifier(globalRef),
          //     t.Identifier(state.opts.globalName),
          //   ),
          //   t.CallExpression(
          //     factoryArg.node,
          //     newFactoryArgs,
          //   )
          // ))

          // otherwise
          umdLogic.replaceWith(t.CallExpression(
            factoryArg.node,
            [
              t.AssignmentExpression(
                "=",
                t.MemberExpression(
                  t.Identifier(globalRef),
                  t.Identifier(state.opts.globalName),
                ),
                t.ObjectExpression([])
              )
            ]
          ))

          // for each dependency
          //   if it is exports, replact it with factoryArg.name(globalRef.globalName = {})
          //   transform it to a MemberExpression (globalRef[dependencyIdentifier.nam])

          // if exports
          //   factoryArg(globalRef.globalName = {}, ...rest)
          // else
          //   window.globalName = factoryArg(...dependecie refs)
        }
      },
    }
  }
}
