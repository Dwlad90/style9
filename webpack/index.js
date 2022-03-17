/* eslint-disable max-len */
const { RawSource } = require('webpack-sources');
const pluginName = require('../package.json').name;
const loader = require.resolve('./loader');
const {
  getOptimizeAssetsHook,
  setPluginConfiguredOption,
  getAssetSourceContents
} = require('./utils');

// export const pluginName = 'Style9ExtractPlugin';
const styleSheetName = 'style9-css';

const pushNodeModulesExtractLoader = (compiler, options) => {
  if (!compiler.options.module) {
    throw new Error('module options not defined');
  }

  compiler.options.module.rules.push({
    test: {
      and: [/node_modules.+\.js$/, options.nodeModulesTest].filter(Boolean)
    },
    include: options.nodeModulesInclude,
    exclude: options.nodeModulesExclude,
    use: {
      loader,
      options: {
        outputCSS: true
      }
    }
  });
};

const forceCSSIntoOneStyleSheet = compiler => {
  const cacheGroup = {
    styles: {
      name: styleSheetName,
      type: 'css/mini-extract',
      chunks: 'all',
      // We merge only CSS from Compiled.
      test: /css-loader\/style9-css\.css$/,
      enforce: true
    }
  };

  if (!compiler.options.optimization) {
    compiler.options.optimization = {};
  }

  if (!compiler.options.optimization.splitChunks) {
    compiler.options.optimization.splitChunks = {
      cacheGroups: {}
    };
  }

  if (!compiler.options.optimization.splitChunks.cacheGroups) {
    compiler.options.optimization.splitChunks.cacheGroups = {};
  }

  Object.assign(
    compiler.options.optimization.splitChunks.cacheGroups,
    cacheGroup
  );
};

const getCSSAssets = assets => {
  return Object.keys(assets)
    .filter(assetName => {
      return assetName.endsWith(`${styleSheetName}.css`);
    })
    .map(assetName => ({
      name: assetName,
      source: assets[assetName],
      info: {}
    }));
};

class Style9Plugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    pushNodeModulesExtractLoader(compiler, this.options);
    forceCSSIntoOneStyleSheet(compiler);

    compiler.hooks.compilation.tap(pluginName, compilation => {
      setPluginConfiguredOption(compilation.options.module.rules, pluginName);

      getOptimizeAssetsHook(compiler, compilation).tap(pluginName, assets => {
        const cssAssets = getCSSAssets(assets);
        if (cssAssets.length === 0) {
          return;
        }
        const [asset] = cssAssets;
        const contents = getAssetSourceContents(asset.source);
        const newSource = new RawSource(contents);

        compilation.updateAsset(asset.name, newSource, asset.info);
      });
    });
  }
}

module.exports = Style9Plugin;

module.exports.loader = require.resolve('./loader.js');
