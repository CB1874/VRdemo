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

import { _decorator, Quat, Vec2, Vec3, Size, sys } from 'cc';
import { ARPlane, ARTrackingState } from '../../../../../ar/component/framework/utils/ar-defines';
import { XRConfigKey, xrInterface } from '../../../interface/xr-interface';
import { ARHandlerPlaneDetection } from '../../ar-base/ar-handler-base';

class XRTrackedPlaneInfo {
    public vertexs: Array<Vec2> = [];
    public confidence = 0;
    public externSizeWidth: Vec2 = new Vec2();
    public externSizeHeight: Vec2 = new Vec2();

    public arPlane: ARPlane = {
        id: 0,
        // in native : 0, 1, 2
        type: 1 << 0,
        trackingState: ARTrackingState.STOPPED,
        extent: new Size(1, 1),
        pose: { position: new Vec3(), rotation: new Quat() },
    };

    cloneFrom (target: XRTrackedPlaneInfo): void {
        this.arPlane.id = target.arPlane.id;
        this.arPlane.type = target.arPlane.type;
        if (this.arPlane.extent && target.arPlane.extent) {
            this.arPlane.extent.x = target.arPlane.extent.x;
            this.arPlane.extent.y = target.arPlane.extent.y;
        }
        this.arPlane.pose.position.x = target.arPlane.pose.position.x;
        this.arPlane.pose.position.y = target.arPlane.pose.position.y;
        this.arPlane.pose.position.z = target.arPlane.pose.position.z;
        this.arPlane.pose.rotation.x = target.arPlane.pose.rotation.x;
        this.arPlane.pose.rotation.y = target.arPlane.pose.rotation.y;
        this.arPlane.pose.rotation.z = target.arPlane.pose.rotation.z;
        this.arPlane.pose.rotation.w = target.arPlane.pose.rotation.w;
        this.arPlane.trackingState = target.arPlane.trackingState;

        this.externSizeWidth.x = target.externSizeWidth.x;
        this.externSizeWidth.y = target.externSizeWidth.y;
        this.externSizeHeight.x = target.externSizeHeight.x;
        this.externSizeHeight.y = target.externSizeHeight.y;
        this.confidence = target.confidence;
        this.vertexs = [];
        for (const vertex of target.vertexs) {
            this.vertexs.push(vertex);
        }
    }
}

class XRPlanesResult {
    public planeDatas: Array<XRTrackedPlaneInfo> = new Array<XRTrackedPlaneInfo>();

    public parseData (data: string | null) {
        this.planeDatas = [];
        if (data && data.length > 0) {
            const planes: string[] = data.split('&');
            if (planes.length > 0) {
                for (const singlePlaneData of planes) {
                    if (singlePlaneData.length > 0) {
                        const planeDataInfo: string[] = singlePlaneData.split('|');

                        const xrPlaneData: XRTrackedPlaneInfo = new XRTrackedPlaneInfo();
                        xrPlaneData.vertexs = [];
                        xrPlaneData.arPlane.id = parseInt(planeDataInfo[0]);
                        xrPlaneData.confidence = parseFloat(planeDataInfo[1]);
                        xrPlaneData.arPlane.type = 1 << parseInt(planeDataInfo[2]);
                        xrPlaneData.externSizeWidth.x = parseFloat(planeDataInfo[3]);
                        xrPlaneData.externSizeWidth.y = parseFloat(planeDataInfo[4]);
                        xrPlaneData.externSizeHeight.x = parseFloat(planeDataInfo[5]);
                        xrPlaneData.externSizeHeight.y = parseFloat(planeDataInfo[6]);
                        if (xrPlaneData.arPlane.extent) {
                            xrPlaneData.arPlane.extent.x = xrPlaneData.externSizeWidth.y - xrPlaneData.externSizeWidth.x;
                            xrPlaneData.arPlane.extent.y = xrPlaneData.externSizeHeight.y - xrPlaneData.externSizeHeight.x;
                        }
                        xrPlaneData.arPlane.pose.position.x = parseFloat(planeDataInfo[7]);
                        xrPlaneData.arPlane.pose.position.y = parseFloat(planeDataInfo[8]);
                        xrPlaneData.arPlane.pose.position.z = parseFloat(planeDataInfo[9]);

                        xrPlaneData.arPlane.pose.rotation.x = parseFloat(planeDataInfo[10]);
                        xrPlaneData.arPlane.pose.rotation.y = parseFloat(planeDataInfo[11]);
                        xrPlaneData.arPlane.pose.rotation.z = parseFloat(planeDataInfo[12]);
                        xrPlaneData.arPlane.pose.rotation.w = parseFloat(planeDataInfo[13]);

                        const vertexCount: number = parseInt(planeDataInfo[14]);

                        for (let i = 0; i < vertexCount; i++) {
                            const point: Vec2 = new Vec2();
                            point.x = parseFloat(planeDataInfo[15 + i * 2]);
                            point.y = parseFloat(planeDataInfo[15 + i * 2 + 1]);
                            xrPlaneData.vertexs.push(point);
                        }
                        this.planeDatas.push(xrPlaneData);
                    }
                }
            }
        }
    }
}

export class SpacesXRHandlerPlaneDetection extends ARHandlerPlaneDetection {
    private static readonly PLANE_INFO_SIZE = 12;
    private _planeDetectionResult: XRPlanesResult = new XRPlanesResult();
    private _planesMap: Map<number, XRTrackedPlaneInfo> =
    new Map<number, XRTrackedPlaneInfo>();
    private _previousPlanesInfo: Map<number, XRTrackedPlaneInfo> = new Map();
    private _addedPlaneInfos: Array<XRTrackedPlaneInfo> = [];
    private _updatedPlaneInfos: Array<XRTrackedPlaneInfo> = [];
    private _removedPlaneInfos: Array<XRTrackedPlaneInfo> = [];

    public enablePlane (enable: boolean) {
        xrInterface.setIntConfig(XRConfigKey.PLANE_DETECTION, enable ? 1 : 0);
    }

    public setPlaneDetectionMode (mode: number) {
        console.log(`SpacesXRHandlerPlaneDetection.setPlaneDetectionMode.${mode}`);
    }

    public getPlanePolygon (planeId: number): Array<Vec2> {
        if (this._planesMap.has(planeId)) {
            return this._planesMap.get(planeId)!.vertexs;
        }
        const polygonVertices = new Array<Vec2>();
        return polygonVertices;
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }

        if (sys.isXR) {
            const planeResultData: string = xrInterface.getStringConfig(XRConfigKey.PLANE_DETECTION_DATA);
            if (planeResultData.length > 0) {
                this._addedPlaneInfos = [];
                this._removedPlaneInfos = [];
                this._updatedPlaneInfos = [];

                this._planeDetectionResult.parseData(planeResultData);
                if (this._planeDetectionResult.planeDatas.length > 0) {
                    // check xr plane
                    for (const planeData of this._planeDetectionResult.planeDatas) {
                        planeData.arPlane.trackingState = ARTrackingState.TRACKING;
                        if (this._planesMap.has(planeData.arPlane.id)) {
                            // update data
                            this._planesMap.get(planeData.arPlane.id)!.cloneFrom(planeData);
                        } else {
                            // add
                            this._planesMap.set(planeData.arPlane.id, planeData);
                            this._addedPlaneInfos.push(planeData);
                        }
                    }

                    // missing remove
                    for (const [key, value] of this._previousPlanesInfo) {
                        if (!this._planesMap.has(key)) {
                            // removed
                            value.arPlane.trackingState = ARTrackingState.STOPPED;
                            this._removedPlaneInfos.push(value);
                        } else {
                            this._updatedPlaneInfos.push(value);
                        }
                    }

                    this._previousPlanesInfo.clear();
                    for (const [key, value] of this._planesMap) {
                        this._previousPlanesInfo.set(key, value);
                    }
                }
            }

            if (this._addedPlaneInfos.length > 0) {
                const planes: ARPlane[] = [];
                for (const planeInfo of this._addedPlaneInfos) {
                    planes.push(planeInfo.arPlane);
                }
                this._feature.onAddTracking(planes);
            }

            if (this._updatedPlaneInfos.length > 0) {
                const planes: ARPlane[] = [];
                for (const planeInfo of this._updatedPlaneInfos) {
                    planes.push(planeInfo.arPlane);
                }
                this._feature.onUpdateTracking(planes);
            }

            if (this._removedPlaneInfos.length > 0) {
                const planes: ARPlane[] = [];
                for (const planeInfo of this._removedPlaneInfos) {
                    planes.push(planeInfo.arPlane);
                }
                this._feature.onRemoveTracking(planes);
            }
        }
    }
}
