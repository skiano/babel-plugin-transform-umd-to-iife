// there will be a define that references the global scope
// it will most likely exist inside a ternary or an if/elseif/else tree

// @see https://github.com/amdjs/amdjs-api/wiki/AMD for specs
// the call signiture for a define is
// define(id?, dependencies?, factory);

/**
 * debugging helper
 */
// const { codeFrameColumns } = require('@babel/code-frame')
// function viewNode(state, node, msg) {
//   if (node.node) node = node.node // also handle paths
//   const result = codeFrameColumns(state.file.code, node.loc);
//   console.log(`\n${msg}\n\n${result}\n`)
// }

module.exports = function transformUMDToIIFE({ types: t }) {
  return {
    visitor: {
      CallExpression(defineCall, state) {
        const callee = defineCall.get('callee')

        if (t.isIdentifier(callee.node, { name: 'define' })) {
          const dependencies = state.opts.dependencies || {}
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

          // if exports
          //   factoryArg(globalRef.globalName = {}, ...rest)
          // else
          //   window.globalName = factoryArg(...dependecie refs)

          let args = dependencyArg
            ? dependencyArg.node.elements
            : []

          const exportsIdx = args.findIndex(a => t.isStringLiteral(a, { value: 'exports' }))
          const exportsArg = args[exportsIdx]
          if (exportsArg) args = args.slice(0, exportsIdx).concat(args.slice(exportsIdx + 1))

          const globalArgs = args.map(d => {
            let dependencyName = dependencies[d.value]

            if (!dependencyName) {
              dependencyName = d.value
              console.warn(`> no global name defined for '${d.value}'. Assumed ${dependencyName}`)
            }

            return t.MemberExpression(
              t.Identifier(globalRef),
              t.StringLiteral(dependencyName),
              true,
            )
          })

          if (exportsArg) {
            umdLogic.replaceWith(t.CallExpression(
              factoryArg.node,
              [
                t.AssignmentExpression(
                  "=",
                  t.MemberExpression(
                    t.Identifier(globalRef),
                    t.StringLiteral(state.opts.globalName),
                    true,
                  ),
                  t.ObjectExpression([])
                )
              ].concat(globalArgs)
            ))
          } else {
            umdLogic.replaceWith(t.AssignmentExpression(
              "=",
              t.MemberExpression(
                t.Identifier(globalRef),
                t.StringLiteral(state.opts.globalName),
                true,
              ),
              t.CallExpression(
                factoryArg.node,
                globalArgs,
              )
            ))
          }
        }
      },
    }
  }
}
