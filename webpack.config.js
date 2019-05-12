const path = require('path');
const webpackMerge = require('webpack-merge');

const base = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.module.js',
    library: 'vrm',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        use: 'tslint-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.glsl$/,
        use: 'raw-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: ['node_modules'],
  },
  externals: {
    three: 'three',
    'three/examples/jsm/loaders/GLTFLoader': 'three/examples/jsm/loaders/GLTFLoader'
  },
};

module.exports = [
  base,
  webpackMerge(base, {
    entry: path.resolve(__dirname, 'src', 'assign.ts'),
    output: {
      filename: 'index.js',
      library: '__three_vrm__',
      libraryTarget: 'var',
    },
    externals: {
      three: 'THREE',
      'three/examples/jsm/loaders/GLTFLoader': 'THREE'
    },
  }),
];
