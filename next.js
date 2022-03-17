const Style9Plugin = require('./webpack/index.js');

module.exports = (pluginOptions = {}) => (nextConfig = {}) => {
  return {
    ...nextConfig,
    webpack(config, options) {
      const outputCSS = !options.isServer;

      // The style9 compiler must run on source code, which means it must be
      // configured as the last loader in webpack so that it runs before any
      // other transformation.

      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options);
      }

      // For some reason, Next 11.0.1 has `config.optimization.splitChunks`
      // set to `false` when webpack 5 is enabled.
      // config.optimization.splitChunks = config.optimization.splitChunks || {
      //   cacheGroups: {}
      // };

      config.module.rules.push({
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        use: [
          {
            loader: Style9Plugin.loader,
            options: {
              outputCSS,
              ...pluginOptions
            }
          }
        ]
      });

      if (outputCSS) {
        // config.optimization.splitChunks.cacheGroups.styles = {
        //   name: 'styles',
        //   test: /\.css$/,
        //   chunks: 'all',
        //   enforce: true
        // };

        config.plugins.push(new Style9Plugin());
      }

      return config;
    }
  };
};
