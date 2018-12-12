const nestedVisitor = {
  MemberExpression(path, state) {
    const globalName = state.globalRef
      ? state.globalRef.node.name
      : 'window'

    if (path.node.object.name === globalName) {
      const { t } = state
      path.get('property').replaceWith(t.Identifier(state.newName))
    }
  }
}

module.exports = function transformBundleImports({ types: t }) {
  return {
    visitor: {
      Program(path, state) {
        const e = path
          .get('body')[0]
          .get('expression')

        let instantiator

        // handle uglified expression
        if (t.isUnaryExpression(e) && e.node.operator === '!') {
          console.log('uglified umd')
          instantiator = e.get('argument').get('callee')
        } else {
          instantiator = e.get('callee')
        }

        const globalRef = instantiator.get('params')[0]

        // find where all the logic is
        const umdLogicExpression = (
          instantiator
            .get('body')
            .get('body')[0]
        )

        // then find the branch for global variable
        const globalExpression = (
          umdLogicExpression
            .get('expression')
            .get('alternate')
            .get('alternate')
        )

        // replace all the logic with the global expression
        umdLogicExpression.replaceWith(globalExpression)

        // replace the global names with custom var
        globalExpression.traverse(nestedVisitor, { globalRef, t, newName: state.opts.globalName })
      }
    }
  }
}
