const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = {
  output: {
    filename: '[name].[hash].js',
  },
  module: {
    rules: [{ test: /\.js$/, use: 'babel-loader' }],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.template.html' }),
    new CleanWebpackPlugin(),
  ],
};

module.exports = config;
