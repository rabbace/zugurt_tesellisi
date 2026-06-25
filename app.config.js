const { expo } = require('./app.json');

if (process.env.GH_PAGES_BASE_PATH) {
  expo.experiments = {
    ...expo.experiments,
    baseUrl: process.env.GH_PAGES_BASE_PATH,
  };
}

module.exports = { expo };
