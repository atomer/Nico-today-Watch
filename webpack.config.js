const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'todaywatch.user.js',
    path: path.resolve(__dirname, 'dist'),
  },
};