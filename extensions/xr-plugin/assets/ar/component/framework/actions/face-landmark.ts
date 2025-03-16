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

import { _decorator, Node } from 'cc';
import { FaceLandMarkController } from '../../tracking/face-landmark-controller';
import { ARActionData } from '../utils/ar-defines';
import { ActionType, FaceLandMarkType } from '../utils/ar-enum';
import { ARActionBase } from './action-base';

const { ccclass, property } = _decorator;

@ccclass('cc.ARFaceLandMark')
export class ARFaceLandMark extends ARActionBase <ARActionData> {
    @property({ serializable: true })
    protected _pointList: Node[] =  [];

    @property({type: [Node], displayOrder: 1, readonly: true})
    set pointList (val) {
        if (val === this._pointList) {
            return;
        }
        this._pointList = val;
    }
    get pointList () {
        return this._pointList;
    }

    //Inspector extension
    @property({ serializable: true, visible: false})
    private landMarks: FaceLandMarkType[] = [];

    @property({ serializable: true, visible: false})
    private rootNode: Node | null = null;

    private _defaults: FaceLandMarkType[] = [];
    constructor () {
        super();
        this.type = ActionType.FACE_LANDMARK;

        this._defaults.push(FaceLandMarkType.Chin);
        this._defaults.push(FaceLandMarkType.ForeHead);
        this._defaults.push(FaceLandMarkType.Left_EyeBrow);
        this._defaults.push(FaceLandMarkType.Right_EyeBrow);
        this._defaults.push(FaceLandMarkType.Left_Pupil);
        this._defaults.push(FaceLandMarkType.Right_Pupil);
        this._defaults.push(FaceLandMarkType.Nose_Tip);
        this._defaults.push(FaceLandMarkType.Mouth);
    }

    public initDefaultUI (parent: Node | null) {
        this.rootNode = parent;
        if (!this.rootNode) {
            return;
        }
        this.pointList.length = 0;
        this._defaults.forEach((element, index) => {
            const node = new Node(`${FaceLandMarkType[element]}`);
            parent?.addChild(node);

            const landmark = node.addComponent(FaceLandMarkController);
            landmark.tag = this._defaults[index];

            this._pointList.push(node);
            this.landMarks.push(this._defaults[index]);
        });
    }

    public destroyDefaultUI () {
        this._pointList.forEach((element, index) => {
            if (element) {
                element.destroy();
            }
        });
        this.pointList.length = 0;
        this.landMarks.length = 0;
    }

    public getLandMarkType (node: Node) {
        const landmark = node.getComponent(FaceLandMarkController);
        if (landmark) {
            return landmark.tag;
        }
        return FaceLandMarkType.None;
    }

    public removeLandMark (type: FaceLandMarkType) {
        for (let index = 0; index < this.pointList.length; index++) {
            const element = this.pointList[index];
            if (!element) {
                this._pointList.splice(index, 1);
                this.landMarks.splice(index, 1);
                break;
            }
            const landmark: FaceLandMarkController = element.getComponent(FaceLandMarkController)!;
            if (landmark && landmark.tag === type) {
                element.destroy();
                this._pointList.splice(index, 1);
                this.landMarks.splice(index, 1);
                break;
            }
        }
    }

    public addLandMark (parent: Node, type: FaceLandMarkType) {
        let bCheck = false;
        for (let index = 0; index < this.landMarks.length; index++) {
            const e = this.landMarks[index];
            if (e === type) {
                bCheck = true;
                break;
            }
        }
        if (bCheck) {
            return;
        }

        const node = new Node(`${FaceLandMarkType[type]}`);
        parent.addChild(node);

        const landmark = node.addComponent(FaceLandMarkController);
        landmark.tag = type;

        this._pointList.push(node);
        this.landMarks.push(type);
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        this.setActivated(true);
    }

    public reset () {
        this.destroyDefaultUI();
        setTimeout(() => {
            this.initDefaultUI(this.rootNode);
        }, 100);
    }
}
