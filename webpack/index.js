/* eslint-disable max-len */
const { SourceMapSource, RawSource } = require('webpack-sources');
const NAME = require('../package.json').name;
const processCSS = require('../src/process-css.js');
const loader = require.resolve('./loader');
const {
  getOptimizeAssetsHook,
  setPluginConfiguredOption,
  getAssetSourceContents
} = require('./utils');

// export const pluginName = 'Style9ExtractPlugin';
const styleSheetName = 'style9-css';
const pluginName = NAME;

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
        // We turn off baking as we're only interested in extracting from node modules (they're already baked)!
        outputCSS: true,
        [pluginName]: true
      }
    }
  });
};

const forceCSSIntoOneStyleSheet = compiler => {
  const cacheGroup = {
    style: {
      name: styleSheetName,
      type: 'css/mini-extract',
      chunks: 'all',
      // We merge only CSS from Compiled.
      test: /css-loader\/style9-css\.css$/,
      enforce: true
    },
    styles: {
      name: styleSheetName,
      type: 'css/mini-extract',
      chunks: 'all',
      // We merge only CSS from Compiled.
      test: /css-loader\/style9-css\.css$/,
      enforce: true
    },
    // styles: {
    //   name: 'styles',
    //   type: 'css/mini-extract',
    //   chunks: 'all',
    //   // We merge only CSS from Compiled.
    //   test: /css-loader\/style9-css\.css$/,
    //   enforce: true,
    // },
    style9CSS: {
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

// const setPluginConfiguredOption = (rules, pluginName) => {
//   for (const rule of rules) {
//     const use = rule.use;
//     if (!use || typeof use === 'string') {
//       continue;
//     }
//     if (Array.isArray(use)) {
//       if (!use.length) {
//         continue;
//       }
//       for (const nestedUse of use) {
//         if (typeof nestedUse !== 'object' || nestedUse.loader !== loader) {
//           continue;
//         }
//         const { options } = nestedUse;
//         console.log('!!!!!options1', options);

//         if (!options || typeof options !== 'object' || !options['extract']) {
//           continue;
//         }
//         options[pluginName] = true;
//       }
//     } else {
//       if (typeof use === 'object' && use.loader === loader) {
//         const { options } = use;
//         console.log('!!!!!options2', options);
//         if (!options || typeof options !== 'object' || !options['extract']) {
//           continue;
//         }
//         options[pluginName] = true;
//       }
//     }
//   }
// };

const getCSSAssets = assets => {
  return Object.keys(assets)
    .filter(assetName => {
      console.log('!!!!!! assetName', assetName);

      return assetName.endsWith(`${styleSheetName}.css`);
      // return assetName.endsWith(`.css`);
    })
    .map(assetName => ({
      name: assetName,
      source: assets[assetName],
      info: {}
    }));
};

class Style9Plugin {
  constructor(options = {}) {
    const { test = /\style9-css.css$/ } = options;
    this.test = test;
    this.options = options;
  }

  apply(compiler) {
    console.log('!!!!!!apply');
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

        console.log('!!!!!source', newSource);

        compilation.updateAsset(asset.name, newSource, asset.info);
      });
    });

    // compiler.hooks.compilation.tap(NAME, compilation => {
    //   setPluginConfiguredOption(compilation.options.module.rules, pluginName);

    //   if (compilation.hooks.processAssets) {
    //     compilation.hooks.processAssets.tap(
    //       {
    //         name: NAME,
    //         stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
    //       },
    //       assets => {
    //         const paths = Object.keys(assets);

    //         this._processFiles(compilation, paths);
    //       }
    //     );
    //   } else {
    //     compilation.hooks.optimizeChunkAssets.tapPromise(NAME, async chunks => {
    //       const paths = Array.from(chunks)
    //         .map(chunk => Array.from(chunk.files))
    //         .flat();

    //       this._processFiles(compilation, paths);
    //     });
    //   }
    // });
  }

  _processFiles(compilation, paths) {
    const filteredPaths = paths.filter(path => path.match(this.test));

    for (const path of filteredPaths) {
      const asset = compilation.assets[path];
      const { source, map } = asset.sourceAndMap();
      const postcssOpts = {
        to: path,
        from: path,
        map: { prev: map || false }
      };
      const result = processCSS(source, postcssOpts);

      if (result.map) {
        compilation.assets[path] = new SourceMapSource(
          result.css,
          path,
          JSON.parse(result.map),
          source,
          map,
          true
        );
      } else {
        compilation.assets[path] = new RawSource(result.css);
      }
    }
  }
}

module.exports = Style9Plugin;

module.exports.loader = require.resolve('./loader.js');
