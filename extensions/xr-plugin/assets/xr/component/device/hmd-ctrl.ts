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

import { _decorator, Component, ccenum, CameraComponent, CCBoolean, sys } from 'cc';
import { xrInterface } from '../interface/xr-interface';
import { TargetEye, TargetEye_Type } from './target-eye';

const { ccclass, help, menu, property } = _decorator;

enum StereoRendering_Type {
    SINGLE_PASS = 0,
    MUTLI_PASS = 1,
    OFF = 2
}

enum FoveationRendering_Type {
    None = 0,
    Low = 1,
    Med = 2,
    High = 3,
    Ext = 4
}

enum IPDOffset_Type {
    Auto = 0,
    Device = 1,
    Manual = 2
}

enum AspectRatio_Type {
    Auto = 0,
    Manual = 1
}

enum Camera_Type {
    BOTH = 0,
    LEFT = 1,
    RIGHT = 2
}

ccenum(StereoRendering_Type);
ccenum(FoveationRendering_Type);
ccenum(IPDOffset_Type);
ccenum(AspectRatio_Type);

/**
 * @en
 * The Controller component of HMD. Used to control whether both eyes are drawn uniformly or each eye is drawn separately.
 * @zh
 * 头戴显示器控制组件。用于控制区分双眼统一绘制，还是每一只眼分别绘制。
 */
@ccclass('cc.HMDCtrl')
@help('i18n:cc.HMDCtrl')
@menu('XR/Device/HMDCtrl')
export class HMDCtrl extends Component {
    @property({ serializable: true })
    protected _perEyeCamera = false;
    @property({ serializable: true })
    protected _sync = false;
    @property({ serializable: true })
    protected _IPDOffset: IPDOffset_Type = IPDOffset_Type.Auto;
    @property({ serializable: true })
    protected _offsetValue = 0.064;

    private _mainCamera: CameraComponent | null = null;
    private _leftCamera: CameraComponent | null = null;
    private _rightCamera: CameraComponent | null = null;
    @property({ serializable: true })
    private _realIPDOffset = 0;

    @property({
        type: CCBoolean,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.hmd_ctrl.perEyeCamera'
        })
    set perEyeCamera (val) {
        if (val === this._perEyeCamera) {
            return;
        }
        this._perEyeCamera = val;
        this._getCameras();
        this._copyCameras(Camera_Type.BOTH);

        if (this._IPDOffset === IPDOffset_Type.Manual) {
            this._setMainOffset(this._offsetValue / 2);
        }
        if (this._perEyeCamera) {
            if (this._mainCamera) {
                this._mainCamera.enabled = false;
            }
            if (this._leftCamera) {
                this._leftCamera.node.active = true;
            }
            if (this._rightCamera) {
                this._rightCamera.node.active = true;
            }
        } else {
            if (this._mainCamera) {
                this._mainCamera.enabled = true;
            }
            if (this._leftCamera) {
                this._leftCamera.node.active = false;
            }
            if (this._rightCamera) {
                this._rightCamera.node.active = false;
            }
        }
    }
    get perEyeCamera () {
        return this._perEyeCamera;
    }

    @property({
        type: CCBoolean,
        displayOrder: 3,
        visible: (function (this: HMDCtrl) {
            return this._perEyeCamera;
            }),
        tooltip: 'i18n:xr-plugin.hmd_ctrl.syncWithMainCamera'
        })
    set sync_with_Main_Camera (val) {
        if (val === this._sync) {
            return;
        }
        this._sync = val;
        this._copyCameras(Camera_Type.BOTH);
    }
    get sync_with_Main_Camera () {
        return this._sync;
    }

    @property({
        type: IPDOffset_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.hmd_ctrl.IPDOffset'
        })
    set IPDOffset (val) {
        if (val === this._IPDOffset) {
            return;
        }
        // If it was Manual, change left and right back
        this._setIpdOffset(0);
        this._IPDOffset = val;
        // If it's Manual now
        this._setIpdOffset(this._offsetValue / 2);
    }
    get IPDOffset () {
        return this._IPDOffset;
    }

    @property({
        displayOrder: 6,
        visible: (function (this: HMDCtrl) {
            return this._IPDOffset === IPDOffset_Type.Manual;
            }),
        tooltip: 'i18n:xr-plugin.hmd_ctrl.offsetValue'
        })
    set offsetValue (val) {
        if (val === this._offsetValue) {
            return;
        }
        this._offsetValue = val;

        this._setIpdOffset(this._offsetValue / 2);
    }
    get offsetValue () {
        return this._offsetValue;
    }

    private _copyCameras (type: Camera_Type) {
        if (!this.perEyeCamera) {
            return;
        }

        this._getCameras();
        if (this._mainCamera && this._sync) {
            switch (type) {
            case Camera_Type.BOTH:
                if (this._leftCamera) {
                    this._setCamera(this._leftCamera, this._mainCamera);
                }
                if (this._rightCamera) {
                    this._setCamera(this._rightCamera, this._mainCamera);
                }
                break;
            case Camera_Type.LEFT:
                if (this._leftCamera) {
                    this._setCamera(this._leftCamera, this._mainCamera);
                }
                break;
            case Camera_Type.RIGHT:
                if (this._rightCamera) {
                    this._setCamera(this._rightCamera, this._mainCamera);
                }
                break;
            default:
                break;
            }
        }
    }

    private _setCamera (camera: CameraComponent | null, mainCamera: CameraComponent | null) {
        if (!(camera && mainCamera)) {
            return;
        }
        camera.priority = mainCamera.priority;
        camera.visibility = mainCamera.visibility;
        camera.clearFlags = mainCamera.clearFlags;
        camera.clearColor = mainCamera.clearColor;
        camera.clearDepth = mainCamera.clearDepth;
        camera.clearStencil = mainCamera.clearStencil;
        camera.projection = mainCamera.projection;
        camera.fovAxis = mainCamera.fovAxis;
        camera.fov = mainCamera.fov;
        camera.orthoHeight = mainCamera.orthoHeight;
        camera.near = mainCamera.near;
        camera.far = mainCamera.far;
        camera.aperture = mainCamera.aperture;
        camera.shutter = mainCamera.shutter;
        camera.iso = mainCamera.iso;
        camera.rect = mainCamera.rect;
        camera.targetTexture = mainCamera.targetTexture;
    }

    private _setIpdOffset (value) {
        if (this._IPDOffset !== IPDOffset_Type.Manual) {
            return;
        }

        this._getCameras();
        if (this._mainCamera) {
            if (this._leftCamera) {
                this._leftCamera.node.setPosition(-value, this._leftCamera.node.getPosition().y, this._leftCamera.node.getPosition().z);
            }
            if (this._rightCamera) {
                this._rightCamera.node.setPosition(value, this._rightCamera.node.getPosition().y, this._rightCamera.node.getPosition().z);
            }

            this._setMainOffset(value);
        }
    }

    onEnable () {
        if (sys.isXR) {
            xrInterface.setIPDOffset(this._realIPDOffset);
        }
    }

    private _setMainOffset (value) {
        if (this._mainCamera) {
            // If perEyeCamera is turned off (that is, left and right are not enabled), offset is used for the MainCamera
            if (!this._perEyeCamera) {
                this._realIPDOffset = value * 2;
            } else {
                this._realIPDOffset = 0;
            }
        }
    }

    private _getCameras () {
        const targets = this.getComponentsInChildren(TargetEye);
        for (let i = 0; i < targets.length; ++i) {
            switch (targets[i].targetEye) {
            case TargetEye_Type.BOTH:
                this._mainCamera = targets[i].getComponent(CameraComponent);
                break;
            case TargetEye_Type.LEFT:
                this._leftCamera = targets[i].getComponent(CameraComponent);
                break;
            case TargetEye_Type.RIGHT:
                this._rightCamera = targets[i].getComponent(CameraComponent);
                break;
            default:
                break;
            }
        }
    }
}
