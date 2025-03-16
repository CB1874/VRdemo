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

import { _decorator, Component, director, sys } from 'cc';
import { EDITOR } from 'cc/env';
import { ARSystemBase, IExtraDisplay } from './framework/systems/ar-system-base';
import  * as systems  from './framework/systems';
import { ARConfiguration } from './framework/features/ar-configuration';
import { ARTrackingType } from './framework/utils/ar-enum';
import { ARSystemTrackable } from './framework/systems';
import { ARTrackingBase } from './tracking/ar-tracking-base';
import { ARAnchor, ARFeatureData, FeatureEventParam, FeatureType } from './framework/utils/ar-defines';
import { arEvent, AREventType, ARInternalEventType } from './framework/utils/ar-event';
import { ARDevice } from '../../xr/component/device/ar-base/ar-device-base';
import { ARDeviceManager } from '../../xr/component/device/ar-device-manager';

const { ccclass, property, help, menu, executeInEditMode, disallowMultiple } = _decorator;

/**
 * @en
 * The AR management component is used to collect and manage various AR features and coordinate AR System processing processes
 * @zh
 * AR管理组件,用于收集和管理各种AR特性，协调AR System处理流程
 */
@ccclass('cc.ARManager')
@help('i18n:cc.ARManager')
@menu('XR/AR Tracking/ARManager')
@executeInEditMode
@disallowMultiple
export class ARManager extends Component {
    @property({ serializable: true })
    protected _configuration: ARConfiguration = new ARConfiguration();

    private _systemsMap = new Map<ARTrackingType, ARSystemBase<ARAnchor>>();
    private _trackableSystem: ARSystemTrackable | null = null;

    @property({
        displayOrder: 1,
        visible: (function (this: ARManager) {
            return this._configuration.hasConfig;
            }),
        tooltip: 'i18n:xr-plugin.tracking.manager.configuration',
        })
    set configuration (val) {
        if (val === this._configuration) {
            return;
        }
        this._configuration = val;
    }
    get configuration () {
        return this._configuration;
    }

    protected onLoad () {
        this.configuration.registerEvent();
        arEvent.on(ARInternalEventType.CHECK_TRACKING_NODE_STATE, this.onCheckTrackingNodeState, this);
        arEvent.on(AREventType.CAMEAR_DATA_INITIALIZED, this.onCameraDataInitedEvent, this);
    }

    protected onDestroy () {
        this.configuration.unregisterEvent();
        arEvent.off(ARInternalEventType.CHECK_TRACKING_NODE_STATE, this.onCheckTrackingNodeState, this);
        arEvent.off(AREventType.CAMEAR_DATA_INITIALIZED, this.onCameraDataInitedEvent, this);
    }

    protected start () {
        if (EDITOR && !this._configuration.hasConfig) {
            this.collectFeature();
        }
    }

    public collectFeature () {
        this._configuration.reset();
        const trackings = director.getScene()!.getComponentsInChildren(ARTrackingBase);
        trackings.forEach((element) => {
            if (element.node.active) {
                element.updateFeature(true);
                element.init();
            }
        });
    }

    public init (device: ARDevice) {
        const mode = device.getSessionMode();
        if (mode === 'immersive-ar') {
            this.configuration.trackings.forEach((tracking) => {
                if (tracking) {
                    this.addToSystemWith(tracking, device);
                }
            });
            this._trackableSystem = new ARSystemTrackable();
            this._systemsMap.forEach((system) => {
                system.init(this.node);
                this._trackableSystem?.registerFeatureSystem(system);
            });
        } else {
            console.warn('ar manager init not supported :', mode);
        }
    }

    public updateSystem () {
        if (!EDITOR && this._trackableSystem) {
            this._trackableSystem.update();
        }
    }

    public showAllVisualizer (type: ARTrackingType) {
        if (this._systemsMap.has(type)) {
            const system = this._systemsMap.get(type);
            (system as any as IExtraDisplay)?.showAllVisualizer();
        }
    }

    public hideAllVisualizer (type: ARTrackingType) {
        if (this._systemsMap.has(type)) {
            const system = this._systemsMap.get(type);
            (system as any as IExtraDisplay)?.hideAllVisualizer();
        }
    }

    public enableFeatureTracking (type: ARTrackingType, enable: boolean) {
        this.configuration.setFeatureEnable(type, enable);

        if (this._systemsMap.has(type)) {
            const system = this._systemsMap.get(type)!;
            system.enableFeature(enable);
        }
    }

    public getFeature (type: ARTrackingType) {
        if (this._systemsMap.has(type)) {
            const system = this._systemsMap.get(type)!;
            return system.feature;
        }
        return null;
    }

    public enablePlaneTracking (event: Event, customEventData: string) {
        this.enableFeatureTracking(ARTrackingType.Plane, parseInt(customEventData) === 1);
    }

    public enableImageTracking (event: Event, customEventData: string) {
        this.enableFeatureTracking(ARTrackingType.Image, parseInt(customEventData) === 1);
    }

    public enableMeshTracking (event: Event, customEventData: string) {
        this.enableFeatureTracking(ARTrackingType.WorldMesh, parseInt(customEventData) === 1);
    }

    public enableFaceTracking (event: Event, customEventData: string) {
        this.enableFeatureTracking(ARTrackingType.Face, parseInt(customEventData) === 1);
    }

    public getFeatureConfig (type: ARTrackingType) {
        return this.configuration.getFeatureConfig(type);
    }

    private onCheckTrackingNodeState (event: FeatureEventParam) {
        if (this._systemsMap.has(event.ft)) {
            const system = this._systemsMap.get(event.ft)!;
            if (!event.canUse) {
                system.removeTracking(event.tracking);

                const cnt = system.getTrackingCount();
                const enable = this.configuration.getFeatureEnable(event.ft);
                if (!enable && cnt <= 0) {
                    system.enableFeature(false);
                } else {
                    //update feature
                    system.updateFeature(this.configuration.getFeatureConfig(event.ft));
                }
            } else {
                const cnt = system.getTrackingCount();
                system.addTracking(event.tracking);

                const enable = this.configuration.getFeatureEnable(event.ft);
                if (enable && cnt <= 0) {
                    system.enableFeature(true);
                } else {
                    //update feature
                    system.updateFeature(this.configuration.getFeatureConfig(event.ft));
                }
            }
        } else {
            console.warn('not found system type with :',  ARTrackingType[event.ft]);
        }
    }

    private onCameraDataInitedEvent () {
        if (ARDeviceManager.isSupportedAR()) {
            return;
        }
        const featuresDataset = this.configuration.config;
        let list: ARFeatureData [] = [];
        if (sys.isNative) {
            list = featuresDataset.filter((e) => e && e.type === FeatureType.PlaneDetection && e.enableNativeFallBack);
        } else if (sys.isBrowser) {
            list = featuresDataset.filter((e) => e && e.type === FeatureType.PlaneDetection && e.enableWebFallBack);
        }
        console.log('can plane fall back :', list.length > 0);
        if (list.length > 0) {
            const system = this._systemsMap.get(ARTrackingType.Plane)!;
            if (system) {
                (system as any).runFallbackAction();
            }
        }
    }

    private addToSystemWith (tracking: ARTrackingBase, device: ARDevice) {
        if (!this._systemsMap.has(tracking.trackingType)) {
            const featureClass = device.FeaturePrefix + FeatureType[tracking.trackingType];

            const feature = device.tryGetFeature(featureClass);
            if (feature) {
                const systemClass = `ARSystem${FeatureType[tracking.trackingType]}`;
                if ((systems)[systemClass]) {
                    const system = new (systems)[systemClass](feature);
                    system.addTracking(tracking);
                    this._systemsMap.set(tracking.trackingType, system);
                }
            } else {
                this.emitUnsupportedEvent(tracking.trackingType);
                console.error('ar manager feature init error!', featureClass);
            }
        } else {
            const system = this._systemsMap.get(tracking.trackingType)!;
            system.addTracking(tracking);
        }
    }

    private emitUnsupportedEvent (type: ARTrackingType) {
        switch (type) {
        case ARTrackingType.Plane:
            this._configuration.planeFeature.emitUnsupportedEvent();
            break;
        case ARTrackingType.WorldMesh:
            this._configuration.meshingFeature.emitUnsupportedEvent();
            break;
        case ARTrackingType.Image:
            this._configuration.imageFeature.emitUnsupportedEvent();
            break;
        case ARTrackingType.Face:
            this._configuration.faceFeature.emitUnsupportedEvent();
            break;
        default:
            break;
        }
    }
}
