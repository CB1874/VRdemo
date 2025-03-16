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
import { ARActionData, ARAnchor, ARFeatureData, ARMatchData, ARTrackingState } from '../utils/ar-defines';
import { ARActionFallbackBase, ARActionUpdateBase } from '../actions/action-base';
import { ARTrackingFeature, FeatureEvent } from '../../../../xr/component/device/ar-base/ar-feature-base';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARTrackingType } from '../utils/ar-enum';
import { ARImageTracking } from '../../tracking/ar-image-tracking';
import { ARDeviceManager } from '../../../../xr/component/device/ar-device-manager';

export interface IExtraDisplay {
    showAllVisualizer(): void;
    hideAllVisualizer(): void;
}

export abstract class ARSystemBase<T extends ARAnchor> {
    public readonly onAddTrackableEvent = new FeatureEvent<ARActionData>();
    public readonly onUpdateTrackableEvent = new FeatureEvent<ARActionData>();
    public readonly onRemoveTrackableEvent = new FeatureEvent<ARActionData>();

    protected _feature: ARTrackingFeature<T> | null = null;
    public get feature () {
        return this._feature;
    }

    protected _matchings: Set<ARMatchData> = new Set<ARMatchData>();

    protected _trackings: Array<ARTrackingBase> = new Array<ARTrackingBase>();

    protected _visualizerRoot: Node | null = null;
    protected _trackingsParent: Node | undefined = undefined;
    public get trackingsParent () {
        return this._trackingsParent;
    }

    public addTracking (tracking: ARTrackingBase | undefined) {
        let bHas = false;
        for (let index = 0; index < this._trackings.length; index++) {
            const element = this._trackings[index];
            if (element.node.uuid === tracking?.node.uuid) {
                bHas = true;
                break;
            }
        }
        if (tracking && !bHas) {
            this._trackings.push(tracking);
        }
    }

    public removeTracking (tracking: ARTrackingBase | undefined) {
        for (let index = 0; index < this._trackings.length; index++) {
            const element = this._trackings[index];
            if (element.node.uuid === tracking?.node.uuid) {
                this._trackings.splice(index, 1);
                break;
            }
        }
    }

    public getTrackingCount () {
        return this._trackings.length;
    }

    public showAllVisualizer () {
        if (this._visualizerRoot) {
            this._visualizerRoot.active = true;
        }
    }

    public hideAllVisualizer () {
        if (this._visualizerRoot) {
            this._visualizerRoot.active = false;
        }
    }

    public enableFeature (enable: boolean) {
        if (this._feature) {
            this._feature.enable = enable;
        }
    }

    public updateFeature (config: ARFeatureData | null) {
        if (config && this._feature) {
            this._feature.init(config);
        } else {
            console.warn('update feature error ...');
        }
    }

    public init (rootNode: Node) {
        this._matchings.clear();
    }

    protected clearMatch (id: number) {
        const matchData: ARMatchData = this.getMatchData(id)!;
        if (matchData) {
            const trackings = this._trackings.filter((e) => {
                if (e && e.factors.length > 0) {
                    if (e.node.uuid === matchData.uuid) {
                        return true;
                    }
                }
                return false;
            });

            trackings.forEach((element) => {
                element.actions.forEach((action) => {
                    action.resetAction(matchData.data);
                });
            });
        }

        for (const element of this._matchings) {
            if (element.data.id === id) {
                this._matchings.delete(element);
                break;
            }
        }
    }

    private isMatchData (id: number) {
        for (const element of this._matchings) {
            if (element.data.id === id) {
                return true;
            }
        }
        return false;
    }

    protected getMatchData (id: number): ARMatchData | null {
        for (const element of this._matchings) {
            if (element.data.id === id) {
                return element;
            }
        }
        return null;
    }

    protected isMatchTrackingNode (uuid: string) {
        for (const element of this._matchings) {
            if (element.uuid === uuid) {
                return true;
            }
        }
        return false;
    }

    protected canFallBack (tracking: ARTrackingBase) {
        if (tracking.trackingType === ARTrackingType.Image && sys.isNative && !ARDeviceManager.isSupportedAR()) {
            const imageTracking = tracking as ARImageTracking;
            if (imageTracking.enableNativeFallBack) {
                return true;
            }
        }
        return false;
    }

    private runAction (tracking: ARTrackingBase, data: ARActionData) {
        data.trackableRootNode = this._trackingsParent;
        data.trackingNode = tracking.node;

        if (this.canFallBack(tracking)) {
            if (!(tracking as ARImageTracking).fallback) {
                return;
            }
            tracking.actions.forEach((action) => {
                if (action instanceof ARActionFallbackBase) {
                    action.runFallbackAction(data);
                }
            });
        } else {
            //order action by priority
            tracking.actions.sort((a, b) => a.priority - b.priority);
            tracking.actions.forEach((action) => {
                action.runAction(data);
            });
        }

        const matchData: ARMatchData = {
            data,
            uuid: tracking.node.uuid,
        };
        this._matchings.add(matchData);
        //console.log('匹配成功：', data.id, tracking.node.uuid);
    }

    private updateAction (tracking: ARTrackingBase, data: ARActionData) {
        if (this.canFallBack(tracking)) {
            if (!(tracking as ARImageTracking).fallback) {
                return;
            }
            tracking.actions.forEach((action) => {
                if (action instanceof ARActionFallbackBase) {
                    action.runFallbackAction(data);
                }
            });
        } else {
            //order action by priority
            tracking.actions.sort((a, b) => a.priority - b.priority);

            tracking.actions.forEach((action) => {
                if (action instanceof ARActionUpdateBase) {
                    action.updateAction(data);
                }
            });
        }
    }

    private resetAction (tracking: ARTrackingBase, data: ARActionData) {
        //order action by priority
        tracking.actions.sort((a, b) => a.priority - b.priority);

        tracking.actions.forEach((action) => {
            action.resetAction(data);
        });
    }

    public matchTracking (data: ARActionData) {
        if (this.isMatchData(data.id)) {
            return;
        }
        for (const tracking of this._trackings) {
            if (tracking && tracking.factors.length > 0) {
                if (!this.isMatchTrackingNode(tracking.node.uuid)) {
                    let flag = true;
                    tracking.factors.forEach((factor) => {
                        const curr = factor.match(data);
                        flag &&= curr;
                    });
                    if (flag) {
                        this.runAction(tracking, data);
                        return;
                    }
                }
            }
        }
    }

    public updateTracking (matchData: ARMatchData) {
        for (const tracking of this._trackings) {
            if (tracking && tracking.factors.length > 0) {
                if (tracking.node.uuid === matchData.uuid) {
                    let flag = true;
                    tracking.factors.forEach((factor) => {
                        const curr = factor.match(matchData.data);
                        flag &&= curr;
                    });

                    if (matchData.data.resetWhenLoss && matchData.data.trackingState !== ARTrackingState.TRACKING) {
                        this.resetAction(tracking, matchData.data);
                    } else if (flag) {
                        this.updateAction(tracking, matchData.data);
                    } else {
                        this.resetAction(tracking, matchData.data);
                    }
                }
            }
        }
    }
}
