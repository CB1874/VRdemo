'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

const webCfg = {
  wrapWithFold: false,
  options: {
    asWebXR: {
      label: "i18n:xr-plugin.builder.asWebXR.label",
      description: "i18n:xr-plugin.builder.asWebXR.description",
      default: false,
      render: {
        ui: "ui-checkbox"
      }
    }
  },
  hooks: "./builder-hooks.js"
};
const cfg = {
  wrapWithFold: false,
  options: {
    enableAR: {
      label: "i18n:xr-plugin.builder.enableAR.label",
      description: "i18n:xr-plugin.builder.enableAR.description",
      default: false,
      render: {
        ui: "ui-checkbox"
      }
    }
  },
  hooks: "./builder-hooks.js"
};
const configs = {
  "web-mobile": webCfg,
  "android": cfg,
  "ios": cfg
};

exports.configs = configs;
