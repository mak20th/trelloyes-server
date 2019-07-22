// this file will start our server on an appopriate port
const myApp = require('./app');
const { PORT } = require('./config');
//const PORT = process.env.PORT || 8000;

myApp.listen(PORT, () => {
  console.log (`Server listening at http://localhost:${PORT}`);
});