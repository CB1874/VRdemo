'use strict';

function hasCameraComponent(node) {
  return node && node.components?.some((comp) => comp.type === "cc.Camera");
}
function hasRenderRoot2D(node) {
  return node && node.components?.some((comp) => comp.type === "cc.RenderRoot2D");
}
async function isNormalCameraNode(node) {
  let result = false;
  if (node.parent) {
    result = hasCameraComponent(node);
  }
  return result;
}
exports.onNodeMenu = async function(node) {
  const canTransformXR = await isNormalCameraNode(node);
  const renderRoot2D = await hasRenderRoot2D(node);
  return canTransformXR ? [
    {
      label: "i18n:xr-plugin.node.convert_main_camera_to_xr_hmd",
      async click() {
        Editor.Selection.clear("node");
        const { parent } = node;
        const parentChildrens = (await Editor.Message.request("scene", "query-node-tree", parent)).children;
        const orginIndex = parentChildrens.findIndex((child) => child.uuid === node.uuid);
        await Editor.Message.request("scene", "set-property", {
          uuid: node.uuid,
          path: "name",
          dump: {
            type: "string",
            value: "XR HMD"
          }
        });
        const xrUuid = await Editor.Message.request("scene", "create-node", {
          parent,
          assetUuid: "f3b49a5d-f32a-4694-a64b-9aa142e2adc3",
          unlinkPrefab: true
        });
        const nodeInfo = await Editor.Message.request("scene", "query-node", node.uuid);
        for (const path of ["position", "scale", "rotation"]) {
          await Editor.Message.request("scene", "set-property", {
            uuid: xrUuid,
            path,
            dump: nodeInfo[path]
          });
        }
        const nodeTree = await Editor.Message.request("scene", "query-node-tree", xrUuid);
        const TrackingSpace = nodeTree.children.find((node2) => node2.name === "TrackingSpace");
        const defaultXrMainCamera = TrackingSpace.children.find((node2) => node2.name === "XR HMD");
        if (defaultXrMainCamera) {
          const xrCameraInfo = await Editor.Message.request("scene", "query-node", defaultXrMainCamera.uuid);
          for (const path of ["position", "scale", "rotation"]) {
            await Editor.Message.request("scene", "set-property", {
              uuid: node.uuid,
              path,
              dump: xrCameraInfo[path]
            });
          }
          const oldComponents = xrCameraInfo.__comps__;
          for (const dump of oldComponents) {
            if (dump.type !== "cc.Camera") {
              await Editor.Message.request("scene", "create-component", {
                uuid: node.uuid,
                component: dump.cid
              });
              const nodeDump = await Editor.Message.request("scene", "query-node", node.uuid);
              const length = nodeDump.__comps__ && nodeDump.__comps__.length;
              if (length) {
                const lastIndex = length - 1;
                await Editor.Message.request("scene", "set-property", {
                  uuid: node.uuid,
                  path: `__comps__.${lastIndex}`,
                  dump
                });
              }
            }
          }
          await Editor.Message.request("scene", "set-parent", {
            parent: node.uuid,
            uuids: defaultXrMainCamera.children.map((eye) => eye.uuid),
            keepWorldTransform: false
          });
          await Editor.Message.request("scene", "remove-node", {
            uuid: defaultXrMainCamera.uuid
          });
        }
        await Editor.Message.request("scene", "set-parent", {
          parent: TrackingSpace.uuid,
          uuids: node.uuid,
          keepWorldTransform: false
        });
        Editor.Message.send("scene", "move-array-element", {
          uuid: TrackingSpace.uuid,
          path: "children",
          target: TrackingSpace.children.length - 1,
          offset: (TrackingSpace.children.length - 1) * -1
        });
        nodeTree.children.forEach((child) => {
          if (child.name.includes("XR Controller")) {
            Editor.Message.send("scene", "remove-node", {
              uuid: child.uuid
            });
          }
        });
        const targetIndex = parentChildrens.length - 1;
        Editor.Message.send("scene", "move-array-element", {
          uuid: parent,
          path: "children",
          target: targetIndex,
          offset: orginIndex - targetIndex
        });
        Editor.Metrics._trackEventWithTimer({
          category: "xr",
          id: "A100001",
          value: 1
        });
      }
    },
    {
      label: "i18n:xr-plugin.node.convert_main_camera_to_ar_camera",
      async click() {
        Editor.Selection.clear("node");
        const { parent } = node;
        const parentChildrens = (await Editor.Message.request("scene", "query-node-tree", parent)).children;
        const orginIndex = parentChildrens.findIndex((child) => child.uuid === node.uuid);
        await Editor.Message.request("scene", "set-property", {
          uuid: node.uuid,
          path: "name",
          dump: {
            type: "string",
            value: "AR Camera"
          }
        });
        const xrUuid = await Editor.Message.request("scene", "create-node", {
          parent,
          assetUuid: "f3b49a5d-f32a-4694-a64b-9aa142e2adc3",
          unlinkPrefab: true
        });
        const nodeInfo = await Editor.Message.request("scene", "query-node", node.uuid);
        for (const path of ["position", "scale", "rotation"]) {
          await Editor.Message.request("scene", "set-property", {
            uuid: xrUuid,
            path,
            dump: nodeInfo[path]
          });
        }
        const nodeTree = await Editor.Message.request("scene", "query-node-tree", xrUuid);
        const TrackingSpace = nodeTree.children.find((node2) => node2.name === "TrackingSpace");
        const defaultXrMainCamera = TrackingSpace.children.find((node2) => node2.name === "XR HMD");
        if (defaultXrMainCamera) {
          const arCameraUuid = await Editor.Message.request("scene", "create-node", {
            parent: TrackingSpace.uuid,
            assetUuid: "1cfd5c31-2bca-45f0-9b8d-18ec94803da3",
            unlinkPrefab: true
          });
          const xrCameraInfo = await Editor.Message.request("scene", "query-node", defaultXrMainCamera.uuid);
          for (const path of ["position", "scale", "rotation"]) {
            await Editor.Message.request("scene", "set-property", {
              uuid: node.uuid,
              path,
              dump: xrCameraInfo[path]
            });
          }
          const arCameraInfo = await Editor.Message.request("scene", "query-node", arCameraUuid);
          await Editor.Message.request("scene", "remove-node", {
            uuid: arCameraUuid
          });
          const oldComponents = arCameraInfo.__comps__;
          for (const dump of oldComponents) {
            if (dump.type === "cc.Camera") {
              await Editor.Message.request("scene", "set-property", {
                uuid: node.uuid,
                path: "__comps__.0.clearFlags",
                dump: dump.value.clearFlags
              });
              await Editor.Message.request("scene", "set-property", {
                uuid: node.uuid,
                path: "__comps__.0.clearColor",
                dump: dump.value.clearColor
              });
            } else {
              await Editor.Message.request("scene", "create-component", {
                uuid: node.uuid,
                component: dump.cid
              });
              const nodeDump = await Editor.Message.request("scene", "query-node", node.uuid);
              const length = nodeDump.__comps__ && nodeDump.__comps__.length;
              if (length) {
                const lastIndex = length - 1;
                await Editor.Message.request("scene", "set-property", {
                  uuid: node.uuid,
                  path: `__comps__.${lastIndex}`,
                  dump
                });
              }
            }
          }
          await Editor.Message.request("scene", "remove-node", {
            uuid: defaultXrMainCamera.uuid
          });
        }
        await Editor.Message.request("scene", "set-parent", {
          parent: TrackingSpace.uuid,
          uuids: node.uuid,
          keepWorldTransform: false
        });
        Editor.Message.send("scene", "move-array-element", {
          uuid: TrackingSpace.uuid,
          path: "children",
          target: TrackingSpace.children.length - 1,
          offset: (TrackingSpace.children.length - 1) * -1
        });
        const targetIndex = parentChildrens.length - 1;
        Editor.Message.send("scene", "move-array-element", {
          uuid: parent,
          path: "children",
          target: targetIndex,
          offset: orginIndex - targetIndex
        });
      }
    }
  ] : !renderRoot2D ? [
    {
      label: "i18n:xr-plugin.node.convert_2dui_to_3dui",
      async click() {
        const components = await Editor.Message.request("scene", "query-components", "bcf86a97-add4-4c3b-a034-0fc50e53f919");
        for (const component of components) {
          if (component.name === "cc.Convert2DUITo3DUI") {
            await Editor.Message.request("scene", "create-component", {
              uuid: node.uuid,
              component: component.cid
            });
          }
        }
      }
    }
  ] : [];
};
