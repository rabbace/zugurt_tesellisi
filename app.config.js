const { expo } = require('./app.json');

if (process.env.GH_PAGES_BASE_PATH) {
  expo.experiments = {
    ...expo.experiments,
    baseUrl: process.env.GH_PAGES_BASE_PATH,
  };
}

if (process.env.ANDROID_VERSION_CODE) {
  expo.android = {
    ...expo.android,
    versionCode: Number(process.env.ANDROID_VERSION_CODE),
  };
}

module.exports = { expo };
