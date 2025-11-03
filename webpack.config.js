const crypto = require('crypto');
const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProd = process.env.NODE_ENV === 'production';

const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  crypto_orig_createHash(algorithm == 'md4' ? 'sha256' : algorithm);

const webpackConfig = {
  mode: isProd ? 'production' : 'development',
  // NOTE: It does not use eval-source-map or any other kind of eval option
  // because of the Content Security Policy which we cannot have eval enabled.
  // If at some point we find out the build is too slow in development, we could disable
  // the csp plugin in development and use the eval-source-map option. But, it should
  // be avoided as much as possible because we wouldn't be testing the CSP rules in development
  // and we could miss something is blocked in production because of that.
  devtool: 'source-map',
  target: 'web',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: ['node_modules', 'src/renderer'],
  },
  entry: {},
  output: {},
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { configFile: 'tsconfig.build.json' },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|vendor)/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.s?css$/,
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'node_modules')],
              },
            },
          },
        ],
      },
      {
        test: /\.png$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              mimetype: 'image/png',
            },
          },
        ],
      },
      {
        test: /\.gif$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              mimetype: 'image/gif',
            },
          },
        ],
      },
      {
        test: /\.(?:eot|ttf|woff|woff2|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: isProd ? 'fonts/[name]-[hash:6].[ext]' : '[path][name]-[hash:6].[ext]',
              context: isProd ? 'context' : 'assets',
            },
          },
        ],
      },
    ],
    noParse: [/(html2canvas)/],
  },
  plugins: [
    // Configuration required for the connection-string module
    // TODO: https://github.com/sqlectron/sqlectron-gui/issues/656
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new HtmlWebpackPlugin({
      hot: !isProd,
      template: 'src/renderer/index.html',
      chunksSortMode: isProd ? 'none' : 'auto',
    }),
    new CspHtmlWebpackPlugin(
      // NOTE: It has unsafe-inline and disabled nonce and hash for style-src because of Ace
      // which adds style scripts in runtime. In case we ever move away from Ace,
      // we should review this configuration.
      {
        'base-uri': "'self'",
        'object-src': "'none'",
        // NOTE: unsafe-eval is required because of JointJS
        // https://github.com/sqlectron/sqlectron-gui/issues/663
        'script-src': ["'self'", "'unsafe-eval'"],
        'style-src': ["'unsafe-inline'", "'self'"],
        'img-src': ["'self'", 'data:;'],
      },
      {
        enabled: true,
        hashingMethod: 'sha256',
        hashEnabled: {
          'script-src': true,
          'style-src': false,
        },
        nonceEnabled: {
          'script-src': true,
          'style-src': false,
        },
      },
    ),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    }),
    new webpack.LoaderOptionsPlugin({
      debug: !isProd,
      options: {
        postcss: [autoprefixer()],
      },
    }),
  ],
};

if (isProd) {
  webpackConfig.entry = './src/renderer/entry.tsx';

  webpackConfig.output = {
    path: path.join(__dirname, 'out', 'static'),
    filename: '[name].bundle.js',
  };

  webpackConfig.plugins.push(new MiniCssExtractPlugin({ filename: '[name].bundle.css' }));

  webpackConfig.optimization = {
    minimize: true,
  };
} else {
  webpackConfig.resolve.alias = {
    'dtrace-provider': path.join(__dirname, 'empty-shim.js'),
  };

  webpackConfig.entry = ['./src/renderer/entry.tsx'];

  webpackConfig.output = {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/',
  };

  webpackConfig.devServer = {
    hot: true,
    port: 9000,
  };
}

module.exports = webpackConfig;
