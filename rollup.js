'use strict'

const fs = require('fs');
const rollup = require('rollup');
const uglify = require('uglify-js');
const html = require('rollup-plugin-html');
const npm = require('rollup-plugin-node-resolve');

rollup.rollup({
  legacy: true,
  entry: 'index.js',
  external: ['jquery'],
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
        customAttrCollapse: /<%={1,2}.+?%>/,
        ignoreCustomFragments: [/<%={0,2}.+?%>/],
        customAttrSurround: [[/<%[^=].*?%>/, /<%[^=].*?%>/]]
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
  fs.stat('dist', function(error) {
    if (error) {
      fs.mkdirSync('dist');
    }

    const src = 'dist/dialog.js';
    const min = 'dist/dialog.min.js';
    const map = 'dialog.js.map';

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

    result = uglify.minify({
      'dialog.js': result.code
    }, {
      compress: { ie8: true },
      mangle: { ie8: true },
      output: { ie8: true },
      sourceMap: { url: map }
    });

    fs.writeFileSync(min, result.code);
    console.log(`  Build ${ min } success!`);
    fs.writeFileSync(src + '.map', result.map);
    console.log(`  Build ${ src + '.map' } success!`);
  });
}).catch(function(error) {
  console.error(error);
});
