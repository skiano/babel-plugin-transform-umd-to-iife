// TODO: look for typeof define.amd&&define.amd (recursive search? or typeof)
// then back up to top of logic
// then find the global expression
// then replace names in global expression
// then replace logic with new global expression

const nestedVisitor = {
  MemberExpression(path, state) {
    if (path.node.object.name === state.globalRoot && path.node.property.name !== state.newName) {
      const { t } = state
      path.get('property').replaceWith(t.Identifier(state.newName))

      const statement = path.getStatementParent()

      const assignment = path.parentPath

      if (t.isCallExpression(assignment.parentPath.node)) {
        statement.replaceWith(assignment.parentPath)
      } else {
        statement.replaceWith(assignment)
      }
    }
  }
}

module.exports = function transformBundleImports({ types: t }) {
  return {
    visitor: {
      UnaryExpression(path, state) {
        if (path.node.operator === 'typeof') {
          const arg = path.get('argument')

          if (
            (t.isIdentifier(arg.node, { name: 'define' })) ||
            (t.isMemberExpression(arg) && arg.get('object').node.name === 'define')
          ) {
            const func = path.getFunctionParent()

            const globalRoot = func.get('params')[0]
              ? func.get('params')[0].node.name
              : 'window'

            func.traverse(nestedVisitor, {
              newName: state.opts.globalName,
              globalRoot,
              t,
            })
          }
        }
      },

      Program(path, state) {
        // console.log(
        //     path
        //       .get('body')[0]
        //       // .get('expression')
        //       .node
        // )
        // console.log(
        //   path
        //     .get('body')[0]
        //     .get('expression')
        //     .get('left')
        //     .node
        // )
        // const e = path
        //   .get('body')[0]
        //   .get('expression')
        //
        // let instantiator
        //
        // // handle uglified expression
        // if (t.isUnaryExpression(e) && e.node.operator === '!') {
        //   instantiator = e.get('argument').get('callee')
        // } else {
        //   instantiator = e.get('callee')
        // }
        //
        // const globalRef = instantiator.get('params')[0]
        //
        // // find where all the logic is
        // const umdLogicExpression = (
        //   instantiator
        //     .get('body')
        //     .get('body')[0]
        // )
        //
        // // then find the branch for global variable
        // const globalExpression = (
        //   umdLogicExpression
        //     .get('expression')
        //     .get('alternate')
        //     .get('alternate')
        // )
        //
        // // replace all the logic with the global expression
        // umdLogicExpression.replaceWith(globalExpression)
        //
        // // replace the global names with custom var
        // globalExpression.traverse(nestedVisitor, { globalRef, t, newName: state.opts.globalName })
      }
    }
  }
}
