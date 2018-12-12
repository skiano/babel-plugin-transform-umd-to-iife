// there will be a define that references the global scope
// it will most likely exist inside a ternary or an if/elseif/else tree

const replaceUMDLogicWithGlobal = {
  MemberExpression(path, state) {
    // if (path.node.object.name === state.globalRoot) {
    //   console.log('---')
    //   console.log(path.getStatementParent().node)
    //   console.log('---')
    // }

    if (path.node.object.name === state.globalRoot && path.node.property.name !== state.newName) {
      const { t } = state

      // replace global name with new name
      path.get('property').replaceWith(t.Identifier(state.newName))
      path.scope.rename(`${state.globalRoot}.${state.newName}`, 'global.b')

      // find the logic statement for umd
      const statement = path.getStatementParent()

      // its probably a nested ternary or a if / else

      // figure out the assignment
      const assignment = path.parentPath

      // then replace it with just the global assignment part
      if (t.isCallExpression(assignment.parentPath.node)) {
        statement.replaceWith(assignment.parentPath)
      } else if (t.isAssignmentExpression(assignment)) {
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

          // if this looks like it is checking for define
          if (
            // typeof define === 'function'
            (t.isIdentifier(arg.node, { name: 'define' })) ||
            // "function" == typeof define
            (t.isMemberExpression(arg) && arg.get('object').node.name === 'define')
          ) {
            // find the enclosing function
            const func = path.getFunctionParent()

            // the global object should be the first arg passed
            // otherwise it might just be window
            const globalRoot = func.get('params')[0]
              ? func.get('params')[0].node.name
              : 'window'

            // look inside the function for the global assignment
            func.traverse(replaceUMDLogicWithGlobal, {
              newName: state.opts.globalName,
              globalRoot,
              t,
            })
          }
        }
      },
    }
  }
}
