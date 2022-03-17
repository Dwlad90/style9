const path = require('path');
const babel = require('@babel/core');
const loaderUtils = require('loader-utils');
const babelPlugin = require('../babel.js');

const styleSheetName = 'style9';

const styleSheetPath = `style9/css-loader!style9/css-loader/${styleSheetName}.css`;

const toURIComponent = rule => {
  const component = encodeURIComponent(rule).replace(/!/g, '%21');

  return component;
};

async function style9Loader(input, inputSourceMap) {
  const {
    inlineLoader = '',
    outputCSS = true,
    parserOptions = {
      plugins: ['typescript', 'jsx']
    },
    ...options
  } = loaderUtils.getOptions(this) || {};

  this.async();

  try {
    const { code, map, metadata } = await babel.transformAsync(input, {
      plugins: [[babelPlugin, options]],
      inputSourceMap: inputSourceMap || true,
      sourceFileName: this.resourcePath,
      filename: path.basename(this.resourcePath),
      sourceMaps: true,
      parserOpts: parserOptions,
      babelrc: false
    });

    if (metadata.style9 === undefined) {
      this.callback(null, input, inputSourceMap);
    } else if (!outputCSS) {
      this.callback(null, code, map);
    } else {
      this.cacheable(false);

      const params = toURIComponent(metadata.style9);

      const cssFileImport = `require("${inlineLoader + styleSheetPath}?style=${params}");`;

      this.callback(null, code + cssFileImport, map);
    }
  } catch (error) {
    this.callback(error);
  }
}

module.exports = style9Loader;
