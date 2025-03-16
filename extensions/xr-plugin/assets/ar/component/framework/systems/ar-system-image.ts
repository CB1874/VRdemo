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

import { _decorator, Node, instantiate, Vec3 } from 'cc';
import { ARFeatureImageTracking } from '../../../../xr/component/device/ar-base/ar-features';
import { ARImage, ARImageActionData, ARMatchData } from '../utils/ar-defines';
import { ARSystemBase } from './ar-system-base';

const { ccclass } = _decorator;

@ccclass('cc.ARSystemImageTracking')
export class ARSystemImageTracking extends ARSystemBase<ARImage> {
    private _imagesNodeMap: Map<number, Node> = new Map<number, Node>();

    constructor (feature: ARFeatureImageTracking) {
        super();
        this._feature = feature;
    }

    public init (rootNode: Node) {
        super.init(rootNode);
        this._visualizerRoot = new Node('_IMAGE_VISUALIZER_');
        rootNode.addChild(this._visualizerRoot);

        this._trackingsParent = new Node('_IMAGE_TRACKINGS_');
        rootNode.addChild(this._trackingsParent);

        if (!this._feature) {
            console.warn('image system this._feature === null');
            return;
        }

        this._feature.onRemoveEvent.on((images) => {
            if (images) {
                images.forEach((image) => {
                    const matchData: ARMatchData = this.getMatchData(image.id)!;
                    if (matchData && matchData.data.trackableNode) {
                        matchData.data.trackingState = image.trackingState;
                        this.onRemoveTrackableEvent.trigger(matchData.data as ARImageActionData);
                    } else {
                        console.warn('remove image not found match data ...');
                    }
                    this.clearMatch(image.id);
                    this.removeImageVisualizer(image);
                });
            }
        });

        this._feature.onAddEvent.on((images) => {
            if (images) {
                images.forEach((image) => {
                    const data: ARImageActionData = {
                        id: image.id,
                        pose: image.pose,
                        trackingState: image.trackingState,
                        libIndex: image.libIndex,
                        extent: image.extent,
                    };
                    this.matchTracking(data);
                    this.addImageVisualizer(data);

                    if (data.trackableNode) {
                        this.onAddTrackableEvent.trigger(data);
                    }
                });
            }
        });

        this._feature.onUpdateEvent.on((images) => {
            if (images) {
                images.forEach((image) => {
                    let data: ARImageActionData;
                    const matchData: ARMatchData = this.getMatchData(image.id)!;
                    if (matchData) {
                        data = matchData.data as ARImageActionData;
                        if (data.closeTracking) {
                            this.updateTracking(matchData);
                            if (data.trackableNode) {
                                this.onUpdateTrackableEvent.trigger(data);
                            }
                            return;
                        }
                        data.pose = image.pose;
                        data.libIndex = image.libIndex;
                        data.extent = image.extent;
                        data.trackingState = image.trackingState;
                        data.trackablePose = {
                            position: data.pose.position.clone(),
                            rotation: data.pose.rotation.clone(),
                        };
                        this.updateTracking(matchData);
                        this.updateImageVisualizer(data);

                        if (data.trackableNode) {
                            this.onUpdateTrackableEvent.trigger(data);
                        }
                    } else {
                        //console.warn('update image not found match data ...');
                    }
                });
            }
        });
    }

    protected isMatchTrackingNode (uuid: string) {
        return false;
    }

    private addImageVisualizer (data: ARImageActionData) {
        if (!data.replaceVisualizer) {
            return;
        }
        if (data.id >= 0 && !this._imagesNodeMap.has(data.id)) {
            const node = instantiate(data.replaceVisualizer);
            this._visualizerRoot?.addChild(node);
            if (data.extent) {
                node.setWorldScale(new Vec3(data.extent.x, 1, data.extent.y));
            }
            node.setPosition(data.pose.position);
            node.setRotation(data.pose.rotation);

            this._imagesNodeMap.set(data.id, node);
        }
    }

    private updateImageVisualizer (data: ARImageActionData) {
        if (!this._feature) {
            return;
        }
        if (data.id >= 0 && this._imagesNodeMap.has(data.id)) {
            const node = this._imagesNodeMap.get(data.id)!;

            if (data.extent) {
                node.setWorldScale(new Vec3(data.extent.x, 1, data.extent.y));
            }
            node.setPosition(data.pose.position);
            node.setRotation(data.pose.rotation);
        }
    }

    private removeImageVisualizer (image: ARImage) {
        if (image.id >= 0 && this._imagesNodeMap.has(image.id)) {
            const node = this._imagesNodeMap.get(image.id)!;
            node.destroy();
            this._imagesNodeMap.delete(image.id);
        }
    }
}
