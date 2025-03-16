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

import { _decorator, Quat, Size, sys, Vec3 } from 'cc';
import { ARImage, ARTrackingState, ARLibImageData } from '../../../../../ar/component/framework/utils/ar-defines';

import { XRConfigKey, xrInterface } from '../../../interface/xr-interface';
import { ARHandlerImageTracking } from '../../ar-base/ar-handler-base';

class XRTrackedImageInfo {
    public id = 0;
    public name = '';
    private static _internalId = 0;
    public arImage: ARImage = {
        id: 0,
        libIndex: 0,
        trackingState: ARTrackingState.STOPPED,
        extent: new Size(1, 1),
        pose: { position: new Vec3(), rotation: new Quat() },
    };

    constructor () {
        XRTrackedImageInfo._internalId++;
    }

    parseData (data: string | null) {
        this.arImage.trackingState = ARTrackingState.STOPPED;
        if (data) {
            this.id = XRTrackedImageInfo._internalId;

            const trackedInfo: string[] = data.split('|');
            this.name = trackedInfo[0];

            this.arImage.id = parseInt(this.name.split('_')[1]);
            this.arImage.libIndex = 0;
            this.arImage.trackingState = ARTrackingState.TRACKING;
            this.arImage.pose.position.x = parseFloat(trackedInfo[1]);
            this.arImage.pose.position.y = parseFloat(trackedInfo[2]);
            this.arImage.pose.position.z = parseFloat(trackedInfo[3]);
            this.arImage.pose.rotation.x = parseFloat(trackedInfo[4]);
            this.arImage.pose.rotation.y = parseFloat(trackedInfo[5]);
            this.arImage.pose.rotation.z = parseFloat(trackedInfo[6]);
            this.arImage.pose.rotation.w = parseFloat(trackedInfo[7]);
            if (this.arImage.extent) {
                this.arImage.extent.x = 1;
                this.arImage.extent.y = 1;
            }
        }
    }

    cloneFrom (target: XRTrackedImageInfo): void {
        this.id = target.id;
        this.name = target.name;
        this.arImage.libIndex = target.arImage.libIndex;
        this.arImage.trackingState = target.arImage.trackingState;
        if (this.arImage.extent && target.arImage.extent) {
            this.arImage.extent.x = target.arImage.extent.x;
            this.arImage.extent.y = target.arImage.extent.y;
        }
        this.arImage.pose.position.x = target.arImage.pose.position.x;
        this.arImage.pose.position.y = target.arImage.pose.position.y;
        this.arImage.pose.position.z = target.arImage.pose.position.z;
        this.arImage.pose.rotation.x = target.arImage.pose.rotation.x;
        this.arImage.pose.rotation.y = target.arImage.pose.rotation.y;
        this.arImage.pose.rotation.z = target.arImage.pose.rotation.z;
        this.arImage.pose.rotation.w = target.arImage.pose.rotation.w;
    }
}

class XRReferenceImageAsset {
    public name: string;
    public assetPath: string;
    public widthInMeters: number;
    public heightInMeters: number;

    constructor (name: string, path: string, w: number, h: number) {
        this.name = name;
        this.assetPath = path;
        this.widthInMeters = w;
        this.heightInMeters = h;
    }
}

export class SpacesXRHandlerImageTracking extends ARHandlerImageTracking {
    private static readonly IMAGE_INFO_SIZE = 12;
    private _referenceImageAssets: Map<string, XRReferenceImageAsset> = new Map<string, XRReferenceImageAsset>();
    private _trackingImageInfo: Map<string, XRTrackedImageInfo> = new Map();
    private _previousTrackingImageInfo: Map<string, XRTrackedImageInfo> = new Map();
    private _addedImageInfos: Array<XRTrackedImageInfo> = [];
    private _updatedImageInfos: Array<XRTrackedImageInfo> = [];
    private _removedImageInfos: Array<XRTrackedImageInfo> = [];
    private _imageNameLibIndex: Map<string, number> = new Map();

    public enableImageTracking (enable: boolean) {
        xrInterface.setIntConfig(XRConfigKey.IMAGE_TRACKING, enable ? 1 : 0);
    }

    public addImagesToLib (images: ARLibImageData[]) {
        if (images && images.length > 0) {
            let imageId = 100;
            let libIndex = 0;
            for (const imageData of images) {
                const name = `ImageName_${imageId}`;
                imageId++;
                if (this._referenceImageAssets.has(name)) {
                    continue;
                }
                // eslint-disable-next-line max-len
                console.log(`SpacesXRHandlerImageTracking.addImagesToLib.${name},${imageData.widthInMeters}x${imageData.heightInMeters},${imageData.assetPath}`);
                const asset = `${name}|@assets/${imageData.assetPath}|${imageData.widthInMeters}|${imageData.heightInMeters}`;
                xrInterface.setStringConfig(XRConfigKey.IMAGE_TRACKING_CANDIDATEIMAGE, asset);
                // eslint-disable-next-line max-len
                this._referenceImageAssets.set(name, new XRReferenceImageAsset(name, imageData.assetPath, imageData.widthInMeters, imageData.heightInMeters));
                this._imageNameLibIndex.set(name, libIndex);
                libIndex++;
            }
        }
    }

    public setImageMaxTrackingNumber (count: number) {
        console.log(`SpacesXRHandlerImageTracking::setImageMaxTrackingNumber:${count}`);
    }

    public update (): void {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }

        if (sys.isXR) {
            const trackedImageData: string = xrInterface.getStringConfig(XRConfigKey.IMAGE_TRACKING_DATA);
            // "name1|1|2|3|4|5|6&name|1|2|3|4|5|6"
            this._addedImageInfos = [];
            this._updatedImageInfos = [];
            this._removedImageInfos = [];
            this._trackingImageInfo.clear();

            let dataArray: Array<string> = [];
            if (trackedImageData.length > 0) {
                dataArray = trackedImageData.split('&');
            }

            for (const data of dataArray) {
                if (data.length > 0) {
                    const trackedImageInfo: XRTrackedImageInfo = new XRTrackedImageInfo();
                    trackedImageInfo.parseData(data);
                    const imageInfo = this._referenceImageAssets.get(trackedImageInfo.name);
                    if (trackedImageInfo.arImage.extent && imageInfo) {
                        trackedImageInfo.arImage.extent.x = imageInfo.widthInMeters;
                        trackedImageInfo.arImage.extent.y = imageInfo.heightInMeters;
                    }
                    trackedImageInfo.arImage.trackingState = ARTrackingState.TRACKING;
                    const libIndex =  this._imageNameLibIndex.get(trackedImageInfo.name);
                    trackedImageInfo.arImage.libIndex = libIndex || 0;
                    this._trackingImageInfo.set(trackedImageInfo.name, trackedImageInfo);
                }
            }

            // missing remove
            for (const [key, value] of this._previousTrackingImageInfo) {
                if (!this._trackingImageInfo.has(key)) {
                    // removed
                    value.arImage.trackingState = ARTrackingState.STOPPED;
                    this._removedImageInfos.push(value);
                }
            }

            // add && update
            for (const [key, value] of this._trackingImageInfo) {
                if (this._previousTrackingImageInfo.has(key)) {
                    // updated
                    value.arImage.trackingState = ARTrackingState.TRACKING;
                    this._updatedImageInfos.push(value);
                } else {
                    // added
                    value.arImage.trackingState = ARTrackingState.TRACKING;
                    this._addedImageInfos.push(value);
                }
            }
            this._previousTrackingImageInfo.clear();
            for (const [key, value] of this._trackingImageInfo) {
                this._previousTrackingImageInfo.set(key, value);
            }

            // notify event
            if (this._addedImageInfos.length > 0) {
                const images: ARImage[] = [];
                for (const value of this._addedImageInfos) {
                    images.push(value.arImage);
                }
                this._feature.onAddTracking(images);
            }

            if (this._updatedImageInfos.length > 0) {
                const images: ARImage[] = [];
                for (const value of this._updatedImageInfos) {
                    images.push(value.arImage);
                }
                this._feature.onUpdateTracking(images);
            }

            if (this._removedImageInfos.length > 0) {
                const images: ARImage[] = [];
                for (const value of this._removedImageInfos) {
                    images.push(value.arImage);
                }
                this._feature.onRemoveTracking(images);
            }
        }
    }
}
