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

import { _decorator, Node, instantiate, Vec3, Quat } from 'cc';
import { ARFeaturePlaneDetection } from '../../../../xr/component/device/ar-base/ar-features';
import { ARHandlerPlaneDetection } from '../../../../xr/component/device/ar-base/ar-handler-base';
import { PlaneTrackingVisualizer } from '../../visualizer/ar-plane-tracking-visualizer';
import { ARActionFallbackBase } from '../actions/action-base';
import { ARActionData, ARMatchData, ARPlane, ARPlaneActionData, PlaneDetectionConfig } from '../utils/ar-defines';
import { ARSystemBase, IExtraDisplay } from './ar-system-base';

const { ccclass } = _decorator;

@ccclass('cc.ARSystemPlaneDetection')
export class ARSystemPlaneDetection extends ARSystemBase<ARPlane> implements IExtraDisplay {
    private _planesNodeMap: Map<number, Node> = new Map<number, Node>();

    constructor (feature: ARFeaturePlaneDetection) {
        super();
        this._feature = feature;
    }

    public init (rootNode: Node) {
        super.init(rootNode);
        this._visualizerRoot = new Node('_PLANE_VISUALIZER_');
        rootNode.addChild(this._visualizerRoot);

        this._trackingsParent = new Node('_PLANE_TRACKINGS_');
        rootNode.addChild(this._trackingsParent);

        if (!this._feature) {
            console.warn('plane system this._feature === null');
            return;
        }
        const config = (this._feature.config as PlaneDetectionConfig);
        // register plane detection feature events
        this._feature.onRemoveEvent.on((planes) => {
            if (planes) {
                planes.forEach((plane) => {
                    const matchData: ARMatchData = this.getMatchData(plane.id)!;
                    if (matchData && matchData.data.trackableNode) {
                        matchData.data.trackingState = plane.trackingState;
                        this.onRemoveTrackableEvent.trigger(matchData.data as ARPlaneActionData);
                    } else {
                        console.warn('remove plane not found match data ...');
                    }
                    this.clearMatch(plane.id);
                    this.removePlaneVisualizer(plane);
                });
            }
        });

        this._feature.onAddEvent.on((planes) => {
            if (planes) {
                planes.forEach((plane) => {
                    const data: ARPlaneActionData = {
                        id: plane.id,
                        type: plane.type,
                        extent: plane.extent,
                        pose: plane.pose,
                        trackingState: plane.trackingState,
                        replaceVisualizer: config.planePrefab,
                    };
                    this.matchTracking(data);
                    this.addPlaneVisualizer(data);

                    if (data.trackableNode) {
                        this.onAddTrackableEvent.trigger(data);
                    }
                });
            }
        });

        this._feature.onUpdateEvent.on((planes) => {
            if (planes) {
                planes.forEach((plane) => {
                    let data: ARPlaneActionData;
                    const matchData: ARMatchData = this.getMatchData(plane.id)!;
                    if (matchData) {
                        data = matchData.data as ARPlaneActionData;
                        if (data.closeTracking) {
                            this.updateTracking(matchData);
                            if (data.trackableNode) {
                                this.onUpdateTrackableEvent.trigger(data);
                            }
                            return;
                        }
                        data.pose = plane.pose;
                        data.type = plane.type;
                        data.extent = plane.extent;
                        data.trackingState = plane.trackingState;
                        data.trackablePose = {
                            position: data.pose.position.clone(),
                            rotation: data.pose.rotation.clone(),
                        };
                        this.updateTracking(matchData);
                        this.updatePlaneVisualizer(data);
                        if (data.trackableNode) {
                            this.onUpdateTrackableEvent.trigger(data);
                        }
                    } else {
                        data = {
                            id: plane.id,
                            type: plane.type,
                            extent: plane.extent,
                            pose: plane.pose,
                            trackingState: plane.trackingState,
                        };
                        this.matchTracking(data);
                        this.updatePlaneVisualizer(data);
                        if (data.trackableNode) {
                            this.onAddTrackableEvent.trigger(data);
                        }
                    }
                });
            }
        });
    }

    public runFallbackAction () {
        const fallbackData: ARActionData = {
            id: 0,
            pose: { position: new Vec3(0, 0, 0), rotation: new Quat(0, 0, 0, 1) },
            trackableRootNode: this._trackingsParent,
        };

        for (const tracking of this._trackings) {
            fallbackData.trackingNode = tracking.node;
            tracking.actions.forEach((action) => {
                if (action instanceof ARActionFallbackBase) {
                    action.runFallbackAction(fallbackData);
                }
            });
        }
    }

    private _setVisualizerData (config: PlaneDetectionConfig, node: Node, data: ARPlaneActionData) {
        if (!this._feature) {
            return;
        }

        if (!config.usePlaneShape && data.extent) {
            node.setWorldScale(new Vec3(data.extent.x, 1, data.extent.y));
        }
        node.setPosition(data.pose.position);
        node.setRotation(data.pose.rotation);

        let planeVisualizer = node.getComponent(PlaneTrackingVisualizer);
        if (!planeVisualizer) {
            planeVisualizer = node.addComponent(PlaneTrackingVisualizer);
        }
        planeVisualizer.trackingPlaneId = data.id;
        planeVisualizer.usePlaneShape = config.usePlaneShape;
        planeVisualizer.trackingQualityCondition = config.trackingQualityCondition;
        planeVisualizer.polygon = (this._feature.getHandler() as ARHandlerPlaneDetection).getPlanePolygon(data.id);
    }

    private addPlaneVisualizer (data: ARPlaneActionData) {
        if (!this._feature) {
            return;
        }
        const config = (this._feature.config as PlaneDetectionConfig);
        if (!data.replaceVisualizer) {
            data.replaceVisualizer = config.planePrefab;
        }
        if (!data.replaceVisualizer) {
            return;
        }
        if (data.id >= 0 && !this._planesNodeMap.has(data.id)) {
            const node = instantiate(data.replaceVisualizer);
            data.replaceVisualizer = null;
            this._visualizerRoot?.addChild(node);
            this._setVisualizerData(config, node, data);
            this._planesNodeMap.set(data.id, node);
        }
    }

    private updatePlaneVisualizer (data: ARPlaneActionData) {
        if (!this._feature) {
            return;
        }
        if (data.id >= 0 && this._planesNodeMap.has(data.id)) {
            let node = this._planesNodeMap.get(data.id)!;
            if (data.replaceVisualizer) {
                node.parent = null;
                node.destroy();
                node = instantiate(data.replaceVisualizer);
                this._visualizerRoot?.addChild(node);
                this._planesNodeMap.set(data.id, node);
                data.replaceVisualizer = null;
            }

            const config = (this._feature.config as PlaneDetectionConfig);
            this._setVisualizerData(config, node, data);
        }
    }
    private removePlaneVisualizer (plane: ARPlane) {
        if (plane.id >= 0 && this._planesNodeMap.has(plane.id)) {
            const node = this._planesNodeMap.get(plane.id)!;
            node.destroy();
            this._planesNodeMap.delete(plane.id);
        }
    }
}
