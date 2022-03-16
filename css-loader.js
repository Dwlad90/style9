const { URLSearchParams } = require('url');

/**
 * CSSLoader will take the style query params added by `./compiled-loader.ts` and turn it into CSS.
 */
function CSSLoader() {
  const query = new URLSearchParams(this.resourceQuery);
  const styleRule = query.get('style');
  return styleRule || '';
}

module.exports = CSSLoader;

/**
 * Moves CSSloader to the end of the loader queue so it runs first.
 */
function pitch() {
  if (this.loaders[0].pitch !== pitch) {
    // If the first loader isn't this one - skip.
    return;
  }

  // The first loader is Compiled's css-loader - we need to shift
  // it to be at the end of the loader chain so it runs first (instead of last).
  const firstLoader = this.loaders.shift();
  this.loaders.push(firstLoader);
}
module.exports.pitch = pitch;
