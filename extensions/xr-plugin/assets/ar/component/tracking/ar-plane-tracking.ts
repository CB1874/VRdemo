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

import { _decorator, Node, CCObject, Vec3, assetManager, instantiate, Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { ARActionUpdateBase, ARActionBase } from '../framework/actions/action-base';
import { ARAdaptiveScale } from '../framework/actions/adaptive-scale';
import { ARAlignment } from '../framework/actions/alignment';
import { ARDisplayChildren } from '../framework/actions/display-children';
import { ARSurfaceOverlay } from '../framework/actions/surface-overlay';
import { ARTrackEvent } from '../framework/actions/track-event';
import { ARPlaneDetectionMode, ARActionData, PlaneFeatureEventParam, PlaneDetectionConfig } from '../framework/utils/ar-defines';
import { ARPlaneDirection } from '../framework/factors/plane-direction';
import { ARPlaneSemantic } from '../framework/factors/plane-semantic';
import { ARPlaneSize } from '../framework/factors/plane-size';
import { ActionType, ARPropType, FactorType, ARTrackingType } from '../framework/utils/ar-enum';
import { arEvent } from '../framework/utils/ar-event';
import { ARTrackingBase } from './ar-tracking-base';
import { PlaneTrackingVisualizer } from '../visualizer/ar-plane-tracking-visualizer';
import { ARSession } from '../ar-session';
import { ARFallback } from '../framework/actions/fall-back';

const { ccclass, property, help, menu, executeInEditMode } = _decorator;

/**
 * @en
 * AR plane tracking feature components
 * @zh
 * AR平面追踪特性组件
 */
@ccclass('cc.ARPlaneTracking')
@help('i18n:cc.ARPlaneTracking')
@menu('XR/AR Tracking/ARPlaneTracking')
@executeInEditMode
export class ARPlaneTracking extends ARTrackingBase {
    @property({ serializable: true })
    protected _enableFallBack = true;

    @property({ serializable: true})
    protected _planeDirection: ARPlaneDirection | null = null;

    @property({ serializable: true})
    protected _planeSize: ARPlaneSize | null = null;

    @property({ serializable: true})
    protected _planeSemantic: ARPlaneSemantic | null = null;

    @property({ serializable: true})
    protected _display: ARActionBase<ARActionData> | null = null;

    @property({ serializable: true})
    protected _surfaceOverlay: ARActionBase<ARActionData> | null = null;

    @property({ serializable: true})
    protected _alignment: ARActionUpdateBase | null = null;

    @property({ serializable: true})
    protected _adaptiveScale: ARActionUpdateBase | null = null;

    @property({ serializable: true})
    protected _fallback: ARActionBase<ARActionData> | null = null;

    private _scenePlane: Node | null = null;

    @property({
        type: ARTrackingType,
        displayOrder: 1,
        readonly: true,
        override: true,
        tooltip: 'i18n:xr-plugin.tracking.trackingType',
        })
    set trackingType (val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
    }
    get trackingType () {
        return this._trackingType;
    }

    @property({
        displayOrder: 1,
        displayName: "Enable auto fallback",
        tooltip: 'i18n:xr-plugin.tracking.enableFallBack',
        })
    set enableFallBack (val) {
        if (val === this._enableFallBack) {
            return;
        }
        this._enableFallBack = val;
        this.updateFeature(true);
    }
    get enableFallBack () {
        return this._enableFallBack;
    }

    @property({
        displayName: "Plane Direction",
        group: { name: 'Factor', displayOrder: 1},
        visible: (function (this: ARPlaneTracking) {
            return this.planeDirection !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.planeDirection',
        })
    set planeDirection (val) {
        if (val === this._planeDirection) {
            return;
        }
        this._planeDirection = val;
        this.updateScenePlane();
    }
    get planeDirection () {
        return this._planeDirection;
    }

    @property({
        displayName: "Plane Size",
        group: { name: 'Factor', displayOrder: 1},
        visible: (function (this: ARPlaneTracking) {
            return this.planeSize !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.planeSize',
        })
    set planeSize (val) {
        if (val === this._planeSize) {
            return;
        }
        this._planeSize = val;
        this.updateScenePlane();
    }
    get planeSize () {
        return this._planeSize;
    }

    @property({
        displayName: "Plane Semantic",
        group: { name: 'Factor', displayOrder: 1},
        visible: (function (this: ARPlaneTracking) {
            return this.planeSemantic !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.planeSemantic',
        })
    set planeSemantic (val) {
        if (val === this._planeSemantic) {
            return;
        }
        this._planeSemantic = val;
    }
    get planeSemantic () {
        return this._planeSemantic;
    }

    @property({
        displayName: "Display",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.displayChildren !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.display',
        })
    set displayChildren (val) {
        if (val) {
            const display = val as ARDisplayChildren;
            if (this._alignment) {
                this._alignment.closeTracking = display.stopTracking;
            }
            if (this._adaptiveScale) {
                this._adaptiveScale.closeTracking = display.stopTracking;
            }
        }
        if (val === this._display) {
            return;
        }
        this._display = val;
    }
    get displayChildren () {
        return this._display;
    }

    @property({
        displayName: "Align",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.align !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.alignment',
        })
    set align (val) {
        if (val === this._alignment) {
            return;
        }
        this._alignment = val;
        if (this._alignment && this._display) {
            this._alignment.closeTracking = (this._display as ARDisplayChildren).stopTracking;
        }
    }
    get align () {
        return this._alignment;
    }

    @property({
        displayName: "Adaptive Scale",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.adaptiveScale !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.adaptiveScale',
        })
    set adaptiveScale (val) {
        if (val === this._adaptiveScale) {
            return;
        }
        this._adaptiveScale = val;
        if (this._adaptiveScale && this._display) {
            this._adaptiveScale.closeTracking = (this._display as ARDisplayChildren).stopTracking;
        }
    }
    get adaptiveScale () {
        return this._adaptiveScale;
    }

    @property({
        displayName: "Surface Overlay",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.surfaceOverlay !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.surfaceOverlay',
        })
    set surfaceOverlay (val) {
        if (val === this._surfaceOverlay) {
            return;
        }
        this._surfaceOverlay = val;
    }
    get surfaceOverlay () {
        return this._surfaceOverlay;
    }

    @property({
        displayName: "Track Event",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.trackEvent !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.trackEvent',
        })
    set trackEvent (val) {
        if (val === this._trackEvent) {
            return;
        }
        this._trackEvent = val;
    }
    get trackEvent () {
        return this._trackEvent;
    }

    @property({
        displayName: "Fallback",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARPlaneTracking) {
            return this.fallback !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.fallback',
        })
    set fallback (val) {
        if (val === this._fallback) {
            return;
        }
        this._fallback = val;
    }
    get fallback () {
        return this._fallback;
    }

    onLoad () {
        if (EDITOR) {
            this.addMenuFactor(FactorType.PLANE_DIRECTION);
            this.addMenuFactor(FactorType.PLANE_SIZE);
            this.addMenuFactor(FactorType.PLANE_SEMANTIC);

            this.addMenuAction(ActionType.DISPLAY_CHILDREN);
            this.addMenuAction(ActionType.TRACK_EVENT);
            this.addMenuAction(ActionType.SURFACE_OVERLAY);
            this.addMenuAction(ActionType.ALIGNMENT);
            this.addMenuAction(ActionType.ADAPTIVE_SCALE);
            this.addMenuAction(ActionType.FALLBACK);

            if (!this.initialized) {
                this.initialized = true;
                this.trackingType = ARTrackingType.Plane;
                if (!this.planeDirection) {
                    this.planeDirection = new ARPlaneDirection(this.node.uuid);
                }
                if (!this.planeSize) {
                    this.planeSize = new ARPlaneSize(this.node.uuid);
                }
                if (!this.displayChildren) {
                    this.displayChildren = new ARDisplayChildren();
                }
                if (!this.align) {
                    this.align = new ARAlignment();
                }

                this.addFactor(this.planeDirection);
                this.addFactor(this.planeSize);
                this.addAction(this.displayChildren);
                this.addAction(this.align);
            }
        }

        if (this.planeDirection) {
            this.planeDirection.uuid = this.node.uuid;
        }
        if (this.planeSize) {
            this.planeSize.uuid = this.node.uuid;
        }
        if (this.planeSemantic) {
            this.planeSemantic.uuid = this.node.uuid;
        }
        this.createScenePlane();
    }

    onDestroy () {
        super.onDestroy();
        this.removeScenePlane();
    }

    /**
    * @engineInternal
    */
    private _emitChangeNode (node: Node) {
        if (EDITOR) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            EditorExtends.Node.emit('change', node.uuid, node);
        }
    }

    public removeScenePlane () {
        this._scenePlane = this.node.getChildByName('__scene_plane__');
        if (this._scenePlane && this._scenePlane.isValid) {
            this._scenePlane.parent = null;
            this._scenePlane.destroy();
            this._scenePlane = null;
        }
    }

    public createScenePlane (prefab?: Prefab) {
        this.removeScenePlane();
        if (EDITOR) {
            const cfg = ARSession.getSession()?.manager?.getFeatureConfig(ARTrackingType.Plane) as PlaneDetectionConfig;
            if (cfg && cfg.enable) {
                prefab = cfg.planePrefab!;
            }
            if (this.surfaceOverlay) {
                const replace = (this.surfaceOverlay as ARSurfaceOverlay).replaceVisualizer;
                if (replace) {
                    prefab = replace;
                }
            }
            if (prefab) {
                this.createScenePlaneByPrefab(prefab);
            } else {
                assetManager.loadAny({ uuid: 'fcd70a72-6a5a-471f-b889-4ae2d7876e0e' }, (err, assets) => {
                    this.createScenePlaneByPrefab(assets as Prefab);
                });
            }
        }
    }

    private createScenePlaneByPrefab (prefab: Prefab) {
        this._scenePlane = instantiate(prefab);
        this._scenePlane.name = '__scene_plane__';
        this.node.addChild(this._scenePlane);
        this._scenePlane._objFlags |= CCObject.Flags.HideInHierarchy;
        this._scenePlane._objFlags |= CCObject.Flags.DontSave;
        this._scenePlane.addComponent(PlaneTrackingVisualizer);

        this.updateScenePlane();
    }

    private updateScenePlane () {
        if (this._scenePlane) {
            let visualizer = this._scenePlane.getComponent(PlaneTrackingVisualizer);
            if (!visualizer) {
                visualizer = this._scenePlane.addComponent(PlaneTrackingVisualizer);
            }
            if (this._planeSize) {
                visualizer.drawSceneEffect(false);

                const planeSizeEffect = () => {
                    if (this._planeSize) {
                        this._scenePlane?.setScale(this._planeSize.PlaneSize[0] / 1, 1, this._planeSize.PlaneSize[1] / 1);
                    }
                };
                this._planeSize.removeListener();
                this._planeSize.addListener((event: any) => {
                    this._emitChangeNode(this.node);
                    planeSizeEffect();
                });
                planeSizeEffect();
            } else {
                this._scenePlane.setScale(1, 1, 1);
                visualizer.drawSceneEffect(true);
            }

            if (this._planeDirection) {
                const planeDirectionEffect = () => {
                    if (this._scenePlane && this._planeDirection) {
                        this._scenePlane.position = new Vec3(0, 0, 0);
                        if (this._planeDirection.directionType === ARPlaneDetectionMode.Horizontal_Downward) {
                            this._scenePlane.eulerAngles = new Vec3(180, 0, 0);
                        } else if (this._planeDirection.directionType === ARPlaneDetectionMode.Vertical) {
                            this._scenePlane.eulerAngles = new Vec3(90, 0, 0);
                        } else {
                            this._scenePlane.eulerAngles = new Vec3(0, 0, 0);
                        }
                    }
                };
                this._planeDirection.removeListener();
                this._planeDirection.addListener((event: any) => {
                    planeDirectionEffect();
                    this.updateFeature(true);
                });
                planeDirectionEffect();
            }
        }
    }

    public updateFeature (canUse: boolean) {
        const param: PlaneFeatureEventParam = {
            ft: ARTrackingType.Plane,
            uuid: this.node.uuid,
            canUse,
            tracking: this,
            direction: this.planeDirection ? this.planeDirection.directionType : ARPlaneDetectionMode.All,
            enableNativeFallBack: this.enableFallBack,
            enableWebFallBack: this.enableFallBack,
        };
        arEvent.collectFeature(param);
    }

    public addProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.PLANE_DIRECTION:
                this.planeDirection = new ARPlaneDirection(this.node.uuid);
                this.addFactor(this.planeDirection);
                break;
            case FactorType.PLANE_SIZE:
                this.planeSize = new ARPlaneSize(this.node.uuid);
                this.addFactor(this.planeSize);
                break;
            case FactorType.PLANE_SEMANTIC:
                this.planeSemantic = new ARPlaneSemantic(this.node.uuid);
                this.addFactor(this.planeSemantic);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.DISPLAY_CHILDREN:
                this.displayChildren = new ARDisplayChildren();
                this.addAction(this.displayChildren);
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent = new ARTrackEvent();
                this.addAction(this.trackEvent);
                break;
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay = new ARSurfaceOverlay();
                this.addAction(this.surfaceOverlay);
                break;
            case ActionType.ALIGNMENT:
                this.align = new ARAlignment();
                this.addAction(this.align);
                break;
            case ActionType.ADAPTIVE_SCALE:
                this.adaptiveScale = new ARAdaptiveScale();
                this.addAction(this.adaptiveScale);
                break;
            case ActionType.FALLBACK:
                this.fallback = new ARFallback();
                this.addAction(this.fallback);
                break;
            default:
                break;
            }
        }
    }

    public removeProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.PLANE_SEMANTIC:
                this.planeSemantic = null;
                this.removeFactor(args1);
                break;
            case FactorType.PLANE_DIRECTION:
                this.planeDirection = null;
                this.removeFactor(args1);
                break;
            case FactorType.PLANE_SIZE:
                this.planeSize = null;
                this.removeFactor(args1);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay = null;
                this.removeAction(args1);
                break;
            case ActionType.DISPLAY_CHILDREN:
                this.displayChildren = null;
                this.removeAction(args1);
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent = null;
                this.removeAction(args1);
                break;
            case ActionType.ALIGNMENT:
                this.align = null;
                this.removeAction(args1);
                break;
            case ActionType.ADAPTIVE_SCALE:
                this.adaptiveScale = null;
                this.removeAction(args1);
                break;
            case ActionType.FALLBACK:
                this.fallback = null;
                this.removeAction(args1);
                break;
            default:
                break;
            }
        }
    }

    public resetProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.PLANE_DIRECTION:
                this.planeDirection?.reset();
                break;
            case FactorType.PLANE_SIZE:
                this.planeSize?.reset();
                break;
            case FactorType.PLANE_SEMANTIC:
                this.planeSemantic?.reset();
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.DISPLAY_CHILDREN:
                this.displayChildren?.reset();
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent?.reset();
                break;
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay?.reset();
                break;
            case ActionType.ALIGNMENT:
                this.align?.reset();
                break;
            case ActionType.ADAPTIVE_SCALE:
                this.adaptiveScale?.reset();
                break;
            case ActionType.FALLBACK:
                this.fallback?.reset();
                break;
            default:
                break;
            }
        }
    }
}
