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

import { CameraComponent, ccenum, Component, EventHandle, EventHandheld, EventHMD, Input, input, Quat, renderer, Vec3, _decorator, EventGamepad } from 'cc';

const { ccclass, help, menu, property, executeInEditMode } = _decorator;

export enum TrackingSource_Type {
    VIEW_POSE_ACTIVE_LEFT = 0,
    VIEW_POSE_ACTIVE_RIGHT = 1,
    VIEW_POSE_ACTIVE_HMD = 2,
    HAND_POSE_ACTIVE_LEFT = 3,
    HAND_POSE_ACTIVE_RIGHT = 4,
    VIEW_POSE_ACTIVE_HANDHELD = 5,
}

enum TrackingType_Type {
    POSITION_AND_ROTATION = 1,
    POSITION = 2,
    ROTATION = 3
}

enum UpdateType_Type {
    UPDATE_AND_BEFORE_RENDER = 0,
    UPDATE_ONLY = 1,
    BEFORE_RENDER_ONLY = 2
}

ccenum(TrackingSource_Type);
ccenum(TrackingType_Type);
ccenum(UpdateType_Type);

/**
 * @en
 * Map devices from the real world to a virtual scene.
 * @zh
 * 位姿追踪组件。
 */
@ccclass('cc.PoseTracker')
@help('i18n:cc.PoseTracker')
@menu('XR/Device/PoseTracker')
@executeInEditMode
export class PoseTracker extends Component {
    @property({ serializable: true })
    protected _trackingSource: TrackingSource_Type = TrackingSource_Type.HAND_POSE_ACTIVE_LEFT;
    @property({ serializable: true })
    protected _trackingType: TrackingType_Type = TrackingType_Type.POSITION_AND_ROTATION;

    @property({
        type: TrackingSource_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.pose_tracker.trackingSource'
        })
    set trackingSource (val) {
        if (val === this._trackingSource) {
            return;
        }
        this._trackingSource = val;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
        } else {
            this.setCameraNoTracking();
        }
    }
    get trackingSource () {
        return this._trackingSource;
    }

    @property({
        type: TrackingType_Type,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.pose_tracker.trackingType'
        })
    set trackingType (val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
        } else {
            this.setCameraNoTracking();
        }
    }
    get trackingType () {
        return this._trackingType;
    }

    private _quatPose: Quat = new Quat();
    private _positionPose: Vec3 = new Vec3();

    setCameraTrackingType (type: TrackingType_Type) {
        const cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            switch (type) {
            case TrackingType_Type.POSITION_AND_ROTATION:
                cameraComponent.trackingType = renderer.scene.TrackingType.POSITION_AND_ROTATION;
                break;
            case TrackingType_Type.POSITION:
                cameraComponent.trackingType = renderer.scene.TrackingType.POSITION;
                break;
            case TrackingType_Type.ROTATION:
                cameraComponent.trackingType = renderer.scene.TrackingType.ROTATION;
                break;
            default:
                break;
            }
        }
    }

    setCameraNoTracking () {
        const cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            cameraComponent.trackingType = renderer.scene.TrackingType.NO_TRACKING;
        }
    }

    onEnable () {
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
            input.on(Input.EventType.HMD_POSE_INPUT, this._dispatchEventHMDPose, this);
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            this.setCameraNoTracking();
            input.on(Input.EventType.HANDLE_POSE_INPUT, this._dispatchEventHandlePose, this);
        } else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HANDHELD) {
            input.on(Input.EventType.HANDHELD_POSE_INPUT, this._dispatchEventHansetPose, this);
        }
    }

    onDisable () {
        this.setCameraNoTracking();
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT
            || this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            input.off(Input.EventType.HMD_POSE_INPUT, this._dispatchEventHMDPose, this);
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT
            || this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            input.off(Input.EventType.HANDLE_POSE_INPUT, this._dispatchEventHandlePose, this);
        }  else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HANDHELD) {
            input.off(Input.EventType.HANDHELD_POSE_INPUT, this._dispatchEventHansetPose, this);
        }
    }

    private _dispatchEventHMDPose (eventHMD: EventHMD) {
        const hmdInputDevice = eventHMD.hmdInputDevice;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.viewLeftOrientation.getValue();
                this._positionPose = hmdInputDevice.viewLeftPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.viewLeftOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.viewLeftPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.viewRightOrientation.getValue();
                this._positionPose = hmdInputDevice.viewRightPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.viewRightOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.viewRightPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.headMiddleOrientation.getValue();
                this._positionPose = hmdInputDevice.headMiddlePosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.headMiddleOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.headMiddlePosition.getValue();
            }
        }

        this.node.setRTS(this._quatPose, this._positionPose, Vec3.ONE);
    }

    private _dispatchEventHandlePose (eventHandle: EventHandle | EventGamepad) {
        let handleInputDevice;
        if (eventHandle instanceof EventGamepad) {
            handleInputDevice = eventHandle.gamepad;
        } else if (eventHandle instanceof EventHandle) {
            handleInputDevice = eventHandle.handleInputDevice;
        }
        if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = handleInputDevice.aimLeftOrientation.getValue();
                this._positionPose = handleInputDevice.aimLeftPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = handleInputDevice.aimLeftOrientation.getValue();
                this._positionPose = this.node.position;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = handleInputDevice.aimLeftPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = handleInputDevice.aimRightOrientation.getValue();
                this._positionPose = handleInputDevice.aimRightPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = handleInputDevice.aimRightOrientation.getValue();
                this._positionPose = this.node.position;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = handleInputDevice.aimRightPosition.getValue();
            }
        }

        this.node.setRTS(this._quatPose, this._positionPose, Vec3.ONE);
    }

    private _dispatchEventHansetPose (eventHandheld: EventHandheld) {
        const handheldInputDevice = eventHandheld.handheldInputDevice;
        this._quatPose = handheldInputDevice.handheldOrientation.getValue();
        this._positionPose = handheldInputDevice.handheldPosition.getValue();
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HANDHELD) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = handheldInputDevice.handheldOrientation.getValue();
                this._positionPose = handheldInputDevice.handheldPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = handheldInputDevice.handheldOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = handheldInputDevice.handheldPosition.getValue();
            }
        }

        this.node.setRTS(this._quatPose, this._positionPose, Vec3.ONE);
    }
}
