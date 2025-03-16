'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

const fs = require('fs');
const require$$1 = require('path');

const _interopDefaultLegacy = e => e && typeof e === 'object' && 'default' in e ? e : { default: e };

const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);

const globalCache = {
  pluginPath: "",
  xrPlatforms: [],
  installInProject: false,
  installInGlobal: false
};
const methods = {
  "create-node"(...args) {
    Editor.Message.send("scene", "create-node", ...args);
  },
  async autoInstallXrBuild() {
    const platformPath = require$$1__default.default.join(globalCache.pluginPath, "./platforms");
    if (!fs__default.default.existsSync(platformPath)) {
      return;
    }
    const folders = fs__default.default.readdirSync(platformPath, { withFileTypes: true }).filter((v) => {
      if (v.isDirectory()) {
        if (process.platform === "win32") {
          return !["ar-ios"].includes(v.name);
        }
        return true;
      }
      return false;
    }).map((v) => v.name);
    const xrPlaforms = folders.map((v) => require$$1__default.default.resolve(platformPath, v));
    for (const folder of xrPlaforms) {
      await Editor.Package.register(folder);
      await Editor.Package.enable(folder);
    }
    globalCache.xrPlatforms = xrPlaforms;
  },
  async open() {
    Editor.Panel.open("xr-plugin");
  },
  async agree(v) {
    if (v) {
      methods.autoInstallXrBuild();
    } else {
      await Editor.Package.disable(globalCache.pluginPath, true);
    }
  },
  async toggleEnableXR(enable) {
    const data = await Editor.Profile.getProject("engine", "modules");
    ["xr"].forEach((module) => {
      if (!data.cache[module])
        return;
      data.cache[module]._value = enable;
      const _index = data.includeModules.findIndex((v) => v === module);
      if (enable) {
        if (_index === -1) {
          data.includeModules.push(module);
        }
      } else {
        if (_index !== -1) {
          data.includeModules.splice(_index, 1);
        }
      }
    });
    await Editor.Profile.setProject("engine", "modules", data);
    Editor.Message.send("project", "refresh-settings-tab", "engine", "modules");
    Editor.Message.broadcast("engine:modules-changed");
  }
};
const load = async function() {
  globalCache.pluginPath = this.path;
  const isAgree = await Editor.Profile.getConfig("xr-plugin", "document.agree", "global");
  if (isAgree) {
    methods.autoInstallXrBuild();
  } else {
    methods.open();
  }
  exports.methods.toggleEnableXR(true);
};
const unload = async function() {
  for (const v of globalCache.xrPlatforms) {
    await Editor.Package.disable(v, true);
    await Editor.Package.unregister(v);
  }
  exports.methods.toggleEnableXR(false);
};

exports.load = load;
exports.methods = methods;
exports.unload = unload;
