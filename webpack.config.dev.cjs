const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './js/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true,
    publicPath: '/'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8084,
    open: true,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: true
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      favicon: './favicon.ico'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'robots.txt', to: 'robots.txt', noErrorOnMissing: true },
        { from: 'site.webmanifest', to: 'site.webmanifest', noErrorOnMissing: true },
        { from: 'icon.png', to: 'icon.png', noErrorOnMissing: true },
        { from: 'icon.svg', to: 'icon.svg', noErrorOnMissing: true }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  devtool: 'eval-source-map'
};