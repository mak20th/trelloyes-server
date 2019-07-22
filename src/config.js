//JavaScript file to keep track values that are in example.env and set sensible defaults if necessary
module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};