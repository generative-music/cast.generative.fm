const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  plugins: [new HtmlWebpackPlugin({ template: './src/index.template.html' })],
};

module.exports = config;
