const path = require('path');
const babel = require('@babel/core');
const loaderUtils = require('loader-utils');
const babelPlugin = require('../babel.js');

async function style9Loader(input, inputSourceMap) {
  const {
    outputCSS = true,
    parserOptions = {
      plugins: ['typescript', 'jsx']
    },
    ...options
  } = loaderUtils.getOptions(this) || {};

  this.async();

  try {
    const babelFileResult = babel.transformSync(input, {
      plugins: [[babelPlugin, options]],
      inputSourceMap: inputSourceMap || true,
      sourceFileName: this.resourcePath,
      filename: path.basename(this.resourcePath),
      sourceMaps: true,
      parserOpts: parserOptions,
      babelrc: false,

      configFile: false
    });

    const { code, map, metadata } = babelFileResult;

    if (metadata.style9 === undefined) {
      this.callback(null, input, inputSourceMap);
    } else {
      if (outputCSS) {
        this.cacheable(false);
      }

      this.callback(null, code, map);
    }
  } catch (error) {
    this.callback(error);
  }
}

module.exports = style9Loader;
