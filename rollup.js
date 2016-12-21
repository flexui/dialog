'use strict'

const fs = require('fs');
const rollup = require('rollup');
const uglify = require('uglify-js');
const html = require('rollup-plugin-html');
const npm = require('rollup-plugin-node-resolve');

rollup.rollup({
  legacy: true,
  entry: 'index.js',
  plugins: [
    html({
      include: '**/*.html',
      htmlMinifierOptions: {
        removeComments: true,
        useShortDoctype: true,
        collapseWhitespace: true,
        trimCustomFragments: true,
        conservativeCollapse: false,
        removeEmptyAttributes: true,
        collapseBooleanAttributes: true,
        ignoreCustomFragments: [/<%={0,2}.+?%>/]
      }
    }),
    npm({
      // use "jsnext:main" if possible
      // – see https://github.com/rollup/rollup/wiki/jsnext:main
      jsnext: true, // Default: false
      // use "main" field or index.js, even if it's not an ES6 module
      // (needs to be converted from CommonJS to ES6
      // – see https://github.com/rollup/rollup-plugin-commonjs
      main: true, // Default: true
      // if there's something your bundle requires that you DON'T
      // want to include, add it to 'skip'. Local and relative imports
      // can be skipped by giving the full filepath. E.g.,
      // `path.resolve('src/relative-dependency.js')`
      skip: ['jquery'], // Default: []
      // some package.json files have a `browser` field which
      // specifies alternative files to load for people bundling
      // for the browser. If that's you, use this option, otherwise
      // pkg.browser will be ignored
      browser: false, // Default: false
      // not all files you want to resolve are .js files
      extensions: ['.js', '.json'], // Default: ['.js']
      // whether to prefer built-in modules (e.g. `fs`, `path`) or
      // local ones with the same names
      preferBuiltins: false // Default: true
    })
  ]
}).then(function(bundle) {
  let stat;
  const map = 'dialog.js.map';
  const src = 'dist/dialog.js';
  const min = 'dist/dialog.min.js';

  try {
    stat = fs.statSync('dist')
  } catch (e) {
    // no such file or directory
  }

  if (!stat) {
    fs.mkdirSync('dist');
  }

  let result = bundle.generate({
    format: 'umd',
    indent: true,
    useStrict: true,
    moduleId: 'dialog',
    moduleName: 'FlexUI',
    globals: { jquery: 'jQuery' }
  });

  fs.writeFileSync(src, result.code);
  console.log(`  Build ${ src } success!`);

  result = uglify.minify(result.code, {
    fromString: true,
    compress: { screw_ie8: false },
    mangle: { screw_ie8: false },
    output: { screw_ie8: false },
    outSourceMap: map
  });

  fs.writeFileSync(min, result.code);
  console.log(`  Build ${ min } success!`);
  fs.writeFileSync(src + '.map', result.map.replace('"sources":["?"]', '"sources":["dialog.js"]'));
  console.log(`  Build ${ src + '.map' } success!`);
}).catch(function(error) {
  console.error(error);
});
