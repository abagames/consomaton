var LiveReloadPlugin = require('webpack-livereload-plugin');
var glob = require('glob');

module.exports = {
  entry: glob.sync('./src/**/*.ts'),
  output: {
    path: './www',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', "", ".webpack.js", ".web.js", ".js"]
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: [
    new LiveReloadPlugin()
  ]
};