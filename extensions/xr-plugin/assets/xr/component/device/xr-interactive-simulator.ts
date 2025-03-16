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

import { _decorator, Camera, ccenum, clamp, Component, DeviceType, EventKeyboard, EventTouch, find, input, Input, KeyCode, Node, Quat, Rect, sys, Toggle, Vec2, Vec3, director, RenderTexture, Slider, assetManager, ProgressBar, Button } from 'cc';
import { EDITOR } from 'cc/env';
import { XrEventHandle } from '../interaction/xr-interactable';
import { XrInteractor } from '../interaction/xr-interactor';
import { HMDCtrl } from './hmd-ctrl';
import { TargetEye, TargetEye_Type } from './target-eye';
import { XRController, XrEventActionType, XrEventTypeLeft, XrEventTypeRight, XrInputAction, XrInputDeviceType } from './xr-controller';
import { XRDeviceInfo, XRPoseInfo, XRRemotePreView } from './xr-remote-preview';

const { ccclass, property, menu } = _decorator;

export enum InteractiveSimulateType {
    HMD = 0,
    LEFT_CONTROLLER = 1,
    RIGHT_CONTROLLER = 2
}
ccenum(InteractiveSimulateType);

export enum DeviceSimulateType {
    LOCAL = 0,
    REMOTE = 1
}
ccenum(DeviceSimulateType);

export enum DeviceConnetcType {
    //USB = 0,
    WIFI = 1
}
ccenum(DeviceConnetcType);

export enum DistortionMode {
    NONE = 0,
    BARREL = 1,
    CIRCULAR = 2
}
ccenum(DistortionMode);

export const globalInteractiveManager: any = {
    distortionMode: DistortionMode.NONE,
    isDistortionParameterChanged: false,
    distortionParameterK0: 1.0,
    distortionParameterK1: 0.0,
};

@ccclass('cc.XRInteractiveSimulator')
@menu('XR/Device/XRInteractiveSimulator')
export class XRInteractiveSimulator extends Component {
    @property({ serializable: true })
    protected _xrAgent: Node | null = null;
    @property({ type: Node, displayName: 'XR Agent', tooltip: 'i18n:xr-plugin.xr_interactive_simulator.xrAgent' })
    get xrAgent () {
        return this._xrAgent;
    }
    set xrAgent (value) {
        this._xrAgent = value;
    }

    @property({ displayName: 'XR Device Ip', tooltip: 'i18n:xr-plugin.xr_interactive_simulator.deviceIp' })
    private _xrDeivceIpAddress = '';

    @property({ type: DeviceSimulateType, displayName: 'XR Preview Type', tooltip: 'i18n:xr-plugin.xr_interactive_simulator.previewType' })
    private xrDeviceSimulateType: DeviceSimulateType = DeviceSimulateType.LOCAL;

    @property({ type: DeviceConnetcType, displayName: 'XR Connect Type', tooltip: 'i18n:xr-plugin.xr_interactive_simulator.connectType' })
    private _xrDeviceConnectType: DeviceConnetcType = DeviceConnetcType.WIFI;

    @property({
        displayName: 'XR Device Ip',
        tooltip: 'i18n:xr-plugin.xr_interactive_simulator.deviceIp',
        visible: (function (this: XRInteractiveSimulator) {
            return this.xrDeviceSimulateType === DeviceSimulateType.REMOTE && this._xrDeviceConnectType === DeviceConnetcType.WIFI;
            })
        })
    set xrDeivceIpAddress (val) {
        if (val === this._xrDeivceIpAddress) {
            return;
        }
        this._xrDeivceIpAddress = val;
    }
    get xrDeivceIpAddress () {
        return this._xrDeivceIpAddress;
    }

    @property({
        type: DeviceConnetcType,
        displayName: 'XR Connect Type',
        tooltip: 'i18n:xr-plugin.xr_interactive_simulator.connectType',
        visible: (function (this: XRInteractiveSimulator) {
            return this.xrDeviceSimulateType === DeviceSimulateType.REMOTE;
            })
        })
    set xrDeviceConnectType (val) {
        if (val === this._xrDeviceConnectType) {
            return;
        }
        this._xrDeviceConnectType = val;
    }
    get xrDeviceConnectType () {
        return this._xrDeviceConnectType;
    }

    private _dualEyeCameraRenderTexture: RenderTexture | null = null;
    private _singleEyeCameraRenderTexture_L: RenderTexture | null = null;
    private _singleEyeCameraRenderTexture_R: RenderTexture | null = null;
    private _leftEyeCamera: Camera | null = null;
    private _rightEyeCamera: Camera | null = null;
    private _mainCamera: Camera | null = null;
    private _leftControllerNode: Node | null = null;
    private _rightControllerNode: Node | null = null;
    private _targetControlledNode: Node | null = null;

    private _rotationYawDeg = 0;
    private _rotationPitchDeg = 0;

    private _keyPressingCount = 0;
    private _moveSpeedFactor = 1.0;
    private _isTriggerMoveEvent = false;
    private _nodeTargetPostion: Vec3 = new Vec3();

    private _nodeMovingPostion: Vec3 = new Vec3();
    private _nodeTargetRotation: Quat = new Quat();
    private _touchDeltaXY: Vec2 = new Vec2();

    private _nodeTempYawRotation: Quat = new Quat();
    private _nodeTempPitchRotation: Quat = new Quat();

    private _curInteractiveSimulateType: InteractiveSimulateType = InteractiveSimulateType.HMD;

    private _xrEventHandle: XrEventHandle = new XrEventHandle('xrEventHandle');

    private _guideContentNode: Node | null = null;
    private _guideContentLastShowTime = 0;
    private _topToggleHmd: Toggle | null | undefined = null;
    private _topToggleLeftCtrl: Toggle | null | undefined = null;
    private _topToggleRightCtrl: Toggle | null | undefined = null;
    private _topToggleSetting: Toggle | null | undefined = null;
    private _distortionParameterK0: Slider | null = null;
    private _distortionSettingPanel: Node | null = null;
    private _distortionSettingShowTime = 3;

    private _guideMaskContentNode: Node | null = null;
    private _guideStayShownTime = 0;

    private CONFIG_GUIDE_SHOWTIME = 1;

    private _leftControllerInitPosition: Vec3 = new Vec3();
    private _rightControllerInitPosition: Vec3 = new Vec3();

    private _xrRemotePreview: XRRemotePreView | null = null;

    start () {
        if (sys.isBrowser && !sys.isNative && !globalThis.__globalXR.webxrCompatible) {
            if (!this._xrAgent) {
                this._xrAgent = find('XR Agent');
            }
            const targetEyeComps = this._xrAgent?.getComponentsInChildren(TargetEye);
            if (targetEyeComps) {
                for (const targetEye of targetEyeComps) {
                    if (targetEye.targetEye === TargetEye_Type.BOTH) {
                        this._mainCamera = targetEye.node.getComponent(Camera);
                        this._targetControlledNode = targetEye.node;
                    } else if (targetEye.targetEye === TargetEye_Type.LEFT) {
                        this._leftEyeCamera = targetEye.node.getComponent(Camera);
                    } else if (targetEye.targetEye === TargetEye_Type.RIGHT) {
                        this._rightEyeCamera = targetEye.node.getComponent(Camera);
                    }
                }
            }

            if (this._leftEyeCamera) {
                this._leftEyeCamera.enabled = true;
                this._leftEyeCamera.priority = 1;
                this._leftEyeCamera.rect = new Rect(0, 0, 0.5, 1.0);
            }
            if (this._rightEyeCamera) {
                this._rightEyeCamera.enabled = true;
                this._rightEyeCamera.priority = 2;
                this._rightEyeCamera.rect = new Rect(0.5, 0, 0.5, 1.0);
            }
            if (this._mainCamera) {
                this._mainCamera.enabled = false;
                const hmdCtrl = this._mainCamera.getComponent(HMDCtrl);
                if (hmdCtrl) {
                    hmdCtrl.perEyeCamera = true;
                }
            }

            const xrControllerComps = this._xrAgent?.getComponentsInChildren(XRController);
            if (xrControllerComps) {
                for (const xrController of xrControllerComps) {
                    if (xrController.inputDevice === XrInputDeviceType.Left_Hand) {
                        this._leftControllerNode = xrController.node;
                    } else if (xrController.inputDevice === XrInputDeviceType.Right_Hand) {
                        this._rightControllerNode = xrController.node;
                    }
                }
            }

            if (this._leftControllerNode) {
                this._leftControllerInitPosition = this._leftControllerNode.position.clone();
            }
            if (this._rightControllerNode) {
                this._rightControllerInitPosition = this._rightControllerNode.position.clone();
            }

            const canvas = this.node.getChildByName('Canvas');
            if (canvas) {
                canvas.active = true;
            }
            this._guideContentNode = this.node.getChildByPath('Canvas/GuideContent');
            if (this._guideContentNode) {
                this._guideContentNode.active = true;
            }
            this._guideMaskContentNode = this.node.getChildByPath('Canvas/GuideContent/Mask/Content');
            this._guideContentLastShowTime = this.CONFIG_GUIDE_SHOWTIME;

            this._topToggleHmd = this.node.getChildByPath('Canvas/ToggleHmd')?.getComponent(Toggle);
            this._topToggleLeftCtrl = this.node.getChildByPath('Canvas/ToggleLeftCtrl')?.getComponent(Toggle);
            this._topToggleRightCtrl = this.node.getChildByPath('Canvas/ToggleRightCtrl')?.getComponent(Toggle);
            if (this.node.getChildByPath('Canvas/ToggleSetting')) {
                this._topToggleSetting = this.node.getChildByPath('Canvas/ToggleSetting')?.getComponent(Toggle);
            }

            if (this.xrDeviceSimulateType === DeviceSimulateType.LOCAL) {
                if (this._topToggleHmd) {
                    this._topToggleHmd.interactable = true;
                }
                if (this._topToggleLeftCtrl) {
                    this._topToggleLeftCtrl.interactable = true;
                }
                if (this._topToggleRightCtrl) {
                    this._topToggleRightCtrl.interactable = true;
                }
            } else if (this.xrDeviceSimulateType === DeviceSimulateType.REMOTE) {
                if (this._topToggleHmd) {
                    this._topToggleHmd.interactable = false;
                }
                if (this._topToggleLeftCtrl) {
                    this._topToggleLeftCtrl.interactable = false;
                }
                if (this._topToggleRightCtrl) {
                    this._topToggleRightCtrl.interactable = false;
                }
                this.node.on('sync-pose', this.syncDevicePose, this);
                this.node.on('sync-device-info', this.syncDeviceInfo, this);
                /*if (this.xrDeviceConnectType === DeviceConnetcType.USB) {
                    this.xrDeivceIpAddress = '127.0.0.1';
                }*/
                // adb forward --remove-all
                // adb forward tcp: 8989 tcp: 8989
                this._xrRemotePreview = this.node.addComponent(XRRemotePreView);
                this._xrRemotePreview.connect(this.xrDeivceIpAddress);
            }

            const ditortionK0Node = this.node.getChildByPath('Canvas/SettingPanel/DistortionK0');
            if (ditortionK0Node) {
                this._distortionParameterK0 = ditortionK0Node.getComponent(Slider);
                if (this._distortionParameterK0) {
                    this._distortionParameterK0.node.on('slide', this.onDistortionParameterChanged, this);
                    this._distortionParameterK0.progress = 1.0 - globalInteractiveManager.distortionParameterK0;
                    this._distortionParameterK0.enabled = globalInteractiveManager.distortionMode !== DistortionMode.NONE;
                }
            }
            this._distortionSettingPanel = this.node.getChildByPath('Canvas/SettingPanel');
            if (this._distortionSettingPanel) {
                this._distortionSettingPanel.active = false;
            }
            assetManager.loadAny({ uuid: '303d6a3a-d09c-485f-a751-05a4c61b6d73', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRInteractiveSimulator load rt error.${err}`);
                    return;
                }
                this._dualEyeCameraRenderTexture = rt;
            });

            assetManager.loadAny({ uuid: 'd4332383-07f6-4eb3-9026-2a872245ab8d', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRInteractiveSimulator load left rt error.${err}`);
                    return;
                }
                this._singleEyeCameraRenderTexture_L = rt;
            });

            assetManager.loadAny({ uuid: '52d33d78-2b86-410a-997d-ffc9a2a9dadc', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRInteractiveSimulator load right rt error.${err}`);
                    return;
                }
                this._singleEyeCameraRenderTexture_R = rt;
            });

            console.log('XRInteractiveSimulator is supported!');
        } else {
            this.node.active = false;
            console.log('XRInteractiveSimulator is not supported!');
        }
    }

    syncDeviceInfo (xrDeviceInfo: XRDeviceInfo) {
        if (this._leftEyeCamera) {
            this._leftEyeCamera.fov = Math.abs(xrDeviceInfo.leftEyeFov.z) + Math.abs(xrDeviceInfo.leftEyeFov.w);
        }
        if (this._rightEyeCamera) {
            this._rightEyeCamera.fov = Math.abs(xrDeviceInfo.rightEyeFov.z) + Math.abs(xrDeviceInfo.rightEyeFov.w);
        }
    }

    syncDevicePose (xrPoseInfo: XRPoseInfo) {
        this._mainCamera?.node.setRTS(xrPoseInfo.hmdOrientation, xrPoseInfo.hmdPosition, Vec3.ONE);

        if (this._leftControllerNode) {
            this._leftControllerNode.setRTS(
                xrPoseInfo.leftControllerOrientation,
                xrPoseInfo.leftControllerPosition, Vec3.ONE,
            );
        }

        if (this._rightControllerNode) {
            this._rightControllerNode.setRTS(
                xrPoseInfo.rightControllerOrientation,
                xrPoseInfo.rightControllerPosition, Vec3.ONE,
            );
        }
    }

    update (deltaTime: number) {
        if (sys.isBrowser && !sys.isNative && !globalThis.__globalXR.webxrCompatible) {
            if (this.xrDeviceSimulateType === DeviceSimulateType.LOCAL) {
                if (this._isTriggerMoveEvent && this._targetControlledNode) {
                    Vec3.lerp(this._nodeMovingPostion, this._targetControlledNode.position, this._nodeTargetPostion, deltaTime);
                    this._targetControlledNode.setPosition(this._nodeMovingPostion);
                }
            }

            if (this._guideContentNode && this._guideContentNode.active) {
                this._guideStayShownTime += deltaTime;
                if (this._guideStayShownTime > 1) {
                    if (this._guideMaskContentNode && this._guideContentLastShowTime > 0) {
                        if (this._guideMaskContentNode.position.x <= -410) {
                            this._guideContentLastShowTime -= deltaTime;
                        } else {
                            this._guideMaskContentNode.position = this._guideMaskContentNode.position.subtract3f(2, 0, 0);
                        }
                    } else if (this._guideContentLastShowTime < 0) {
                        this._guideContentNode.active = false;
                        this._guideContentLastShowTime = 0;
                    }
                }
            }

            if (this._distortionSettingPanel && this._distortionSettingPanel.active && this._distortionSettingShowTime <= 0) {
                this._distortionSettingPanel.active = false;
                if (this._topToggleSetting) {
                    this._topToggleSetting.isChecked = false;
                }
                this.resetDistortionButtonInteractable(this._distortionSettingPanel, false);
                this.disableDistortionSelectedBackground(this._distortionSettingPanel);
            } else if (this._distortionSettingPanel?.active) {
                this._distortionSettingShowTime -= deltaTime;
            }
        }

        if (sys.isBrowser && EDITOR && this._leftEyeCamera?.camera && this._leftEyeCamera.camera.window !== director.root?.mainWindow) {
            if (globalInteractiveManager.distortionMode === DistortionMode.NONE) {
                this._leftEyeCamera.camera.changeTargetWindow(director.root?.mainWindow);
                this._rightEyeCamera?.camera.changeTargetWindow(director.root?.mainWindow);
            }
            this.node.getChildByPath('Canvas/Camera')?.getComponent(Camera)?.camera.changeTargetWindow(director.root?.mainWindow);
        }
    }

    moveNode (event: EventKeyboard) {
        const moveDistance: number = 2.618 * this._moveSpeedFactor;
        let deltaPosition: Vec3 = new Vec3();
        let dirRight = this._targetControlledNode?.right;
        let dirFoward = this._targetControlledNode?.forward;
        let dirUp = this._targetControlledNode?.up;
        if (this._curInteractiveSimulateType !== InteractiveSimulateType.HMD) {
            // controller
            dirFoward = Vec3.FORWARD.clone();
            dirRight = Vec3.RIGHT.clone();
            dirUp = Vec3.UP.clone();
        }
        switch (event.keyCode) {
        case KeyCode.KEY_W: {
            if (dirFoward) {
                deltaPosition = dirFoward.multiplyScalar(moveDistance);
            }
            break;
        }
        case KeyCode.KEY_A: {
            if (dirRight) {
                deltaPosition = dirRight.multiplyScalar((-1) * moveDistance);
            }
            break;
        }
        case KeyCode.KEY_S: {
            if (dirFoward) {
                deltaPosition = dirFoward.multiplyScalar((-1) * moveDistance);
            }
            break;
        }
        case KeyCode.KEY_D: {
            if (dirRight) {
                deltaPosition = dirRight.multiplyScalar(moveDistance);
            }
            break;
        }
        case KeyCode.KEY_Q: {
            if (dirUp) {
                deltaPosition = dirUp.multiplyScalar((-1) * moveDistance);
            }
            break;
        }
        case KeyCode.KEY_E: {
            if (dirUp) {
                deltaPosition = dirUp.multiplyScalar(moveDistance);
            }
            break;
        }
        default:
            break;
        }

        this._isTriggerMoveEvent = true;
        if (this._targetControlledNode) {
            this._nodeTargetPostion.x = this._targetControlledNode.position.x;
            this._nodeTargetPostion.y = this._targetControlledNode.position.y;
            this._nodeTargetPostion.z = this._targetControlledNode.position.z;
        }
        this._nodeTargetPostion.add(deltaPosition);
    }

    onEnable () {
        if (sys.isBrowser && this.xrDeviceSimulateType === DeviceSimulateType.LOCAL) {
            input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
            input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        }
    }

    onDisable () {
        if (sys.isBrowser
      && this.xrDeviceSimulateType === DeviceSimulateType.LOCAL) {
            input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
            input.off(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        }
    }

    isMoveKey (event: EventKeyboard): boolean {
        return event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.KEY_A
      || event.keyCode === KeyCode.KEY_S || event.keyCode === KeyCode.KEY_D
      || event.keyCode === KeyCode.KEY_Q || event.keyCode === KeyCode.KEY_E;
    }

    onKeyDown (event: EventKeyboard) {
        if (this.isMoveKey(event)) {
            this.moveNode(event);
        }

        if (event.keyCode === KeyCode.NUM_1 || event.keyCode === KeyCode.DIGIT_1) {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.HMD, true,
            );
        } else if (
            event.keyCode === KeyCode.NUM_2 || event.keyCode === KeyCode.DIGIT_2) {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.LEFT_CONTROLLER, true,
            );
        } else if (
            event.keyCode === KeyCode.NUM_3 || event.keyCode === KeyCode.DIGIT_3) {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.RIGHT_CONTROLLER, true,
            );
        } else if (
            event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
            this.simulateUIPressEvent(true);
        }
    }

    onKeyPressing (event: EventKeyboard) {
        if (this.isMoveKey(event)) {
            this.moveNode(event);
            this._keyPressingCount++;
            if (this._keyPressingCount % 5 === 0) {
                this._moveSpeedFactor = Math.ceil(this._keyPressingCount / 5) * 0.2 + 1.0;
            }
        }

        if (event.keyCode === KeyCode.KEY_B) {
            this.resetControllerPosition();
        }
    }

    onKeyUp (event: EventKeyboard) {
        if (this.isMoveKey(event)) {
            this.moveNode(event);
            this._keyPressingCount = 0;
            this._moveSpeedFactor = 1.0;
            this._isTriggerMoveEvent = false;
        }

        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
            this.simulateUIPressEvent(false);
        }
    }

    onTouchStart (event: EventTouch) {
        if (this._targetControlledNode) {
            this._rotationYawDeg = this._targetControlledNode.eulerAngles.y;
            this._rotationPitchDeg = this._targetControlledNode.eulerAngles.x;
        }
    }

    onTouchMove (event: EventTouch) {
        event.getDelta(this._touchDeltaXY);

        this._rotationYawDeg += this._touchDeltaXY.x * (-1) * 0.1;
        this._rotationPitchDeg += this._touchDeltaXY.y * 0.1;
        this._rotationPitchDeg = clamp(this._rotationPitchDeg, -89, 89);

        Quat.rotateAround(
            this._nodeTempYawRotation, Quat.IDENTITY, Vec3.UP,
            this._rotationYawDeg * Math.PI / 180,
        );
        Quat.rotateAround(
            this._nodeTempPitchRotation, Quat.IDENTITY, Vec3.RIGHT,
            this._rotationPitchDeg * Math.PI / 180,
        );
        Quat.multiply(
            this._nodeTargetRotation, this._nodeTempYawRotation,
            this._nodeTempPitchRotation,
        );
        this._targetControlledNode?.setRotation(this._nodeTargetRotation);
    }

    onTouchEnd (event: EventTouch) {

    }

    refreshInteractiveSimulateTypeStatus (
        type: InteractiveSimulateType, changeCheckStatus: boolean,
    ) {
        this._curInteractiveSimulateType = type;
        switch (this._curInteractiveSimulateType) {
        case InteractiveSimulateType.HMD: {
            if (changeCheckStatus && this._topToggleHmd) {
                this._topToggleHmd.isChecked = true;
            }
            if (this._topToggleLeftCtrl) {
                this._topToggleLeftCtrl.isChecked = false;
            }
            if (this._topToggleRightCtrl) {
                this._topToggleRightCtrl.isChecked = false;
            }
            if (this._mainCamera) {
                this._targetControlledNode = this._mainCamera.node;
            }
            break;
        }
        case InteractiveSimulateType.LEFT_CONTROLLER: {
            if (this._topToggleHmd) {
                this._topToggleHmd.isChecked = false;
            }
            if (changeCheckStatus && this._topToggleLeftCtrl) {
                this._topToggleLeftCtrl.isChecked = true;
            }
            if (this._topToggleRightCtrl) {
                this._topToggleRightCtrl.isChecked = false;
            }
            if (this._leftControllerNode) {
                this._targetControlledNode = this._leftControllerNode;
            }
            break;
        }
        case InteractiveSimulateType.RIGHT_CONTROLLER: {
            if (this._topToggleHmd) {
                this._topToggleHmd.isChecked = false;
            }
            if (this._topToggleLeftCtrl) {
                this._topToggleLeftCtrl.isChecked = false;
            }
            if (changeCheckStatus && this._topToggleRightCtrl) {
                this._topToggleRightCtrl.isChecked = true;
            }
            if (this._rightControllerNode) {
                this._targetControlledNode = this._rightControllerNode;
            }
            break;
        }
        default:
            break;
        }
    }

    simulateUIPressEvent (isKeyDown: boolean) {
        switch (this._curInteractiveSimulateType) {
        case InteractiveSimulateType.LEFT_CONTROLLER: {
            this._xrEventHandle.deviceType = DeviceType.Left;
            if (isKeyDown && this._leftControllerNode) {
                this._leftControllerNode.getComponent(XrInteractor)?.uiPressEnter(this._xrEventHandle);

                const xrInputAction: XrInputAction = new XrInputAction(XrInputDeviceType.Left_Hand);
                xrInputAction.eventType = XrEventTypeLeft.TRIGGER_BTN_LEFT;
                xrInputAction.eventValue = 0;
                xrInputAction.keyEventActionType = XrEventActionType.KEY_DOWN;
                this._leftControllerNode.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
            } else if (this._leftControllerNode) {
                this._leftControllerNode.getComponent(XrInteractor)?.uiPressExit(this._xrEventHandle);

                const xrInputAction: XrInputAction = new XrInputAction(XrInputDeviceType.Left_Hand);
                xrInputAction.eventType = XrEventTypeLeft.TRIGGER_BTN_LEFT;
                xrInputAction.eventValue = 1;
                xrInputAction.keyEventActionType = XrEventActionType.KEY_UP;
                this._leftControllerNode.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
            }
            break;
        }
        case InteractiveSimulateType.RIGHT_CONTROLLER: {
            this._xrEventHandle.deviceType = DeviceType.Right;
            if (isKeyDown && this._rightControllerNode) {
                this._rightControllerNode.getComponent(XrInteractor)?.uiPressEnter(this._xrEventHandle);

                const xrInputAction: XrInputAction = new XrInputAction(XrInputDeviceType.Right_Hand);
                xrInputAction.eventType = XrEventTypeRight.TRIGGER_BTN_RIGHT;
                xrInputAction.eventValue = 0;
                xrInputAction.keyEventActionType = XrEventActionType.KEY_DOWN;
                this._rightControllerNode.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
            } else if (this._rightControllerNode) {
                this._rightControllerNode.getComponent(XrInteractor)?.uiPressExit(this._xrEventHandle);

                const xrInputAction: XrInputAction = new XrInputAction(XrInputDeviceType.Right_Hand);
                xrInputAction.eventType = XrEventTypeRight.TRIGGER_BTN_RIGHT;
                xrInputAction.eventValue = 0;
                xrInputAction.keyEventActionType = XrEventActionType.KEY_UP;
                this._rightControllerNode.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
            }
            break;
        }
        default:
            break;
        }
    }

    showGuideUI (event: Event, customEventData: string) {
        if (this._guideContentNode) {
            this._guideContentNode.active = !this._guideContentNode.active;
        }
        if (this._guideContentNode?.active) {
            this._guideContentLastShowTime = this.CONFIG_GUIDE_SHOWTIME;
            if (this._guideMaskContentNode) {
                this._guideMaskContentNode.position = new Vec3(15, 0, 0);
            }
            this._guideStayShownTime = 0;
        } else {
            this._guideContentLastShowTime = 0;
        }
    }

    onToggleChanged (event: Event) {
        const node = event.target as unknown as Node;
        if (node.name === 'ToggleHmd') {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.HMD, false,
            );
        } else if (node.name === 'ToggleLeftCtrl') {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.LEFT_CONTROLLER, false,
            );
        } else if (node.name === 'ToggleRightCtrl') {
            this.refreshInteractiveSimulateTypeStatus(
                InteractiveSimulateType.RIGHT_CONTROLLER, false,
            );
        } else if (node.name === 'ToggleSetting') {
            if (this._distortionSettingPanel) {
                this._distortionSettingPanel.active = !this._distortionSettingPanel.active;
                if (this._distortionSettingPanel.active) {
                    this.resetDistortionButtonInteractable(this._distortionSettingPanel, true);
                }
            }
            this._distortionSettingShowTime = 3;
        }
    }

    resetControllerPosition (): void {
        if (this._leftControllerNode) {
            this._leftControllerNode.position = this._leftControllerInitPosition.clone();
        }

        if (this._rightControllerNode) {
            this._rightControllerNode.position = this._rightControllerInitPosition.clone();
        }
    }

    enableDistortion (customEventData?: string): void {
        globalInteractiveManager.distortionMode = DistortionMode.BARREL;
        if (customEventData === 'BARREL') {
            globalInteractiveManager.distortionMode = DistortionMode.BARREL;
        } else if (customEventData === 'CIRCULAR') {
            globalInteractiveManager.distortionMode = DistortionMode.CIRCULAR;
        }
        if (this._leftEyeCamera) {
            this._leftEyeCamera.targetTexture = this._singleEyeCameraRenderTexture_L;
        }
        if (this._rightEyeCamera) {
            this._rightEyeCamera.targetTexture = this._singleEyeCameraRenderTexture_R;
        }
        if (this._leftEyeCamera) {
            this._leftEyeCamera.rect = new Rect(0, 0, 1.0, 1.0);
        }
        if (this._rightEyeCamera) {
            this._rightEyeCamera.rect = new Rect(0, 0, 1.0, 1.0);
        }
        if (this._distortionParameterK0) {
            this._distortionParameterK0.enabled = true;
        }

        this._distortionSettingShowTime = 3;
    }

    disableDistortion (): void {
        globalInteractiveManager.distortionMode = DistortionMode.NONE;
        if (this._leftEyeCamera) {
            this._leftEyeCamera.targetTexture = null;
        }
        if (this._rightEyeCamera) {
            this._rightEyeCamera.targetTexture = null;
        }
        if (this._leftEyeCamera) {
            this._leftEyeCamera.rect = new Rect(0, 0, 0.5, 1.0);
        }
        if (this._rightEyeCamera) {
            this._rightEyeCamera.rect = new Rect(0.5, 0, 0.5, 1.0);
        }

        if (sys.isBrowser && EDITOR) {
            this._leftEyeCamera?.camera.changeTargetWindow(director.root?.mainWindow);
            this._rightEyeCamera?.camera.changeTargetWindow(director.root?.mainWindow);
        }
        if (this._distortionParameterK0) {
            this._distortionParameterK0.enabled = false;
        }

        this._distortionSettingShowTime = 3;
    }

    onDistortionParameterChanged (slider: Slider): void {
        if (globalInteractiveManager.distortionMode === DistortionMode.NONE) {
            return;
        }
        this._distortionSettingShowTime = 3;

        if (slider === this._distortionParameterK0) {
            globalInteractiveManager.distortionParameterK0 = 1.0 - slider.progress * 0.8;
            globalInteractiveManager.isDistortionParameterChanged = true;

            // sync
            const progressBar = slider.node.getChildByName('ProgressBar')?.getComponent(ProgressBar);
            if (progressBar) {
                progressBar.progress = slider.progress;
            }
        }
    }

    // parent is SettingPanel Node
    disableDistortionSelectedBackground (parent: Node): void {
        const distortionModeNoneSelected = parent.getChildByName('DistortionModeNone')?.getChildByName('Selected');
        if (distortionModeNoneSelected) {
            distortionModeNoneSelected.active = false;
        }
        const distortionModeBarrelSelected = parent.getChildByName('DistortionModeBarrel')?.getChildByName('Selected');
        if (distortionModeBarrelSelected) {
            distortionModeBarrelSelected.active = false;
        }
        const distortionModeCircularSelected = parent.getChildByName('DistortionModeCircular')?.getChildByName('Selected');
        if (distortionModeCircularSelected) {
            distortionModeCircularSelected.active = false;
        }
    }

    // parent is SettingPanel Node
    resetDistortionButtonInteractable (parent: Node, interactable: boolean): void {
        const distortionModeNoneButton = parent.getChildByName('DistortionModeNone')?.getChildByName('NormalHover')?.getComponent(Button);
        if (distortionModeNoneButton) {
            distortionModeNoneButton.interactable = interactable;
        }
        const distortionModeBarrelButton = parent.getChildByName('DistortionModeBarrel')?.getChildByName('NormalHover')?.getComponent(Button);
        if (distortionModeBarrelButton) {
            distortionModeBarrelButton.interactable = interactable;
        }
        const distortionModeCircularButton = parent.getChildByName('DistortionModeCircular')?.getChildByName('NormalHover')?.getComponent(Button);
        if (distortionModeCircularButton) {
            distortionModeCircularButton.interactable = interactable;
        }

        if (globalInteractiveManager.distortionMode === DistortionMode.BARREL) {
            const distortionModeBarrelSelected = parent.getChildByName('DistortionModeBarrel')?.getChildByName('Selected');
            if (distortionModeBarrelSelected) {
                distortionModeBarrelSelected.active = true;
            }
        } else if (globalInteractiveManager.distortionMode === DistortionMode.CIRCULAR) {
            const distortionModeCircularSelected = parent.getChildByName('DistortionModeCircular')?.getChildByName('Selected');
            if (distortionModeCircularSelected) {
                distortionModeCircularSelected.active = true;
            }
        } else if (globalInteractiveManager.distortionMode === DistortionMode.NONE) {
            const distortionModeNoneSelected = parent.getChildByName('DistortionModeNone')?.getChildByName('Selected');
            if (distortionModeNoneSelected) {
                distortionModeNoneSelected.active = true;
            }
        }
    }

    onDistortionModeButtonClick (event: Event, customEventData: string) {
        // event is Touch Event
        const node = event.target as unknown as Node;
        if (!customEventData) {
            this.disableDistortion();
        } else {
            this.enableDistortion(customEventData);
        }
        const parent = node.parent;
        if (parent) {
            if (parent.parent) {
                this.disableDistortionSelectedBackground(parent.parent);
            }
            const selected = parent.getChildByName('Selected');
            if (selected) {
                selected.active = true;
            }
        }
    }
}
