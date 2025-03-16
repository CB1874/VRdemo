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

import { _decorator, Component, Node, sys, Vec3, Quat, EventTarget, Event } from 'cc';
import { XRSpacesConfigKey, XRSpacesFeatureManager, XRSpacesFeatureType } from '../xr-spaces-feature-manager';

const { ccclass, menu } = _decorator;

export class XRTrackedImageInfo {
    public name = '';
    public position: Vec3 = new Vec3();
    public quaternion: Quat = new Quat();

    constructor (data: string) {
        const trackedInfo: string[] = data.split('|');
        this.name = trackedInfo[0];
        this.position.x = parseFloat(trackedInfo[1]);
        this.position.y = parseFloat(trackedInfo[2]);
        this.position.z = parseFloat(trackedInfo[3]);
        this.quaternion.x = parseFloat(trackedInfo[4]);
        this.quaternion.y = parseFloat(trackedInfo[5]);
        this.quaternion.z = parseFloat(trackedInfo[6]);
        this.quaternion.w = parseFloat(trackedInfo[7]);
    }
}

export class EventTrackedImage extends Event {
    public added: Array<XRTrackedImageInfo> = [];
    public updated: Array<XRTrackedImageInfo> = [];
    public removed: Array<XRTrackedImageInfo> = [];

    constructor (type: string) {
        super(type, false);
    }

    reset (): void {
        this.added = [];
        this.updated = [];
        this.removed = [];
    }
}
type TrackedImageCallback = (res: EventTrackedImage) => void;

export enum TrackedImageEventType {
    DEFAULT = 'xr-tracked-image',
    ADDED = 'xr-tracked-image-added',
    REMOVED = 'xr-tracked-image-removed',
    UPDATED = 'xr-tracked-image-updated'
}

declare const xr: any;

@ccclass('cc.spaces.XRTrackedImageManager')
@menu('hidden:XR/Spaces/XRTrackedImageManager')
export class XRTrackedImageManager extends XRSpacesFeatureManager {
    private _trackedImageObjects: Map<string, Node> = new Map<string, Node>();
    private _referenceImageAssets: Array<string> = new Array<string>();

    private _trackingImageInfo: Map<string, XRTrackedImageInfo> = new Map();
    private _previousTrackingImageInfo: Map<string, XRTrackedImageInfo> = new Map();

    private _eventTarget: EventTrackedImage = new EventTrackedImage(TrackedImageEventType.DEFAULT);
    private static _trackedEventTarget: EventTarget = new EventTarget();

    private _isSuppored = false;

    registerReferenceImageAsset (imageAssetData: string, imageName: string, trackedObject: Node): void {
        this._referenceImageAssets.push(imageAssetData);
        this._trackedImageObjects.set(imageName, trackedObject);
    }

    static onTrackedImagesChanged (callback: TrackedImageCallback, target?: any) {
        XRTrackedImageManager._trackedEventTarget.on(TrackedImageEventType.DEFAULT, callback, target);
    }

    static offTrackedImagesChanged (callback: TrackedImageCallback, target?: any) {
        XRTrackedImageManager._trackedEventTarget.off(TrackedImageEventType.DEFAULT, callback, target);
    }

    protected onStart (): void {
        if (sys.isXR) {
            this._isSuppored = xr.entry.getXRBoolConfig(XRSpacesConfigKey.IMAGE_TRACKING_SUPPORT_STATUS);
            console.log(`[XRTrackedImageManager] onStart.spt.${this._isSuppored} | ${this._referenceImageAssets.length}`);

            if (this._referenceImageAssets.length > 0) {
                xr.entry.setXRIntConfig(XRSpacesConfigKey.IMAGE_TRACKING, 1);
                for (const asset of this._referenceImageAssets) {
                    xr.entry.setXRStringConfig(XRSpacesConfigKey.IMAGE_TRACKING_CANDIDATEIMAGE, asset);
                }
            }
        }
    }

    protected onStop (): void {
        if (this._isSuppored) {
            xr.entry.setXRIntConfig(XRSpacesConfigKey.IMAGE_TRACKING, 0);
            console.log('[XRTrackedImageManager] onStop');
        }
    }

    public getFeatureType (): XRSpacesFeatureType {
        return XRSpacesFeatureType.IMAGE_TRACKING;
    }

    protected onRetrieveChanges (deltaTime: number): void {
        if (sys.isXR) {
            if (this._isSuppored) {
                this._trackingImageInfo.clear();
                const trackedImageData: string = xr.entry.getXRStringConfig(XRSpacesConfigKey.IMAGE_TRACKING_DATA);
                // "name1|1|2|3|4|5|6&name|1|2|3|4|5|6"
                if (trackedImageData.length > 0) {
                    const dataArray: Array<string> = trackedImageData.split('&');
                    for (const data of dataArray) {
                        const trackedImageInfo: XRTrackedImageInfo = new XRTrackedImageInfo(data);
                        this._trackingImageInfo.set(trackedImageInfo.name, trackedImageInfo);
                    }

                    // reset
                    this._eventTarget.reset();
                    // missing remove
                    for (const [key, value] of this._previousTrackingImageInfo) {
                        if (!this._trackingImageInfo.has(key)) {
                            this._eventTarget.removed.push(value);
                        }
                    }

                    // add && update
                    for (const [key, value] of this._trackingImageInfo) {
                        if (this._previousTrackingImageInfo.has(key)) {
                            this._eventTarget.updated.push(value);
                        } else {
                            this._eventTarget.added.push(value);
                        }
                    }
                    this._previousTrackingImageInfo.clear();
                    for (const [key, value] of this._trackingImageInfo) {
                        this._previousTrackingImageInfo.set(key, value);
                    }
                    // emit
                    XRTrackedImageManager._trackedEventTarget.emit(TrackedImageEventType.DEFAULT, this._eventTarget);
                }
            }
        }
    }
}
