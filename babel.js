const template = require('@babel/template').default;

const NAME = require('./package.json').name;
const processReferences = require('./src/process-references.js');

const styleSheetName = 'style9-css';

const styleSheetPath = `style9/css-loader!style9/css-loader/${styleSheetName}.css`;

const toURIComponent = rule => {
  const component = encodeURIComponent(rule).replace(/!/g, '%21');

  return component;
};

module.exports = function style9BabelPlugin() {
  return {
    name: NAME,
    visitor: {
      ImportDefaultSpecifier(path, state) {
        if (path.parent.source.value !== NAME) return;

        const importName = path.node.local.name;
        const bindings = path.scope.bindings[importName].referencePaths;

        const css = processReferences(bindings, state.opts).join('');
        if (!state.file.metadata.style9) {
          state.file.metadata.style9 = '';
        }
        state.file.metadata.style9 += css;
      },
      Program: {
        exit(path, state) {
          const params = toURIComponent(state.file.metadata.style9);

          path.unshiftContainer(
            'body',
            template.ast(`require("${styleSheetPath}?style=${params}");`)
          );
        }
      }
    }
  };
};
