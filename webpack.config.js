const path = require('path');

/** @type { import('webpack').Configuration } */
module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src/index.ts'),
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'index.js',
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        exclude: ['/node_modules/'],
        use: 'ts-loader',
      },
    ],
  },
};
