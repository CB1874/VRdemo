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

import { director, _decorator, Node, Vec3, ccenum, Quat } from 'cc';
import { ARCameraMgr } from '../../ar-camera';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARActionData } from '../utils/ar-defines';
import { ActionType } from '../utils/ar-enum';
import { ARActionUpdateBase } from './action-base';

const { ccclass, property } = _decorator;

enum AlignmentStyle {
    Center,
}
enum AlignmentOrientation {
    World_Up,
    Local_Up,
}
ccenum(AlignmentStyle);
ccenum(AlignmentOrientation);

/**
 * @en
 * AR adaptive Alignment behavior class
 * @zh
 * AR自适应对齐的行为类
 */
@ccclass('cc.ARAlignment')
export class ARAlignment extends ARActionUpdateBase {
    @property({ serializable: true })
    protected _layout: AlignmentStyle = AlignmentStyle.Center;

    @property({ serializable: true })
    protected _upward: AlignmentOrientation = AlignmentOrientation.Local_Up;

    @property({ serializable: true })
    protected _faceToCamera = false;

    constructor () {
        super();
        this.type = ActionType.ALIGNMENT;
    }

    @property({type: AlignmentStyle, displayOrder: 1, visible: false})
    set layout (val) {
        if (val === this._layout) {
            return;
        }
        this._layout = val;
    }
    get layout () {
        return this._layout;
    }

    @property({
        type: AlignmentOrientation,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.action.alignment.towards'
        })
    set upward (val) {
        if (val === this._upward) {
            return;
        }
        this._upward = val;
    }
    get upward () {
        return this._upward;
    }

    @property({
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.action.alignment.faceToCamera'
        })
    set faceToCamera (val) {
        if (val === this._faceToCamera) {
            return;
        }
        this._faceToCamera = val;
    }
    get faceToCamera () {
        return this._faceToCamera;
    }

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.action.alignment.matchTrackingUpdate'
        })
    set matchTrackingUpdate (val) {
        if (val === this._matchTrackingUpdate) {
            return;
        }
        this._matchTrackingUpdate = val;
    }
    get matchTrackingUpdate () {
        return this._matchTrackingUpdate;
    }

    private _trackableNode: Node | null = null;

    private _updateAction (data: ARActionData) {
        if (!this._trackableNode) {
            return;
        }

        // update rotation
        data.trackablePose?.rotation.set(data.pose.rotation.clone());
        data.trackableNode?.rotation.set(data.pose.rotation.clone());
        if (this._upward === AlignmentOrientation.World_Up) {
            const rot = new Vec3();
            Quat.toEuler(rot, data.pose.rotation);
            if (data.trackableChildNode) {
                data.trackableChildNode?.setWorldRotationFromEuler(0, rot.y, 0);
            }
        }

        if (this._faceToCamera) {
            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr);
            if (arCamera?.Camera && data.trackablePose) {
                const dir = new Vec3();
                Vec3.subtract(dir, arCamera.Camera.node.position, data.trackablePose.position);

                if (this._upward === AlignmentOrientation.Local_Up) {
                    // 物体平面法向量
                    const vec3Y = Vec3.transformQuat(new Vec3(), Vec3.UP, data.trackablePose.rotation);
                    // 物体z向量
                    const vec3Z = Vec3.transformQuat(new Vec3(), Vec3.FORWARD, data.trackablePose.rotation).negative();
                    // 物体到相机的向量在物体平面上的投影
                    const out = new Vec3();
                    Vec3.projectOnPlane(out, dir, vec3Y);
                    // 向量夹角
                    let angle = Vec3.angle(vec3Z, out);
                    // 求法向量
                    const n = Vec3.cross(new Vec3(), vec3Z, out);
                    // 若两个法向量相反，则旋转角取负号
                    if (vec3Y.equals(n.normalize().negative())) {
                        angle = -angle;
                    }
                    // 物体绕自身旋转
                    const rot = new Quat();
                    Quat.rotateAroundLocal(rot, data.trackablePose.rotation, Vec3.UP, angle);
                    data.trackableChildNode?.setWorldRotation(rot);
                } else {
                    const quat = new Quat();
                    Quat.fromViewUp(quat, dir.normalize());
                    Quat.toEuler(dir, quat);
                    data.trackableChildNode?.setWorldRotationFromEuler(0, dir.y, 0);
                }
            }
        }
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        if (!data.trackableNode || !data.trackingNode) {
            return;
        }
        const trackingBase = data.trackingNode.getComponent(ARTrackingBase);
        if (this.getActivated(trackingBase?.trackingType)) {
            return;
        }
        this._trackableNode = data.trackableNode;

        this._updateAction(data);
        this.setActivated(true);
    }

    /**
    * @en update The action
    * @zh 刷新行为
    */
    public updateAction (data: ARActionData) {
        if (this._matchTrackingUpdate) {
            this._updateAction(data);
        }
    }

    public reset () {
        this.layout = AlignmentStyle.Center;
        this.upward = AlignmentOrientation.Local_Up;
        this.faceToCamera = false;
        this.matchTrackingUpdate = true;

        this.setActivated(false);
        this._trackableNode = null;
    }
}
