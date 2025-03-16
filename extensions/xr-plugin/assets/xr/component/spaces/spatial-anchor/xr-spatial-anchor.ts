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

import { _decorator, Component, Vec3, Quat } from 'cc';

const { ccclass, menu } = _decorator;

export enum AnchorState {
    UNKNOWN,
    CREATING,
    CREATED,
    SAVING,
    SAVED,
    REMOVING,
    REMOVED
}

export class XRSpatialAnchorData {
    public name = 'sa';
    public id = 0;
    public isSaved = false;
    public isFromPersistArea = false;
    public isTracked = false;
    public isValid = false;
    public posePosition: Vec3 = new Vec3();
    public poseOrientation: Quat = new Quat();

    praseData (singleAnchorData: string) {
        this.isValid = false;
        if (singleAnchorData.length > 0) {
            const dataArray: string[] = singleAnchorData.split('|');
            this.praseDataArray(dataArray);
        }
    }

    praseDataArray (dataArray: string[]) {
        this.isValid = false;
        if (dataArray.length > 0) {
            this.id = parseFloat(dataArray[0]);
            this.name = dataArray[1];
            this.isSaved = parseInt(dataArray[2]) === 1;
            this.isFromPersistArea = parseInt(dataArray[3]) === 1;
            this.isTracked = parseInt(dataArray[4]) === 1;
            this.isValid = true;
            if (dataArray.length > 5) {
                this.posePosition.x = parseFloat(dataArray[5]);
                this.posePosition.y = parseFloat(dataArray[6]);
                this.posePosition.z = parseFloat(dataArray[7]);

                this.poseOrientation.x = parseFloat(dataArray[8]);
                this.poseOrientation.y = parseFloat(dataArray[9]);
                this.poseOrientation.z = parseFloat(dataArray[10]);
                this.poseOrientation.w = parseFloat(dataArray[11]);
            }
        }
    }

    copyFrom (spatialAnchorData: XRSpatialAnchorData) {
        this.name = spatialAnchorData.name;
        this.id = spatialAnchorData.id;
        this.isSaved = spatialAnchorData.isSaved;
        this.isFromPersistArea = spatialAnchorData.isFromPersistArea;
        this.isValid = spatialAnchorData.isValid;
        this.isTracked = spatialAnchorData.isTracked;
        this.posePosition.x = spatialAnchorData.posePosition.x;
        this.posePosition.y = spatialAnchorData.posePosition.y;
        this.posePosition.z = spatialAnchorData.posePosition.z;
        this.poseOrientation.x = spatialAnchorData.poseOrientation.x;
        this.poseOrientation.y = spatialAnchorData.poseOrientation.y;
        this.poseOrientation.z = spatialAnchorData.poseOrientation.z;
        this.poseOrientation.w = spatialAnchorData.poseOrientation.w;
    }

    print (): void {
        console.log(`[XRSpatialAnchorData] name.${this.name}, id.${this.id}, saved.${this.isSaved}, persised.${this.isFromPersistArea}, 
        tracked.${this.isTracked}, position.${this.posePosition.toString()}, orientation.${this.poseOrientation.toString()}`);
    }
}

@ccclass('cc.spaces.XRSpatialAnchor')
@menu('hidden:XR/Spaces/XRSpatialAnchor')
export class XRSpatialAnchor extends Component {
    public anchorState: AnchorState = AnchorState.UNKNOWN;
    private _spatialAnchorData: XRSpatialAnchorData = new XRSpatialAnchorData();
    private _requestRemove = false;

    get isRequestRemoveSelf() {    
        return this._requestRemove;
    }

    get spatialAnchorData () {
        return this._spatialAnchorData;
    }

    onLoad () {
        this._spatialAnchorData.name = `sa_${this.uuid}`;
        this.node.name = `sa_${this.uuid}`;
        console.log(`XRSpatialAnchor onLoad.${this._spatialAnchorData.name}`);
    }

    syncSpatialAnchorData (data: XRSpatialAnchorData) {
        this._spatialAnchorData.copyFrom(data);
        this.node.name = this._spatialAnchorData.name;
        if (this._spatialAnchorData.isFromPersistArea) {
            this.anchorState = AnchorState.SAVED;
        }

        this.node.worldPosition = this._spatialAnchorData.posePosition;
        this.node.worldRotation = this._spatialAnchorData.poseOrientation;

        if (this.node.active && !this._spatialAnchorData.isTracked) {
            this.node.active = false;
        } else if (!this.node.active && this._spatialAnchorData.isTracked) {
            this.node.active = true;
        }
    }

    getCreateInfo (): string {
        // name|px|py|pz|qx|qy|qz|qw
        return `${this._spatialAnchorData.name}|${this.node.worldPosition.x}|${this.node.worldPosition.y}|${
            this.node.worldPosition.z}|${this.node.worldRotation.x}|${this.node.worldRotation.y
        }|${this.node.worldRotation.z}|${this.node.worldRotation.w}`;
    }

    remove() {
        this._requestRemove = true;
    }
}
