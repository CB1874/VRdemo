'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

const options = require('./options.8a4ee5c8.js');
require('fs');
require('path');

const optionConfig = {};
Object.keys(options.defaultOptions).forEach((key) => {
  optionConfig[key] = {
    default: options.defaultOptions[key]
  };
});
const cfg = {
  platformName: "i18n:xr-meta.title",
  doc: "editor/publish/native-options.html",
  panel: "./panel",
  hooks: "./hooks",
  commonOptions: {
    polyfills: {
      hidden: true
    }
  },
  options: Object.assign(optionConfig, {
    packageName: {
      default: options.defaultOptions.packageName,
      verifyRules: ["required"]
    },
    apiLevel: {
      default: options.defaultOptions.apiLevel,
      verifyRules: ["required"]
    }
  }),
  textureCompressConfig: {
    platformType: "android",
    support: {
      rgb: ["etc2_rgb", "etc1_rgb", "astc_4x4", "astc_5x5", "astc_6x6", "astc_8x8", "astc_10x5", "astc_10x10", "astc_12x12"],
      rgba: ["etc2_rgba", "etc1_rgb_a", "astc_4x4", "astc_5x5", "astc_6x6", "astc_8x8", "astc_10x5", "astc_10x10", "astc_12x12"]
    }
  },
  assetBundleConfig: {
    supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"]
  }
};
const configs = {
  "xr-meta": cfg
};

exports.configs = configs;
