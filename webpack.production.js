/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

const browser = {
  mode: 'production',
  devtool: 'source-map',
  entry: path.resolve('src/index.ts'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'webrtc-mesh.min.js',
    library: 'WebRTCMesh',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  plugins: [
    // fix "process is not defined" error
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    modules: [path.resolve('node_modules'), path.resolve('src')],
    extensions: ['.ts', '.js'],
  },
}

const server = {
  ...browser,
  target: 'node',
  output: {
    ...browser.output,
    filename: 'webrtc-mesh.node.js',
  },
  plugins: [],
}

module.exports = [browser, server]
