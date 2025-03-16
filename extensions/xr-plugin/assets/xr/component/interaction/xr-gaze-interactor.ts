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

import { _decorator, Node, Sprite, Vec3, PhysicsSystem, geometry, find, Collider, PhysicsRayResult, DeviceType } from 'cc';
import { PoseTracker, TrackingSource_Type } from '../device/pose-tracker';
import { RaycastChecker } from '../xrui/raycast-checker';
import { IXrInteractable, XrControlEventType, XrInteractable } from './xr-interactable';
import { XrInteractor } from './xr-interactor';

const { ccclass, menu, property } = _decorator;

/**
 * @en
 * Interact with object by gaze.
 * @zh
 * 头控凝视交互器组件。
 */
@ccclass('cc.XRGazeInteractor')
@menu('XR/Interaction/GazeInteractor')
export class XRGazeInteractor extends XrInteractor {
    @property({ range: [1.0, 100, 0.1], tooltip: 'i18n:xr-plugin.gaze_interactor.gazeDefaultDistance' })
    protected gazeDefaultDistance = 1.0;

    @property({ tooltip: 'i18n:xr-plugin.gaze_interactor.gazeTimerDuration' })
    protected gazeTimerDuration = 2.0;

    @property({ type: Sprite, tooltip: 'i18n:xr-plugin.gaze_interactor.gazeReticleOuterRing' })
    protected gazeReticleOuterRing: Sprite | null = null;
    @property
    protected _maxRayDistance = 30;
    private _clickStatus = -1;

    @property({
        visible: true,
        displayOrder: 6,
        range: [30, 1000000, 0.1],
        tooltip: 'i18n:xr-plugin.ray_interactor.maxRayDistance'
        })
    set maxRayDistance (val) {
        if (val === this._maxRayDistance) {
            return;
        }
        this._maxRayDistance = val;
    }
    get maxRayDistance () {
        return this._maxRayDistance;
    }

    @property({
        override: true,
        visible: false
        })
    set selectActionTrigger (val) {
        if (val === this._selectActionTrigger) {
            return;
        }
        this._selectActionTrigger = val;
    }
    get selectActionTrigger () {
        return this._selectActionTrigger;
    }

    @property({
        type: Node,
        override: true,
        visible: false
        })
    set attachTransform (val) {
        if (val === this._attachTransform) {
            return;
        }
        this._attachTransform = val;
    }
    get attachTransform () {
        return this._attachTransform;
    }

    private defaultWorldScale: Vec3 = new Vec3(0.01, 0.01, 0.01);

    private _hmdRay!: geometry.Ray;
    private _xrAgent: Node | null = null;
    private _hmdNode: Node | null = null;
    private _rayHitCollider: Collider | null = null;
    protected _pressState = false;
    private _gazeTimerCurrent = 0;

    getRay (): geometry.Ray {
        return this._hmdRay;
    }

    start () {
        this._hmdRay = new geometry.Ray();
        if (!this._xrAgent) {
            this._xrAgent = find('XR Agent');
        }

        if (this._xrAgent) {
            const poseTrackerComps = this._xrAgent.getComponentsInChildren(PoseTracker);
            for (const poseTrackerComp of poseTrackerComps) {
                if (poseTrackerComp.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
                    this._hmdNode = poseTrackerComp.node;
                }
            }
        }

        if (!this._hmdNode) {
            console.error('XRGazeInteractor start failed not find hmd node !!!');
        }
        console.log(`[XRGazeInteractor] Ray Max Distance is ${this.maxRayDistance}`);
    }

    protected _judgeHit (type: XrControlEventType): boolean {
        const hit = PhysicsSystem.instance.raycastClosest(this._hmdRay, 0xffffffff, this.maxRayDistance, true);
        if (hit) {
            // Get collision box
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            if (!closestResult) {
                return false;
            }
            // Check whether the collision box has an InteracTable
            const xrInteractable = closestResult.collider?.getComponent(XrInteractable);
            if (xrInteractable) {
                this._beTriggerNode = xrInteractable;
                this._event.hitPoint = closestResult.hitPoint;
                if (type === XrControlEventType.SELECT_ENTERED) {
                    this._collider = closestResult.collider;
                } else if (type === XrControlEventType.ACTIVATED) {
                    this._activateCollider = closestResult.collider;
                }
                return true;
            }
        }

        return false;
    }

    protected _judgeUIHit (): boolean {
        const hit = PhysicsSystem.instance.raycastClosest(this._hmdRay, this._interactionLayerMask, this.maxRayDistance, true);
        if (hit) {
            // Get collision box
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            if (!closestResult) {
                return false;
            }
            // Check whether the collision box has an UI3DBase
            const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
            if (ui3DBase) {
                this._uiPressCollider = closestResult.collider;
                return true;
            }
        }

        return false;
    }

    update (deltaTime: number) {
        if (this._hmdNode) {
            this._hmdRay.o = this._hmdNode.worldPosition;
            this._hmdRay.d = this._hmdNode.forward.normalize();
        }

        if (this._clickStatus >= 0) {
            this._clickStatus += deltaTime;
            this.uiPressStay();
            if (this._clickStatus >= 0.1) {
                this.uiPressExit();
                this._clickStatus = -1;
                this._gazeTimerCurrent = 0;
            }
            return;
        }

        this.raycastUI(deltaTime);
    }

    raycastUI (deltaTime: number): void {
        const hit = PhysicsSystem.instance.raycastClosest(this._hmdRay, this._interactionLayerMask, this.maxRayDistance, true);
        if (hit) {
            // Get collision box
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            if (closestResult && closestResult.collider) {
                this._event.hitPoint = closestResult.hitPoint;
                const xrInteractable = closestResult.collider?.getComponent(IXrInteractable);
                if (xrInteractable) {
                    this._beTriggerNode = xrInteractable;
                    this._handleHoverEnter(closestResult);
                } else {
                    const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
                    if (ui3DBase) {
                        this._handleHoverEnter(closestResult);
                    } else {
                        this._event.hitPoint = Vec3.ZERO.clone();
                        this._handleHoverExit();
                    }
                }

                if (this._rayHitCollider && this._gazeTimerCurrent <= this.gazeTimerDuration) {
                    this._gazeTimerCurrent += deltaTime;
                    if (this.gazeReticleOuterRing) {
                        this.gazeReticleOuterRing.fillRange = -1 * (this._gazeTimerCurrent / this.gazeTimerDuration);
                        if (this.gazeReticleOuterRing.fillRange <= -1) {
                            // trigger click
                            this.uiPressEnter();
                            this._clickStatus = 0;
                            this.gazeReticleOuterRing.fillRange = 0;
                        }
                    }
                }
            }
        } else {
            this._event.hitPoint = Vec3.ZERO.clone();
            this._handleHoverExit();
        }
    }

    setGazePointerPosition (position: Vec3, normal: Vec3): void {
        this.node.worldPosition = position.clone().add(normal.clone().multiplyScalar(0.1));
        this.node.lookAt(position.clone().add(normal.clone().multiplyScalar(-2)));
        if (this._hmdNode) {
            const distance = this.node.worldPosition.clone().subtract(this._hmdNode.worldPosition).length();
            this.node.worldScale = this.defaultWorldScale.clone().multiplyScalar(Math.max(distance / 4.0, 0.001));
        }
    }

    resetPointerPosition () {
        if (this._hmdNode) {
            const distance = this._hmdNode.forward.normalize().clone().multiplyScalar(this.gazeDefaultDistance);
            const position: Vec3 = this._hmdNode.worldPosition.clone().add(distance);
            this.setGazePointerPosition(position, this._hmdNode.forward.normalize().clone().multiplyScalar(-1));
            if (this.gazeReticleOuterRing) {
                this.gazeReticleOuterRing.fillRange = 0;
            }
        }
    }

    onEnable (): void {

    }

    onDisable (): void {

    }

    private _handleHoverEnter (closestResult: PhysicsRayResult) {
        this._clickStatus = -1;
        // Determine if there was a hit last time
        if (this._rayHitCollider) {
            if (this._rayHitCollider !== closestResult.collider) {
                // Inconsistent, and an object was hit last time, HOVER_EXITED is fired
                this._interactorEvents?.hoverExited(this._event);
                this._rayHitCollider.node.emit(XrControlEventType.HOVER_EXITED, this._event);
                // Replace hit object, triggering HOVER_ENTERED
                this._rayHitCollider = closestResult.collider;
                this._interactorEvents?.hoverEntered(this._event);
                this._rayHitCollider.node.emit(XrControlEventType.HOVER_ENTERED, this._event);
                this._gazeTimerCurrent = 0;
            } else {
                this._interactorEvents?.hoverStay(this._event);
            }
        } else {
            // Replace hit object, triggering HOVER_ENTERED
            this._rayHitCollider = closestResult.collider;
            this._interactorEvents?.hoverEntered(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_ENTERED, this._event);
            this._gazeTimerCurrent = 0;
        }

        // Send stay, intermediate state, send position point
        if (this._rayHitCollider) {
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_STAY, this._event);
        }

        this.setGazePointerPosition(closestResult.hitPoint, closestResult.hitNormal);
    }

    private _handleHoverExit () {
        // Determine if there was a hit last time
        if (this._rayHitCollider) {
            // HOVER_EXITED is triggered if an object is hit
            this._interactorEvents?.hoverExited(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_EXITED, this._event);
            this._rayHitCollider = null;
        }
        this.resetPointerPosition();
    }

    public uiPressEnter () {
        if (this._judgeUIHit()) {
            this._event.deviceType = DeviceType.Other;
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
            this._pressState = true;
        }
    }

    public uiPressStay () {
        if (this._pressState) {
            this._event.deviceType = DeviceType.Other;
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_STAY, this._event);
        }
    }

    public uiPressExit () {
        if (this._pressState) {
            this._event.deviceType = DeviceType.Other;
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
            this._uiPressCollider = null;
            this._pressState = false;
        }
    }
}
