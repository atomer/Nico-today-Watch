const webpack = require('webpack');
const path = require('path');
const package = require('./package.json');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      }
    ]
  },
  entry: './libs/index.ts',
  output: {
    filename: 'todaywatch.user.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      banner: `/*!
// ==UserScript==
// @name        ${package.meta.name}
// @namespace   ${package.meta.namespace}
// @description ${package.description}
${package.meta.includes
  .map(i =>`// @include     ${i}`)
  .join('\n')}
// @grant       ${package.meta.grant}
// @version     ${package.version}
// ==/UserScript==
*/`
    })
  ]
};