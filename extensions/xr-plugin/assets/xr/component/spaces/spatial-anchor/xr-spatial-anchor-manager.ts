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

import { _decorator, Node, sys } from 'cc';
import { XRSpacesConfigKey, XRSpacesFeatureManager, XRSpacesFeatureType } from '../xr-spaces-feature-manager';
import { AnchorState, XRSpatialAnchor, XRSpatialAnchorData } from './xr-spatial-anchor';

const { ccclass, menu } = _decorator;

declare const xr: any;

type onLoadedCallback = () => void;
type onSavedCallback = (anchor: XRSpatialAnchor) => void;
type onAddedCallback = (anchor: XRSpatialAnchor) => void;

enum SpatialCmdTag {
    CREATE_NEW = 1,
    REMOVE_SAVED = 2,
    SAVE = 3,
    CLEAR_STORE = 4,
    LOAD_ALL_SAVED = 5
}

@ccclass('cc.spaces.XRSpatialAnchorManager')
@menu('hidden:XR/Spaces/XRSpatialAnchorManager')
export class XRSpatialAnchorManager extends XRSpacesFeatureManager {
    private _onLoadedCallback: onLoadedCallback | null = null;
    private _onSavedCallback: onSavedCallback | null = null;
    private _onAddedCallback: onAddedCallback | null = null;

    private _anchorsMap: Map<string, XRSpatialAnchor> = new Map<string, XRSpatialAnchor>();
    private _loadedAnchorDatasMap: Map<string, XRSpatialAnchorData> = new Map<string, XRSpatialAnchorData>();

    protected onStart (): void {
        if (sys.isXR) {
            xr.entry.setXRIntConfig(XRSpacesConfigKey.SPATIAL_ANCHOR, 1);
            console.log('[XRSpatialAnchorManager] onStart');
        }
    }

    protected onStop (): void {
        if (sys.isXR) {
            xr.entry.setXRIntConfig(XRSpacesConfigKey.SPATIAL_ANCHOR, 0);
            console.log('[XRSpatialAnchorManager] onStop');
        }
    }

    public getFeatureType (): XRSpacesFeatureType {
        return XRSpacesFeatureType.SPATIAL_ANCHOR;
    }

    public getLoadedAnchorDatas (): Array<XRSpatialAnchorData> {
        const res: Array<XRSpatialAnchorData> = [];
        for (const value of this._loadedAnchorDatasMap.values()) {
            res.push(value);
        }
        return res;
    }

    protected onRetrieveChanges (deltaTime: number): void {
        if (sys.isXR) {
            // id|name|saved&id|name|saved
            const spatialAnchorData: string = xr.entry.getXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR_DATA);
            if (spatialAnchorData.length > 0) {
                const datas: string[] = spatialAnchorData.split('&');
                if (datas.length > 0) {
                    let notifyLoadedCallback = false;
                    for (const singleAnchorData of datas) {
                        if (singleAnchorData.length > 0) {
                            let spatialAnchorData: XRSpatialAnchorData | undefined;
                            const dataArray: string[] = singleAnchorData.split('|');
                            const anchorId = parseFloat(dataArray[0]);
                            const anchorName: string = dataArray[1];

                            if (anchorId === -1) {
                                notifyLoadedCallback = true;
                                continue;
                            }

                            if (this._loadedAnchorDatasMap.has(anchorName)) {
                                spatialAnchorData = this._loadedAnchorDatasMap.get(anchorName);
                                spatialAnchorData?.praseDataArray(dataArray);
                            } else {
                                spatialAnchorData = new XRSpatialAnchorData();
                                spatialAnchorData.praseDataArray(dataArray);
                                this._loadedAnchorDatasMap.set(anchorName, spatialAnchorData);
                            }

                            if (this._anchorsMap.has(anchorName)) {
                                const anchor = this._anchorsMap.get(anchorName);
                                if (anchor && spatialAnchorData) {
                                    anchor.syncSpatialAnchorData(spatialAnchorData);
                                    if (anchor.anchorState === AnchorState.CREATING) {
                                        anchor.anchorState = AnchorState.CREATED;
                                        if (this._onAddedCallback) {
                                            this._onAddedCallback(anchor);
                                        }
                                    } else if (spatialAnchorData.isSaved && anchor.anchorState === AnchorState.SAVING) {
                                        anchor.anchorState = AnchorState.SAVED;
                                        if (this._onSavedCallback) {
                                            this._onSavedCallback(anchor);
                                        }
                                    }
                                    if(anchor.isRequestRemoveSelf) {
                                        this.removeSavedAnchor(anchor);
                                        continue;
                                    }
                                }
                            }
                        }
                    }

                    if (notifyLoadedCallback && this._onLoadedCallback) {
                        this._onLoadedCallback();
                    }
                }
            }
        }
    }

    public loadAllSavedAnchors (callback: onLoadedCallback): void {
        if (sys.isXR) {
            console.log('[XRSpatialAnchorManager] loadAllSavedAnchors');
            this._onLoadedCallback = callback;
            xr.entry.setXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR, this.generateConfigData(SpatialCmdTag.LOAD_ALL_SAVED, ''));
        }
    }

    public clearStore (): void {
        if (sys.isXR) {
            console.log('[XRSpatialAnchorManager] clearStore');
            xr.entry.setXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR, this.generateConfigData(SpatialCmdTag.CLEAR_STORE, ''));
        }
    }

    public asyncSaveAnchor (anchor: XRSpatialAnchor, callback: onSavedCallback): void {
        if (sys.isXR) {
            anchor.anchorState = AnchorState.SAVING;
            this._onSavedCallback = callback;
            xr.entry.setXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR,
                this.generateConfigData(SpatialCmdTag.SAVE, `${anchor.spatialAnchorData.id}`));
        }
    }

    public addAnchor (anchor: XRSpatialAnchor, callback: onAddedCallback): void {
        if (sys.isXR) {
            console.log(`XRSpatialAnchorManager] addAnchor:${anchor.spatialAnchorData.name}`);
            anchor.anchorState = AnchorState.CREATING;
            this._anchorsMap.set(anchor.spatialAnchorData.name, anchor);
            this._onAddedCallback = callback;
            xr.entry.setXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR, this.generateConfigData(SpatialCmdTag.CREATE_NEW, anchor.getCreateInfo()));
        }
    }

    public addAnchorNode (anchorNode: Node, anchorData: XRSpatialAnchorData): void {
        if (sys.isXR) {
            const anchor = anchorNode.getComponent(XRSpatialAnchor);
            if (anchor) {
                anchor.syncSpatialAnchorData(anchorData);
                this._anchorsMap.set(anchor.spatialAnchorData.name, anchor);
                console.log(`XRSpatialAnchorManager] addAnchorNode:${anchor.spatialAnchorData.name}`);
            }
        }
    }

    public removeSavedAnchor (anchor: XRSpatialAnchor): void {
        if (sys.isXR) {
            console.log(`XRSpatialAnchorManager] removeSavedAnchor:${anchor.spatialAnchorData.id}`);
            this._anchorsMap.delete(anchor.spatialAnchorData.name);
            this._loadedAnchorDatasMap.delete(anchor.spatialAnchorData.name);
            xr.entry.setXRStringConfig(XRSpacesConfigKey.SPATIAL_ANCHOR,
                this.generateConfigData(SpatialCmdTag.REMOVE_SAVED, `${anchor.spatialAnchorData.id}|1`));
        }
    }

    public reset (): void {
        console.log(`[XRSpatialAnchorManager] reset.${this._anchorsMap.size}`);
        this._onLoadedCallback = null;
        this._onSavedCallback = null;
        this._onAddedCallback = null;
        for (const value of this._anchorsMap.values()) {
            if (value.node) {
                value.node.destroy();
            }
        }
        this._loadedAnchorDatasMap.clear();
        this._anchorsMap.clear();
    }

    private generateConfigData (tag: SpatialCmdTag, data: string): string {
        const cmdData = `${tag}:${data}`;
        return cmdData;
    }
}
