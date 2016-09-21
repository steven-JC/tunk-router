var path = require('path')
var webpack = require('webpack')

module.exports = {
  //devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-hot-middleware/client',
    './index'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
	chunkFilename: '[id].chunk.js',
    publicPath: '/build/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
			test: /\.(js|jsx)$/,
			exclude: /(node_modules)/,
			loader: 'babel',
			query: {
              "presets": ["es2015", "stage-2", "react"],
              "plugins": ["transform-decorators-legacy"]
			},
		}
    ]
  }
}


// When inside Redux repo, prefer src to compiled version.
// You can safely delete these lines in your project.

