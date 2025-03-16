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

import { instantiate, _decorator, Node, MeshRenderer } from 'cc';
import { ARTrackable } from '../../tracking/ar-trackable';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ActionBlendShapesData, ARFaceBlendShape, FaceBlendShapeEventParam } from '../utils/ar-defines';
import { ActionType, ARFaceBlendShapeType, BlendShapeAssetName } from '../utils/ar-enum';
import { arEvent, ARInternalEventType } from '../utils/ar-event';
import { ARActionBase } from './action-base';

const { ccclass, property } = _decorator;

@ccclass('cc.ARFaceExpressionItem')
export class ARFaceExpressionItem {
    @property({ serializable: true })
    protected _assetName: BlendShapeAssetName = BlendShapeAssetName['<None>'];
    @property({ serializable: true })
    protected _scale = 1;
    @property({ serializable: true })
    protected _weight = 0;

    //Inspector extension
    @property({ serializable: true, visible: false})
    public enabled = true;
    @property({ serializable: true, visible: false})
    public blendShapeType: ARFaceBlendShapeType = ARFaceBlendShapeType.None;

    @property({ serializable: true, visible: false})
    public assetIdx = 0;

    @property({type: BlendShapeAssetName, displayOrder: 1 })
    set asset_Blend_Shape (val) {
        if (val === this._assetName) {
            return;
        }
        this._assetName = val;
        this.assetIdx = val;
    }
    get asset_Blend_Shape () {
        return this._assetName;
    }

    @property({ displayOrder: 2, range: [1, 2], slide: true, step: 0.1})
    set scale (val) {
        if (val === this._scale) {
            return;
        }
        this._scale = val;

        const param: FaceBlendShapeEventParam = {
            shapeIndex: this.assetIdx,
            scale: this.scale,
            weight: this.weight,
        };
        arEvent.dispatch(ARInternalEventType.FACE_BLEND_SHAPE, param);
    }
    get scale () {
        return this._scale;
    }

    @property({ displayOrder: 3, range: [0, 1], slide: true, step: 0.1})
    set weight (val) {
        if (val === this._weight) {
            return;
        }
        this._weight = val;

        const param: FaceBlendShapeEventParam = {
            shapeIndex: this.assetIdx,
            scale: this.scale,
            weight: this.weight,
        };
        arEvent.dispatch(ARInternalEventType.FACE_BLEND_SHAPE, param);
    }
    get weight () {
        return this._weight;
    }
}

@ccclass('cc.ARFaceBlendShapes')
export class ARFaceBlendShapes  extends ARActionBase <ActionBlendShapesData> {
    @property({ serializable: true })
    protected _blendNormals = false;
    @property({ serializable: true })
    protected _blendShapes: ARFaceExpressionItem[] = [];

    constructor () {
        super();
        this.type = ActionType.FACE_BLEND_SHAPES;
    }

    @property({ displayOrder: 1 })
    set blendNormals (val) {
        if (val === this._blendNormals) {
            return;
        }
        this._blendNormals = val;
    }
    get blendNormals () {
        return this._blendNormals;
    }

    @property({type: [ARFaceExpressionItem], displayOrder: 1, readonly: true})
    set blendShapes (val) {
        if (val === this._blendShapes) {
            return;
        }
        this._blendShapes = val;
    }
    get blendShapes () {
        return this._blendShapes;
    }

    public addBlendShape (type: ARFaceBlendShapeType) {
        let bCheck = false;
        for (let index = 0; index < this._blendShapes.length; index++) {
            const e = this._blendShapes[index];
            if (e.blendShapeType === type) {
                bCheck = true;
                break;
            }
        }
        if (bCheck) {
            return;
        }
        const item = new ARFaceExpressionItem();
        item.blendShapeType = type;

        this._blendShapes.push(item);
    }

    public removeBlendShape (type: ARFaceBlendShapeType) {
        for (let index = 0; index < this._blendShapes.length; index++) {
            const e = this._blendShapes[index];
            if (e.blendShapeType === type) {
                this._blendShapes.splice(index, 1);
                break;
            }
        }
    }

    public enableBlendShape (type: ARFaceBlendShapeType, enabled: boolean) {
        for (let index = 0; index < this._blendShapes.length; index++) {
            const e = this._blendShapes[index];
            if (e.blendShapeType === type) {
                e.enabled = enabled;
                break;
            }
        }
    }

    public clear () {
        this._blendShapes.length = 0;
    }

    public initAssetName () {
        for (let index = 0; index < this._blendShapes.length; index++) {
            const e = this._blendShapes[index];
            e.asset_Blend_Shape = e.assetIdx;
        }
    }

    private doAction (data, blendShapes: ARFaceBlendShape) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        let modelNode: Node = data.parentNode.getChildByName(`__face_model_${data.id}`);
        if (!modelNode) {
            if (!data.trackingNode || !data.parentNode) {
                return;
            }

            modelNode = instantiate(data.trackingNode);
            const trackingBase = modelNode.getComponent(ARTrackingBase);
            if (trackingBase) {
                trackingBase.destroy();
            }
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            modelNode.name = `__face_model_${data.id}`;
            data.parentNode.addChild(modelNode);
            modelNode.setWorldPosition(data.center.position);
            modelNode.setWorldRotation(data.center.rotation);

            //add trackable
            const trackable = modelNode.addComponent(ARTrackable);
            trackable.trackingId = data.id;

            const c = modelNode.children;
            c.forEach((element) => {
                element.active = true;
            });
        }
        const modelComp = modelNode.getComponentInChildren(MeshRenderer);
        if (!modelComp) {
            console.warn('not find MeshRenderer Component');
            return;
        }
        const mesh = modelComp.mesh;
        if (!mesh) {
            console.warn('mesh == null');
            return;
        }

        const morph = mesh.struct.morph;
        if (!morph) {
            console.warn('this._morph == null');
            return;
        }

        if (morph.subMeshMorphs.length === 0) {
            console.warn('submesh count is 0');
            return;
        }

        for (let index = 0; index < this._blendShapes.length; index++) {
            const e = this._blendShapes[index];
            if (e.blendShapeType.toFixed() === blendShapes.type.toFixed()) {
            //if (e.blendShapeType == blendShapes.type) {
                if (modelComp) {
                    modelComp.setWeight(blendShapes.value * e.scale, 0, e.assetIdx);
                }
            }
        }
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ActionBlendShapesData) {
        for (let index = 0; index < data.blendShapes.length; index++) {
            const element: ARFaceBlendShape = data.blendShapes[index];
            this.doAction(data, element);
        }
        this.setActivated(true);
    }

    public reset () {

    }
}
