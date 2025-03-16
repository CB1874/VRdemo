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

import { Quat, Vec2, Vec3, _decorator } from 'cc';

const { ccclass } = _decorator;

export enum XrPlaneTypeQCOM {
    XR_PLANE_TYPE_HORIZONTAL_UPWARD_QCOM = 0,
    XR_PLANE_TYPE_HORIZONTAL_DOWNWARD_QCOM = 1,
    XR_PLANE_TYPE_VERTICAL_QCOM = 2,
    XR_PLANE_TYPE_ARBITRARY_QCOM = 3,
    XR_PLANE_TYPE_MAX_ENUM_QCOM = 0x7FFFFFFF
}

export class XRPlaneData {
    public id = 0;
    public planeType: XrPlaneTypeQCOM = XrPlaneTypeQCOM.XR_PLANE_TYPE_MAX_ENUM_QCOM;
    public confidence = 0;
    public externSizeWidth: Vec2 = new Vec2();
    public externSizeHeight: Vec2 = new Vec2();
    public vertexs: Array<Vec3> = [];
    public posePosition: Vec3 = new Vec3();
    public poseOrientation: Quat = new Quat();
    public width = 0;
    public height = 0;
    public isValid = false;
}

export class XRPlanesResult {
    public planeDatas: Array<XRPlaneData> = new Array<XRPlaneData>();

    public parseData (data: string | null) {
        this.planeDatas = [];
        if (data && data.length > 0) {
            const planes: string[] = data.split('&');
            if (planes.length > 0) {
                for (const singlePlaneData of planes) {
                    if (singlePlaneData.length > 0) {
                        const planeDataInfo: string[] = singlePlaneData.split('|');

                        const xrPlaneData: XRPlaneData = new XRPlaneData();
                        xrPlaneData.vertexs = [];
                        xrPlaneData.id = parseInt(planeDataInfo[0]);
                        xrPlaneData.confidence = parseFloat(planeDataInfo[1]);
                        xrPlaneData.planeType = parseInt(planeDataInfo[2]) as XrPlaneTypeQCOM;
                        xrPlaneData.externSizeWidth.x = parseFloat(planeDataInfo[3]);
                        xrPlaneData.externSizeWidth.y = parseFloat(planeDataInfo[4]);
                        xrPlaneData.width = xrPlaneData.externSizeWidth.y - xrPlaneData.externSizeWidth.x;

                        xrPlaneData.externSizeHeight.x = parseFloat(planeDataInfo[5]);
                        xrPlaneData.externSizeHeight.y = parseFloat(planeDataInfo[6]);
                        xrPlaneData.height = xrPlaneData.externSizeHeight.y - xrPlaneData.externSizeHeight.x;

                        xrPlaneData.posePosition.x = parseFloat(planeDataInfo[7]);
                        xrPlaneData.posePosition.y = parseFloat(planeDataInfo[8]);
                        xrPlaneData.posePosition.z = parseFloat(planeDataInfo[9]);

                        xrPlaneData.poseOrientation.x = parseFloat(planeDataInfo[10]);
                        xrPlaneData.poseOrientation.y = parseFloat(planeDataInfo[11]);
                        xrPlaneData.poseOrientation.z = parseFloat(planeDataInfo[12]);
                        xrPlaneData.poseOrientation.w = parseFloat(planeDataInfo[13]);

                        const vertexCount: number = parseInt(planeDataInfo[14]);

                        for (let i = 0; i < vertexCount; i++) {
                            const point: Vec3 = new Vec3();
                            point.x = parseFloat(planeDataInfo[15 + i * 2]);
                            point.y = 0;//xrPlaneData.posePosition.y;
                            point.z = parseFloat(planeDataInfo[15 + i * 2 + 1]);
                            xrPlaneData.vertexs.push(point);
                        }
                        xrPlaneData.isValid = true;
                        this.planeDatas.push(xrPlaneData);
                    }
                }
            }
        }
    }
}
