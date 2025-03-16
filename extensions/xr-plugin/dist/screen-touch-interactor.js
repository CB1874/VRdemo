'use strict';

Object.assign(exports, require("./class.js"));
const {
  ready: superReady,
  update: superUpdate,
  template: superTemplate,
  style: superStyle,
  methods: superMethods
} = exports;
exports.ready = function() {
  const panel = this;
  superReady.call(panel);
};
exports.update = function(dump) {
  const panel = this;
  panel.$this.dump = dump;
  superUpdate.call(panel, dump);
  Object.keys(dump.value).forEach((key, index) => {
    const info = dump.value[key];
    if (!info.visible) {
      return;
    }
    switch (info.type) {
      case "cc.SelectAction":
      case "cc.SelectMoveAction":
      case "cc.SelectRotateAction":
      case "cc.SelectScaleAction":
      case "cc.PlaceAction":
        updateActionProps(info, panel);
        break;
    }
  });
};
async function updateActionProps(info, panel) {
  const targetObjectPropID = `${info.type || info.name}:${info.path}`;
  const $targetObjectProp = panel.$propList[targetObjectPropID];
  const $targetObjectPropHeader = $targetObjectProp.querySelector('[slot="header"]');
  if ($targetObjectPropHeader) {
    let $checkbox = $targetObjectPropHeader.querySelector("ui-checkbox");
    if (!$checkbox) {
      $checkbox = document.createElement("ui-checkbox");
      $checkbox.setAttribute("class", "active");
      $checkbox.setAttribute("style", "white-space: nowrap; margin: 0px;");
      $checkbox.setAttribute("value", `${info.value._enable.value}`);
      $checkbox.setAttribute("actionType", info.type);
      $targetObjectPropHeader.appendChild($checkbox);
      $checkbox.addEventListener("confirm", async (event) => {
        enableActionProp($checkbox.getAttribute("actionType"), event.target.value, panel.$this.dump);
      });
    } else {
      $checkbox.setAttribute("value", `${info.value._enable.value}`);
    }
  }
}
async function enableActionProp(actionType, enabled, dump) {
  Editor.Message.send("scene", "snapshot");
  await Editor.Message.request("scene", "execute-component-method", {
    uuid: dump.value.uuid.value,
    name: "enableActionProp",
    args: [actionType, enabled]
  });
  Editor.Message.broadcast("scene:change-node", dump.value.node.value.uuid);
}
