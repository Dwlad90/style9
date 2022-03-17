const loader = require('./loader');

/**
 * Sets an option on the plugin config to tell loaders that the plugin has been configured.
 * Bundling will throw if this option is missing (i.e. consumers did not setup correctly).
 *
 * @param rules
 * @param pluginName
 * @returns
 */
const setPluginConfiguredOption = (rules, pluginName) => {
  for (const rule of rules) {
    const use = rule.use;
    if (!use || typeof use === 'string') {
      continue;
    }
    if (Array.isArray(use)) {
      if (!use.length) {
        continue;
      }
      for (const nestedUse of use) {
        if (typeof nestedUse !== 'object' || nestedUse.loader !== loader) {
          continue;
        }
        const { options } = nestedUse;
        console.log('!!!!!options1', options);

        if (!options || typeof options !== 'object' || !options['extract']) {
          continue;
        }
        options[pluginName] = true;
      }
    } else {
      if (typeof use === 'object' && use.loader === loader) {
        const { options } = use;
        console.log('!!!!!options2', options);
        if (!options || typeof options !== 'object' || !options['extract']) {
          continue;
        }
        options[pluginName] = true;
      }
    }
  }
};
module.exports.setPluginConfiguredOption = setPluginConfiguredOption;

/**
 * Returns the string representation of an assets source.
 *
 * @param source
 * @returns
 */
const getAssetSourceContents = assetSource => {
  const source = assetSource.source();
  if (typeof source === 'string') {
    return source;
  }

  return source.toString();
};

module.exports.getAssetSourceContents = getAssetSourceContents;

/**
 * Returns a webpack 4 & 5 compatible hook for optimizing assets.
 *
 * @param compilation
 * @returns
 */
const getOptimizeAssetsHook = (compiler, compilation) => {
  const { Compilation, version } =
    // Webpack 5 flow
    compiler.webpack ||
    // Webpack 4 flow
    require('webpack');
  const isWebpack4 = version.startsWith('4.');
  const optimizeAssets =
    // Webpack 5 flow
    compilation.hooks.processAssets ||
    // Webpack 4 flow
    compilation.hooks.optimizeAssets;

  return {
    tap: (pluginName, callback) => {
      optimizeAssets.tap(
        isWebpack4
          ? pluginName
          : {
              name: pluginName,
              stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
            },
        callback
      );
    }
  };
};

module.exports.getOptimizeAssetsHook = getOptimizeAssetsHook;

/**
 * Returns webpack 4 & 5 compatible sources.
 * @returns
 */
const getSources = compiler => {
  const { sources } =
    // Webpack 5 flow
    compiler.webpack ||
    // Webpack 4 flow
    {};

  return (
    // Webpack 5 flow
    sources ||
    // Webpack 4 flow
    require('webpack-sources')
  );
};

module.exports.getSources = getSources;
