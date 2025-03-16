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

import { _decorator, Prefab, instantiate, CCObject, Node, MeshRenderer, Mesh, NodeEventType, Enum } from 'cc';
import { EDITOR } from 'cc/env';
import { ARFaceBlendShapes } from '../framework/actions/face-blend-shapes';
import { ARFaceExpressionEvents } from '../framework/actions/face-expression-events';
import { ARFaceLandMark } from '../framework/actions/face-landmark';
import { ARFaceTrackingContent } from '../framework/factors/face-tracking-content';
import { FaceBlendShapeEventParam, FeatureEventParam } from '../framework/utils/ar-defines';
import { ActionType, ARPropType, BlendShapeAssetName, FaceLandMarkType, FactorType, ARTrackingType } from '../framework/utils/ar-enum';
import { arEvent, ARInternalEventType } from '../framework/utils/ar-event';
import { ARTrackingBase } from './ar-tracking-base';

const { ccclass, property, help, menu, executeInEditMode } = _decorator;

/**
 * @en
 * Face tracking feature component
 * @zh
 * 脸部追踪特性组件
 */
@ccclass('cc.ARFaceTracking')
@help('i18n:cc.ARFaceTracking')
@menu('hidden:XR/AR Tracking/ARFaceTracking')
@executeInEditMode
export class ARFaceTracking extends ARTrackingBase {
    @property({ serializable: true, type: Prefab })
    protected _faceModelPrefab: Prefab | null = null;

    @property({ serializable: true })
    protected _faceTrackingContent: ARFaceTrackingContent | null = null;

    @property({ serializable: true })
    protected _faceLandMark: ARFaceLandMark | null = null;

    @property({ serializable: true })
    protected _faceBlendShapes: ARFaceBlendShapes | null = null;

    @property({ serializable: true })
    protected _faceExpressionEvents: ARFaceExpressionEvents | null = null;

    private _sceneFace: Node | null = null;
    private _modelComp: MeshRenderer = null!;
    private _morph!: NonNullable<Mesh['struct']['morph']>;

    @property({
        type: ARTrackingType,
        displayOrder: 1,
        readonly: true,
        tooltip: 'i18n:xr-plugin.tracking.trackingType',
        })
    set trackingType (val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
    }
    get trackingType () {
        return this._trackingType;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.tracking.faceModelPrefab',
        })
    set faceModelPrefab (val) {
        if (val === this._faceModelPrefab) {
            return;
        }
        this._faceModelPrefab = val;
        if (this._faceModelPrefab) {
            this.createSceneFaceModel();
            this.checkMorphModel();
        } else {
            if (this.faceBlendShapes) {
                this.faceBlendShapes.clear();
            }
            if (this._sceneFace) {
                this._sceneFace.destroy();
                this._sceneFace = null;
            }
        }
    }
    get faceModelPrefab () {
        return this._faceModelPrefab;
    }

    @property({
        displayOrder: 3,
        group: { name: 'Factor', displayOrder: 1},
        visible: (function (this: ARFaceTracking) {
            return this.faceTrackingContent !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.faceTrackingContent',
        })
    set faceTrackingContent (val) {
        if (val === this._faceTrackingContent) {
            return;
        }
        this._faceTrackingContent = val;
    }
    get faceTrackingContent () {
        return this._faceTrackingContent;
    }

    @property({
        displayOrder: 4,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARFaceTracking) {
            return this.faceLandMark !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.faceLandMark',
        })
    set faceLandMark (val) {
        if (val === this._faceLandMark) {
            return;
        }
        this._faceLandMark = val;
    }
    get faceLandMark () {
        return this._faceLandMark;
    }

    @property({
        displayOrder: 5,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARFaceTracking) {
            return this.faceBlendShapes !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.faceBlendShapes',
        })
    set faceBlendShapes (val) {
        if (val === this._faceBlendShapes) {
            return;
        }
        this._faceBlendShapes = val;
    }
    get faceBlendShapes () {
        return this._faceBlendShapes;
    }

    @property({
        displayOrder: 6,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARFaceTracking) {
            return this.faceExpressionEvents !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.faceExpressionEvents',
        })
    set faceExpressionEvents (val) {
        if (val === this._faceExpressionEvents) {
            return;
        }
        this._faceExpressionEvents = val;
    }
    get faceExpressionEvents () {
        return this._faceExpressionEvents;
    }

    onLoad () {
        if (EDITOR && !this.initialized) {
            this.initialized = true;
            if (this.menuFactors.length <= 0) {
                this.menuFactors.push(FactorType.FACE_CONTENT);
            }
            if (this.menuActions.length <= 0) {
                this.menuActions.push(ActionType.FACE_BLEND_SHAPES);
                this.menuActions.push(ActionType.FACE_EXPRESSION_EVENTS);
                this.menuActions.push(ActionType.FACE_LANDMARK);
            }

            this.trackingType = ARTrackingType.Face;
            if (!this.faceTrackingContent) {
                this.faceTrackingContent = new ARFaceTrackingContent(this.node.uuid);
            }
            if (!this.faceLandMark) {
                this.faceLandMark = new ARFaceLandMark();
                this.faceLandMark.initDefaultUI(this.node);
            }
            if (!this.faceBlendShapes) {
                this.faceBlendShapes = new ARFaceBlendShapes();
            }
            this.addFactor(this.faceTrackingContent);
            this.addAction(this.faceLandMark);
            this.addAction(this.faceBlendShapes);
        }
        if (this.faceTrackingContent) {
            this.faceTrackingContent.uuid = this.node.uuid;
        }
        this.registerEvent();
    }

    onDestroy () {
        super.onDestroy();
        if (this._sceneFace) {
            this._sceneFace.destroy();
            this._sceneFace = null;
        }
        if (this.faceLandMark) {
            this.faceLandMark.destroyDefaultUI();
            this.faceLandMark = null;
        }
        this.unregisterEvent();
    }

    onEnable () {
        super.onEnable();
        this.createSceneFaceModel();
        this.checkMorphModel();
    }

    onDisable () {
        super.onDestroy();
        if (this._sceneFace) {
            this._sceneFace.destroy();
            this._sceneFace = null;
        }
    }

    public registerEvent () {
        this.node.on(NodeEventType.CHILD_REMOVED, this.onChildDestroyEvent, this);
        arEvent.on(ARInternalEventType.FACE_BLEND_SHAPE, this.onFaceBlendShapeEvent, this);
    }

    public unregisterEvent () {
        this.node.off(NodeEventType.CHILD_REMOVED, this.onChildDestroyEvent, this);
        arEvent.off(ARInternalEventType.FACE_BLEND_SHAPE, this.onFaceBlendShapeEvent, this);
    }

    private onFaceBlendShapeEvent (event: FaceBlendShapeEventParam) {
        if (this._modelComp) {
            this._modelComp.setWeight(event.weight * event.scale, 0, event.shapeIndex);
        }
    }

    private onChildDestroyEvent (child: Node) {
        if (this.faceLandMark) {
            const type = this.faceLandMark.getLandMarkType(child);
            if (type > FaceLandMarkType.None && type < FaceLandMarkType.Max) {
                this.faceLandMark.removeLandMark(type);
            }
        }
    }

    private checkMorphModel () {
        if (!this._sceneFace) {
            return;
        }
        this._modelComp = this._sceneFace.getComponentInChildren(MeshRenderer)!;
        if (!this._modelComp) {
            console.warn('not find MeshRenderer Component');
            return;
        }
        const mesh = this._modelComp.mesh;
        if (!mesh) {
            console.warn('mesh == null');
            return;
        }

        this._morph = mesh.struct.morph!;
        if (!this._morph || !this._morph.targetNames) {
            console.warn('this._morph == null or this._morph.targetNames == null');
            return;
        }

        if (this._morph.subMeshMorphs.length === 0) {
            console.warn('submesh count is 0');
            return;
        }

        const firstNonNullSubMeshMorph = this._morph.subMeshMorphs.find((subMeshMorph) => !!subMeshMorph);
        if (!firstNonNullSubMeshMorph) {
            console.warn(`all submesh don't have morph`);
            return;
        }

        // eslint-disable-next-line max-len
        if (!this._morph.subMeshMorphs.every((subMeshMorph) => !subMeshMorph || subMeshMorph.targets.length === firstNonNullSubMeshMorph.targets.length)) {
            console.warn(`not all submesh count are the same`);
            return;
        }

        for (let i = 0; i < this._morph.targetNames.length; i++) {
            const targetNames = this._morph.targetNames[i].split('.');
            const name = targetNames[targetNames.length - 1];
            BlendShapeAssetName[name] = i;
        }
        Enum.update(BlendShapeAssetName);
        if (this.faceBlendShapes) {
            this.faceBlendShapes.initAssetName();
        }
    }

    private createSceneFaceModel () {
        this._sceneFace = this.node.getChildByName('__scene_face__');
        if (this._sceneFace) {
            this._sceneFace.destroy();
            this._sceneFace = null;
        }
        if (this.faceModelPrefab) {
            this._sceneFace = instantiate(this.faceModelPrefab);
            this._sceneFace.name = '__scene_face__';
            this.node.addChild(this._sceneFace);
            this._sceneFace._objFlags |= CCObject.Flags.HideInHierarchy;
        }
    }

    public updateFeature (canUse: boolean) {
        const param: FeatureEventParam = {
            ft: ARTrackingType.Face,
            uuid: this.node.uuid,
            canUse,
            tracking: this,
        };
        arEvent.collectFeature(param);
    }

    public addProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.FACE_CONTENT:
                this.faceTrackingContent = new ARFaceTrackingContent(this.node.uuid);
                this.addFactor(this.faceTrackingContent);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.FACE_BLEND_SHAPES:
                this.faceBlendShapes = new ARFaceBlendShapes();
                this.addAction(this.faceBlendShapes);
                break;
            case ActionType.FACE_LANDMARK:
                this.faceLandMark = new ARFaceLandMark();
                this.faceLandMark.initDefaultUI(this.node);
                this.addAction(this.faceLandMark);
                break;
            case ActionType.FACE_EXPRESSION_EVENTS:
                this.faceExpressionEvents = new ARFaceExpressionEvents();
                this.addAction(this.faceExpressionEvents);
                break;
            default:
                break;
            }
        }
    }

    public removeProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.FACE_CONTENT:
                this.faceTrackingContent = null;
                this.removeFactor(args1);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.FACE_BLEND_SHAPES:
                this.faceBlendShapes = null;
                this.removeAction(args1);
                break;
            case ActionType.FACE_LANDMARK:
                this.faceLandMark?.destroyDefaultUI();
                this.faceLandMark = null;
                this.removeAction(args1);
                break;
            case ActionType.FACE_EXPRESSION_EVENTS:
                this.faceExpressionEvents = null;
                this.removeAction(args1);
                break;
            default:
                break;
            }
        }
    }

    public resetProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.FACE_CONTENT:
                this.faceTrackingContent?.reset();
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.FACE_BLEND_SHAPES:
                this.faceBlendShapes?.reset();
                break;
            case ActionType.FACE_LANDMARK:
                this.faceLandMark?.reset();
                break;
            case ActionType.FACE_EXPRESSION_EVENTS:
                this.faceExpressionEvents?.reset();
                break;
            default:
                break;
            }
        }
    }

    public removeLandMarkProp (args: any): void {
        if (this.faceLandMark) {
            this.faceLandMark.removeLandMark(args);
        }
    }

    public addLandMarkProp (args: any): void {
        if (this.faceLandMark) {
            this.faceLandMark.addLandMark(this.node, args);
        }
    }

    public removeBlendShapeProp (args: any): void {
        if (this.faceBlendShapes) {
            this.faceBlendShapes.removeBlendShape(args);
        }
    }

    public addBlendShapeProp (args: any): void {
        if (this.faceBlendShapes) {
            this.faceBlendShapes.addBlendShape(args);
        }
    }

    public enableBlendShapeProp (args0: any, args1: any): void {
        if (this.faceBlendShapes) {
            this.faceBlendShapes.enableBlendShape(args0, args1);
        }
    }
}
