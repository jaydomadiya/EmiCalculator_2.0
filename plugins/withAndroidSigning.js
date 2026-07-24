require("dotenv").config();

const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {

    if (!config.modResults.contents.includes("upload-keystore.jks")) {

      config.modResults.contents += `

android {
    signingConfigs {
        release {
            storeFile file("../../upload-keystore.jks")
            storePassword "${process.env.MYAPP_UPLOAD_STORE_PASSWORD}"
            keyAlias "upload"
            keyPassword "${process.env.MYAPP_UPLOAD_KEY_PASSWORD}"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;
    }

    return config;
  });
};