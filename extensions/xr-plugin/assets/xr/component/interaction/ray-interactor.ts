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

import { _decorator, ccenum, Node, Collider, Line, Color, Vec3, Mat4, PhysicsSystem, PhysicsRayResult, CCBoolean, geometry, game } from 'cc';
import { EDITOR } from 'cc/env';
import { InteractorEvents } from '../event/interactor-events';
import { XrInteractor } from './xr-interactor';
import { IXrInteractable, XrControlEventType, XrInteractable, InteractorTriggerState, SelectActionTrigger_Type } from './xr-interactable';
import { RaycastChecker } from '../xrui/raycast-checker';
import { InteractionMask } from './interaction-mask';

const { ccclass, help, menu, property, executeInEditMode } = _decorator;

enum Line_Type {
    Straight_Line = 0,
    Projectile_Line = 1,
    Bezier_Line = 2
}

enum Layer_Type {
    EVERYTHING = 0,
    NOTHING = 1,
    IGNORE_RAYCAST = 2,
    GIZMOS = 3,
    EDITOR = 4,
    UI_3D = 5,
    SCENE_GIZMO = 6,
    UI_2D = 7,
    PROFILER = 8,
    DEFAULT = 9
}

enum RaycastTrigger_Type {
    COLLIDE = 0,
    IGNORE = 1,
    USE_GLOBAL = 2
}

enum HitDirection_Type {
    RAY_CAST = 0,
    SPHERE_CAST = 1,
}

ccenum(Line_Type);
ccenum(Layer_Type);
ccenum(RaycastTrigger_Type);
ccenum(HitDirection_Type);
ccenum(SelectActionTrigger_Type);

/**
 * @en
 * Interact with object distantly by ray which originate from controller.
 * @zh
 * 射线交互器组件
 */
@ccclass('cc.RayInteractor')
@help('i18n:cc.RayInteractor')
@menu('XR/Interaction/RayInteractor')
@executeInEditMode
export class RayInteractor extends XrInteractor {
    @property({ serializable: true })
    protected _forceGrab = true;
    @property({ serializable: true })
    protected _rayOriginTransform: Node | null = null;
    @property({ serializable: true })
    protected _reticle: Node | null = null;
    @property({ serializable: true })
    protected _lineType: Line_Type = Line_Type.Straight_Line;

    @property({ serializable: true })
    protected _maxRayDistance = 30;

    @property({ serializable: true })
    protected _referenceNode: Node | null = null;
    @property({ serializable: true })
    protected _velocity = 16;
    @property({ serializable: true })
    protected _acceleration = 9.8;
    @property({ serializable: true })
    protected _additionalGroundHeight = 0.1;
    @property({ serializable: true })
    protected _additionalFlightTime = 0.5;

    @property({ serializable: true })
    protected _endPointDistance = 30;
    @property({ serializable: true })
    protected _endPointHeight = -10;
    @property({ serializable: true })
    protected _controlPointDistance = 10;
    @property({ serializable: true })
    protected _controlPointHeight = 5;

    @property({ serializable: true })
    protected _sampleFrequency = 20;

    @property({ serializable: true })
    protected _rayCastMask = 0xffffffff;

    private _rayHitCollider: Collider | null = null;
    private _line: Line | null = null;
    private _linePositions: any = [];
    private _lineOriColor: Color | undefined = undefined;
    protected _pressState = false;

    private _orginalScale: Vec3 = new Vec3();
    private _vec3_0: Vec3 = new Vec3();
    private _vec3_1: Vec3 = new Vec3();
    private _linePointsCount = 100;
    private _rayOrigin!: Node;
    private _isSupportLineStripCast = false;

    @property({
        type: CCBoolean,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.ray_interactor.forceGrab'
        })
    set forceGrab (val) {
        if (val === this._forceGrab) {
            return;
        }
        this._forceGrab = val;
    }
    get forceGrab () {
        return this._forceGrab;
    }

    @property({
        type: Node,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.ray_interactor.rayOriginTransform'
        })
    set rayOriginTransform (val) {
        if (val === this._rayOriginTransform) {
            return;
        }
        this._rayOriginTransform = val;
    }
    get rayOriginTransform () {
        return this._rayOriginTransform;
    }

    @property({
        type: Node,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.ray_interactor.reticle'
        })
    set reticle (val) {
        if (val === this._reticle) {
            return;
        }
        this._reticle = val;
    }
    get reticle () {
        return this._reticle;
    }

    @property({
        type: Line_Type,
        displayOrder: 8,
        tooltip: 'i18n:xr-plugin.ray_interactor.lineType'
        })
    set lineType (val) {
        if (val === this._lineType) {
            return;
        }
        this._lineType = val;
        this._updateLinePos();
    }
    get lineType () {
        return this._lineType;
    }

    @property({
        displayOrder: 9,
        tooltip: 'i18n:xr-plugin.ray_interactor.maxRayDistance',
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Straight_Line;
            }),
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
        type: Node,
        displayOrder: 9,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line || this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.referenceNode'
        })
    set referenceNode (val) {
        if (val === this._referenceNode) {
            return;
        }
        this._referenceNode = val;
        this._updateLinePos();
    }
    get referenceNode () {
        return this._referenceNode;
    }

    @property({
        displayOrder: 10,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.velocity'
        })
    set velocity (val) {
        if (val === this._velocity) {
            return;
        }
        this._velocity = val;
        this._updateLinePos();
    }
    get velocity () {
        return this._velocity;
    }

    @property({
        displayOrder: 11,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.acceleration'
        })
    set acceleration (val) {
        if (val === this._acceleration) {
            return;
        }
        this._acceleration = val;
        this._updateLinePos();
    }
    get acceleration () {
        return this._acceleration;
    }

    @property({
        displayOrder: 12,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.additionalGroundHeight'
        })
    set additionalGroundHeight (val) {
        if (val === this._additionalGroundHeight) {
            return;
        }
        this._additionalGroundHeight = val;
        this._updateLinePos();
    }
    get additionalGroundHeight () {
        return this._additionalGroundHeight;
    }

    @property({
        displayOrder: 13,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.additionalFlightTime'
        })
    set additionalFlightTime (val) {
        if (val === this._additionalFlightTime) {
            return;
        }
        this._additionalFlightTime = val;
        this._updateLinePos();
    }
    get additionalFlightTime () {
        return this._additionalFlightTime;
    }

    @property({
        displayOrder: 10,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.endPointDistance'
        })
    set endPointDistance (val) {
        if (val === this._endPointDistance) {
            return;
        }
        this._endPointDistance = val;
        this._updateLinePos();
    }
    get endPointDistance () {
        return this._endPointDistance;
    }

    @property({
        displayOrder: 11,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.endPointHeight'
        })
    set endPointHeight (val) {
        if (val === this._endPointHeight) {
            return;
        }
        this._endPointHeight = val;
        this._updateLinePos();
    }
    get endPointHeight () {
        return this._endPointHeight;
    }

    @property({
        displayOrder: 12,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.controlPointDistance'
        })
    set controlPointDistance (val) {
        if (val === this._controlPointDistance) {
            return;
        }
        this._controlPointDistance = val;
        this._updateLinePos();
    }
    get controlPointDistance () {
        return this._controlPointDistance;
    }

    @property({
        displayOrder: 13,
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.controlPointHeight'
        })
    set controlPointHeight (val) {
        if (val === this._controlPointHeight) {
            return;
        }
        this._controlPointHeight = val;
        this._updateLinePos();
    }
    get controlPointHeight () {
        return this._controlPointHeight;
    }

    @property({
        displayOrder: 14,
        slide: true,
        range: [2, 100, 1],
        visible: (function (this: RayInteractor) {
            return this._lineType === Line_Type.Projectile_Line || this._lineType === Line_Type.Bezier_Line;
            }),
        tooltip: 'i18n:xr-plugin.ray_interactor.sampleFrequency'
        })
    set sampleFrequency (val) {
        if (val === this._sampleFrequency) {
            return;
        }
        this._sampleFrequency = val;
        this._updateLinePos();
    }
    get sampleFrequency () {
        return this._sampleFrequency;
    }

    @property({
        type: InteractionMask.BitMask,
        displayOrder: 15,
        tooltip: 'i18n:xr-plugin.ray_interactor.rayCastMask'
        })
    set rayCastMask (val) {
        if (val === this._rayCastMask) {
            return;
        }
        this._rayCastMask = val;
    }
    get rayCastMask () {
        return this._rayCastMask;
    }

    onEnable () {
        super.onEnable();
        if (this.reticle) {
            this._orginalScale.set(this.reticle.scale);
        }

        this._line = this.getComponent(Line);
        if (this._rayOriginTransform && this._line) {
            if (!this._isOnlyEditor()) {
                const lineNode = new Node('lineNode');
                const line = lineNode.addComponent(Line);
                this._copyLine(line, this._line);
                lineNode.parent = this._rayOriginTransform;

                this._line.destroy();
                this._line = line;
            }
            this._rayOrigin = this._rayOriginTransform;
        } else {
            this._rayOrigin = this.node;
        }

        this._lineOriColor = this._line?.color.color;
        this._interactorEvents = this.getComponent(InteractorEvents);
        this._event.forceGrab = this._forceGrab;

        this._updateLinePos();
        this._setReticle();

        this._isSupportLineStripCast = typeof PhysicsSystem.instance.lineStripCastClosest !== 'undefined';
    }

    onDisable () {
        super.onDisable();
        this._setLinehover(false);
        this._setLinePosition(false);
    }

    start () {
        this._setAttachNode();
    }

    protected _setAttachNode () {
        if (this._isOnlyEditor()) {
            return;
        }
        if (!this.forceGrab) {
            const attachNode = new Node();
            attachNode.parent = this.node;
            this._event.attachNode = attachNode;
        } else if (this._attachTransform) {
            this._event.attachNode = this._attachTransform;
        } else {
            this._event.attachNode = this.node;
        }
    }

    private _isOnlyEditor () {
        if (EDITOR && game.frameStartTime === 0) {
            return true;
        }
        return false;
    }

    private _copyLine (outLine: Line, inLine: Line) {
        outLine.texture = inLine.texture;
        outLine.worldSpace = inLine.worldSpace;
        outLine.width = inLine.width;
        outLine.tile = inLine.tile;
        outLine.offset = inLine.offset;
        outLine.color = inLine.color;
        outLine.material = inLine.material;
    }

    private _calculateProjectile (initVelocity: Vec3, initAcceleration: Vec3) {
        let acceleration = this._acceleration;
        if (acceleration === 0) {
            acceleration = 0.000001;
        }
        // Velocity in all directions (in world coordinates)
        Vec3.multiplyScalar(initVelocity, this._rayOrigin.forward, this._velocity);
        // The direction up from the origin, normal to the horizontal plane
        const initUp = this._referenceNode ? this._referenceNode.up : Vec3.UP;
        // Gravity in all directions
        Vec3.multiplyScalar(initAcceleration, initUp, -acceleration);
        // The projection of a ray onto a horizontal plane
        Vec3.projectOnPlane(this._vec3_0, this._rayOrigin.forward, initUp);
        // The Angle between the ray and the plane
        const angle = Vec3.angle(this._rayOrigin.forward, this._vec3_0);
        // Vertical initial velocity (in referenceNode relative coordinate system)
        const initVY = Math.sin(angle) * initVelocity.y;
        // Vertical descent distance
        this._vec3_0 = (this._referenceNode ? this._referenceNode.worldPosition : Vec3.ZERO).clone();
        Vec3.subtract(this._vec3_1, this._vec3_0, this._rayOrigin.worldPosition);
        const height = Vec3.project(this._vec3_0, this._vec3_1, initUp).length() + this._additionalGroundHeight;
        // Acquisition drop time
        let flightTime = 0;
        if (height < 0) {
            flightTime = this._additionalFlightTime;
        } else {
            flightTime = (initVY + Math.sqrt(initVY * initVY + 2 * acceleration * height)) / acceleration + this._additionalFlightTime;
        }
        flightTime = Math.max(flightTime, 0);
        return flightTime;
    }

    private _calculateBezier (point0: Vec3, point1: Vec3, point2: Vec3) {
        const forward = this._rayOrigin.forward;
        const up = this._referenceNode ? this._referenceNode.up : Vec3.UP;
        // 0
        point0.set(this._rayOrigin.worldPosition);
        // 1
        Vec3.multiplyScalar(this._vec3_0, forward, this._controlPointDistance);
        Vec3.multiplyScalar(this._vec3_1, up, this._controlPointHeight);
        Vec3.add(point1, point0, this._vec3_0);
        point1.add(this._vec3_1);
        // 2
        Vec3.multiplyScalar(this._vec3_0, forward, this._endPointDistance);
        Vec3.multiplyScalar(this._vec3_1, up, this._endPointHeight);
        Vec3.add(point2, point0, this._vec3_0);
        point2.add(this._vec3_1);
    }

    private _updateLinePos () {
        // 清空数据
        if (this._linePositions) {
            this._linePositions.length = 0;
        }
        if (this._line && this._line.worldSpace) {
            this._line.worldSpace = false;
        }
        // 起始点坐标
        this._linePositions?.push(Vec3.ZERO);
        if (this._isOnlyEditor() || this._isSupportLineStripCast) {
            switch (this._lineType) {
            case Line_Type.Straight_Line:
                this._linePositions.push(new Vec3(0, 0, -this._maxRayDistance));
                break;
            case Line_Type.Projectile_Line:
                {
                    const initVelocity: Vec3 = new Vec3();
                    const initAcceleration: Vec3 = new Vec3();
                    const flightTime = this._calculateProjectile(initVelocity, initAcceleration);

                    const count = this._sampleFrequency;
                    const interval = flightTime / (count - 1);
                    for (let i = 1; i < count; ++i) {
                        const time = i * interval;
                        Vec3.multiplyScalar(this._vec3_0, initVelocity, time);
                        Vec3.add(this._vec3_0, this._rayOrigin.worldPosition, this._vec3_0);
                        Vec3.multiplyScalar(this._vec3_1, initAcceleration, 0.5 * time * time);
                        this._vec3_0.add(this._vec3_1);
                        this._rayOrigin.inverseTransformPoint(this._vec3_0, this._vec3_0.clone());
                        this._linePositions.push(this._vec3_0.clone());
                    }
                }
                break;
            case Line_Type.Bezier_Line:
                {
                    const point0 = new Vec3();
                    const point1 = new Vec3();
                    const point2 = new Vec3();
                    this._calculateBezier(point0, point1, point2);

                    const count = this._sampleFrequency;
                    const interval = 1 / (count - 1);
                    for (let i = 1; i < count; ++i) {
                        const t = i * interval;
                        const u = 1 - t; // (1 - t)
                        const uu = u * u; // (1 - t)²
                        const tt = t * t; // t²

                        // (1 - t)²P₀ + 2(1 - t)tP₁ + t²P₂ where 0 ≤ t ≤ 1
                        // u²P₀ + 2utP₁ + t²P₂
                        Vec3.multiplyScalar(this._vec3_0, point0, uu);
                        Vec3.multiplyScalar(this._vec3_1, point1, 2 * u * t);
                        this._vec3_0.add(this._vec3_1);
                        Vec3.multiplyScalar(this._vec3_1, point2, tt);
                        this._vec3_0.add(this._vec3_1);
                        this._rayOrigin.inverseTransformPoint(this._vec3_0, this._vec3_0.clone());

                        this._linePositions.push(this._vec3_0.clone());
                    }
                }
                break;
            default:
                break;
            }
        } else {
            this._linePositions.push(new Vec3(0, 0, -this._maxRayDistance));
        }

        if (this._line) {
            this._line.positions = this._linePositions;
        }
    }

    private _convertToWorldSpace (rayNode: Node, nodePoint: Vec3, out?: Vec3) {
        const _worldMatrix = new Mat4();
        rayNode.getWorldMatrix(_worldMatrix);
        if (!out) {
            out = new Vec3();
        }

        return Vec3.transformMat4(out, nodePoint, _worldMatrix);
    }

    public getLineWorldPositions () {
        if (this._line?.worldSpace) {
            return this._linePositions as Array<Vec3>;
        }
        const positions: Array<Vec3> = new Array<Vec3>();
        for (let i = 0; i < this._linePositions.length; ++i) {
            positions.push(this._convertToWorldSpace(this._rayOrigin, this._linePositions[i]));
        }
        return positions;
    }

    private _rayCast (mask) {
        let hit = false;
        if (this._isSupportLineStripCast) {
            hit = PhysicsSystem.instance.lineStripCastClosest(this.getLineWorldPositions(), mask, this.maxRayDistance, true);
        } else {
            const dir = new Vec3();
            if (this._line && this._linePositions.length === 2) {
                const vec3Like = Vec3.subtract(new Vec3(), this._linePositions[1], this._linePositions[0]);
                Vec3.transformQuat(dir, vec3Like, this._line.node.getWorldRotation());
            }
            const start = this._convertToWorldSpace(this._rayOrigin, this._linePositions[0] as Vec3);
            const ray = new geometry.Ray(start.x, start.y, start.z, dir.x, dir.y, dir.z);
            hit = PhysicsSystem.instance.raycastClosest(ray, this._interactionLayerMask, this.maxRayDistance, true);
        }
        return hit;
    }

    private _rayCastClosestResult () {
        if (this._isSupportLineStripCast) {
            return PhysicsSystem.instance.lineStripCastClosestResult;
        }
        return PhysicsSystem.instance.raycastClosestResult;
    }

    private _rayCastId (): number {
        if (this._isSupportLineStripCast) {
            return PhysicsSystem.instance.lineStripCastClosestResult.id;
        }
        return 0;
    }

    protected _judgeHit (type: XrControlEventType) {
        if (!this._line || !this._line.node.active) {
            return false;
        }

        const hit = this._rayCast(this._interactionLayerMask);
        if (hit) {
            // Get collision box
            const closestResult = this._rayCastClosestResult();
            // Check whether the collision box has an InteracTable
            const xrInteractable = closestResult.collider?.getComponent(XrInteractable);
            if (xrInteractable) {
                this._beTriggerNode = xrInteractable;
                // this._collider = closestResult.collider;
                this._event.hitPoint = closestResult.hitPoint;
                if (type === XrControlEventType.SELECT_ENTERED || type === XrControlEventType.SELECT_EXITED) {
                    if (this._collider && this._collider !== closestResult.collider) {
                        this._collider.node.emit(InteractorTriggerState.Select_Canceled, this._event);
                    }
                    this._collider = closestResult.collider;
                } else if (type === XrControlEventType.ACTIVATED || type === XrControlEventType.DEACTIVITED) {
                    if (this._activateCollider && this._activateCollider !== closestResult.collider) {
                        this._activateCollider.node.emit(InteractorTriggerState.Activite_Canceled, this._event);
                    }
                    this._activateCollider = closestResult.collider;
                }
                return true;
            }
        }

        return false;
    }

    protected _judgeUIHit () {
        if (!this._line || !this._line.node.active) {
            return false;
        }

        const hit = this._rayCast(this.interactionLayerMask);
        if (hit) {
            // Get collision box
            const closestResult = this._rayCastClosestResult();
            // Check whether the collision box has an UI3DBase
            const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
            if (ui3DBase) {
                this._uiPressCollider = closestResult.collider;
                return true;
            }
        }

        return false;
    }

    private _handleHoverEnter (closestResult: PhysicsRayResult) {
        this._setLinehover(true);
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
            } else {
                this._interactorEvents?.hoverStay(this._event);
            }
        } else {
            // Replace hit object, triggering HOVER_ENTERED
            this._rayHitCollider = closestResult.collider;
            this._interactorEvents?.hoverEntered(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_ENTERED, this._event);
        }

        // Send stay, intermediate state, send position point
        this._rayHitCollider.node.emit(XrControlEventType.HOVER_STAY, this._event);
    }

    private _handleHoverExit () {
        this._setLinehover(false);
        // Set ray coordinates
        this._setLinePosition(false);
        // Determine if there was a hit last time
        if (this._rayHitCollider) {
            // HOVER_EXITED is triggered if an object is hit
            this._interactorEvents?.hoverExited(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_EXITED, this._event);
            this._rayHitCollider = null;
        }
    }

    private _interactionHit (closestResult: PhysicsRayResult) {
        this._handleHoverEnter(closestResult);
    }

    private _ui3dHit (closestResult: PhysicsRayResult) {
        this._handleHoverEnter(closestResult);
    }

    update () {
        if (this._isOnlyEditor() || !this._line || !this._line.node.active) {
            return;
        }

        if (this._lineType !== Line_Type.Straight_Line) {
            this._updateLinePos();
        }

        const hit = this._rayCast(this._rayCastMask);
        if (hit) {
            // Get the coordinates of the collision point
            const closestResult = this._rayCastClosestResult();
            this._event.hitPoint = closestResult.hitPoint;
            // Set ray coordinates
            this._setLinePosition(true, this._rayCastId() + 1);

            const xrInteractable = closestResult.collider?.getComponent(IXrInteractable);
            if (xrInteractable) {
                this._interactionHit(closestResult);
            } else {
                const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
                if (ui3DBase) {
                    this._ui3dHit(closestResult);
                } else {
                    this._event.hitPoint = null;
                    this._handleHoverExit();
                }
            }
        } else {
            this._event.hitPoint = null;
            this._handleHoverExit();
        }
    }

    private _setLinehover (isHover: boolean) {
        if (!this._line) {
            return;
        }

        // Ray color change
        if (isHover) {
            this._line.color.color = Color.GREEN.clone();
        } else if (this._lineOriColor) {
            this._line.color.color = this._lineOriColor;
        }
    }

    private _setLinePosition (isWorld: boolean, endIndex?: number) {
        if (!this._line || this._isOnlyEditor()) {
            return;
        }
        if (this._line.worldSpace) {
            this._line.worldSpace = false;
        }
        if (isWorld && endIndex && this._event.hitPoint) {
            // Gets the sequence number of the last point before the hit
            const step = Math.ceil(this._linePointsCount / this._sampleFrequency);
            const index = (endIndex - 1) * step;
            const pos = this._linePositions.slice(0, index + 1);
            this._rayOrigin.inverseTransformPoint(this._vec3_0, this._event.hitPoint);
            pos.push(this._vec3_0);
            this._line.positions = pos;
        } else if (this._line.positions !== this._linePositions) {
            this._line.positions = this._linePositions;
        }

        this._setReticle();
    }

    private _setReticle () {
        if (this._line && this._line.positions?.length > 1 && !this._isOnlyEditor()) {
            this.reticle?.setWorldPosition(this._convertToWorldSpace(this._rayOrigin, this._line.positions[this._line.positions.length - 1]));
            const endPoint = this._line.positions[this._line.positions.length - 1];
            this.reticle?.setScale(new Vec3(this._orginalScale).multiplyScalar(Vec3.distance(this._line.positions[0], endPoint)));
        }
    }

    public uiPressEnter () {
        if (this._judgeUIHit()) {
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
            this._pressState = true;
        }
    }

    public uiPressExit () {
        if (this._pressState) {
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
            this._uiPressCollider = null;
            this._pressState = false;
        }
    }
}
