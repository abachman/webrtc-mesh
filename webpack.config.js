/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: path.resolve('src/index.ts'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'webrtc-mesh.js',
    // libraryTarget: 'umd',
    // globalObject: 'this',
    // libraryExport: 'default',
    library: 'WebRTCMesh',
  },
  plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
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
  resolve: {
    modules: [path.resolve('node_modules'), path.resolve('src')],
    extensions: ['.ts', '.js'],
  },
}
