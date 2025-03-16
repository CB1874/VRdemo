/*
Xiamen Yaji Software Co., Ltd., (the “Licensor”) grants the user (the “Licensee”) non-exclusive and non-transferable rights
to use the software according to the following conditions:

a.  The Licensee shall pay royalties to the Licensor, and the amount of those royalties and the payment method are subject
    to separate negotiations between the parties.
b.  The software is licensed for use rather than sold, and the Licensor reserves all rights over the software that are not
    expressly granted (whether by implication, reservation or prohibition).
c.  The open source codes contained in the software are subject to the MIT Open Source Licensing Agreement (see the attached
    for the details);
d.  The Licensee acknowledges and consents to the possibility that errors may occur during the operation of the software for
    one or more technical reasons, and the Licensee shall take precautions and prepare remedies for such events. In such
    circumstance, the Licensor shall provide software patches or updates according to the agreement between the two parties.
    The Licensor will not assume any liability beyond the explicit wording of this  Licensing Agreement.
e.  Where the Licensor must assume liability for the software according to relevant laws, the Licensor’s entire liability is
    limited to the annual royalty payable by the Licensee.
f.  The Licensor owns the portions listed in the root directory and subdirectory (if any) in the software and enjoys the
    intellectual property rights over those portions. As for the portions owned by the Licensor, the Licensee shall not:
    i.  Bypass or avoid any relevant technical protection measures in the products or services;
    ii. Release the source codes to any other parties;
    iii.Disassemble, decompile, decipher, attack, emulate, exploit or reverse-engineer these portion of code;
    iv. Apply it to any third-party products or services without Licensor’s permission;
    v.  Publish, copy, rent, lease, sell, export, import, distribute or lend any products containing these portions of code;
    vi. Allow others to use any services relevant to the technology of these codes; and
    vii.Conduct any other act beyond the scope of this Licensing Agreement.
g.  This Licensing Agreement terminates immediately if the Licensee breaches this Agreement. The Licensor may claim
    compensation from the Licensee where the Licensee’s breach causes any damage to the Licensor.
h.  The laws of the People's Republic of China apply to this Licensing Agreement.
i.  This Agreement is made in both Chinese and English, and the Chinese version shall prevail the event of conflict.
*/

import { _decorator, ccenum, instantiate, Node, director, Quat, Vec3, sys } from 'cc';
import { ARCameraMgr } from '../../ar-camera';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARActionData } from '../utils/ar-defines';
import { ActionType, ARTrackingType } from '../utils/ar-enum';
import { ARActionFallbackBase } from './action-base';

const { ccclass, property } = _decorator;

enum DisplayMethod {
    None,
    Z_Axis_of_Children_to_Camera,
    Y_Axis_of_Children_to_Camera,
    Change_Scene,
}
ccenum(DisplayMethod);

/**
 * @en
 * AR degraded behavior class
 * @zh
 * AR降级行为类
 */
@ccclass('cc.ARFallback')
export class ARFallback extends ARActionFallbackBase {
    @property({ serializable: true })
    protected _displayMethod = DisplayMethod.None;

    @property({ serializable: true })
    protected _zDistance = 0.5;

    @property({ serializable: true })
    protected _yDistance = 0.5;

    @property({ serializable: true })
    protected _fallBackScene = '';

    constructor () {
        super();
        this.type = ActionType.FALLBACK;
    }

    @property({
        type: DisplayMethod,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.action.fallback.displayMethod',
        })
    set displayMethod (val) {
        if (val === this._displayMethod) {
            return;
        }
        this._displayMethod = val;
    }
    get displayMethod () {
        return this._displayMethod;
    }

    @property({
        displayOrder: 2,
        displayName: 'distance',
        visible: (function (this: ARFallback) {
            return this.displayMethod === DisplayMethod.Z_Axis_of_Children_to_Camera;
            }),
        tooltip: 'i18n:xr-plugin.action.fallback.distance',
        })
    set zDistance (val) {
        if (val === this._zDistance) {
            return;
        }
        this._zDistance = val;
    }
    get zDistance () {
        return this._zDistance;
    }

    @property({
        displayOrder: 2,
        displayName: 'distance',
        visible: (function (this: ARFallback) {
            return this.displayMethod === DisplayMethod.Y_Axis_of_Children_to_Camera;
            }),
        tooltip: 'i18n:xr-plugin.action.fallback.distance',
        })
    set yDistance (val) {
        if (val === this._yDistance) {
            return;
        }
        this._yDistance = val;
    }
    get yDistance () {
        return this._yDistance;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: ARFallback) {
            return this.displayMethod === DisplayMethod.Change_Scene;
            }),
        tooltip: 'i18n:xr-plugin.action.fallback.fallBackScene',
        })
    set fallbackScene (val) {
        if (val === this._fallBackScene) {
            return;
        }
        this._fallBackScene = val;
    }
    get fallbackScene () {
        return this._fallBackScene;
    }

    public getActivated (trackingType: ARTrackingType | undefined) {
        if (trackingType === ARTrackingType.Image && sys.isBrowser) {
            //web run mindar , fallback invalid
            return true;
        }
        return this.activated;
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runFallbackAction (data: ARActionData) {
        if (!data.trackingNode || !data.trackableRootNode) {
            return;
        }
        const tb = data.trackingNode.getComponent(ARTrackingBase);
        if (this.getActivated(tb?.trackingType)) {
            return;
        }
        if (this._displayMethod === DisplayMethod.None) {
            // eslint-disable-next-line no-useless-return
            return;
        } else if (this._displayMethod === DisplayMethod.Change_Scene) {
            director.loadScene(this._fallBackScene);
        } else {
            const node: Node = instantiate(data.trackingNode);
            data.trackableRootNode.addChild(node);

            const trackingBase = node.getComponent(ARTrackingBase);
            if (trackingBase) {
                trackingBase.showChildren();
                trackingBase.destroy();
            }

            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr);
            const cameraNode = arCamera?.Camera?.node;
            if (cameraNode) {
                const rot = cameraNode.worldRotation;
                const dir = new Vec3();
                Quat.toAxisZ(dir, rot);
                dir.negative();
                let distance = this._zDistance;
                if (this._displayMethod === DisplayMethod.Y_Axis_of_Children_to_Camera) {
                    distance = this._yDistance;
                }
                dir.multiplyScalar(distance);
                node.setPosition(dir);
                // z face to camera
                node.lookAt(Vec3.ZERO);
                Quat.rotateAroundLocal(node.rotation, node.rotation, Vec3.UP, Math.PI);
                if (this._displayMethod === DisplayMethod.Y_Axis_of_Children_to_Camera) {
                    // Y face to camera
                    Quat.rotateAroundLocal(node.rotation, node.rotation, Vec3.RIGHT, Math.PI * 0.5);
                }
                node.setRotation(node.rotation);
            }
        }
        this.setActivated(true);
    }

    public runAction (data: ARActionData) {

    }

    /**
    * @en reset the action
    * @zh 重置行为
    */
    public resetAction (data: ARActionData) {
        super.resetAction(data);
    }

    public reset () {
        this.displayMethod = DisplayMethod.None;
        this.zDistance = 0.5;
        this.yDistance = 0.5;
        this.fallbackScene = '';
        this.setActivated(false);
    }
}
