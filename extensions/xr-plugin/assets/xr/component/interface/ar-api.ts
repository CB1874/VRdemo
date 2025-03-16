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

import { geometry, Vec2 } from 'cc';
import { ARSession } from '../../../ar/component/ar-session';
import { ARAnchor, ARFeatureData, ARRayCastMode, ARTrackingState, FeatureType } from '../../../ar/component/framework/utils/ar-defines';
import { ARTrackingType, XRSessionModeControllerType } from '../../../ar/component/framework/utils/ar-enum';
import DeviceOrientationInputSource from '../../../ar/component/framework/utils/device-orientation';
import { ARDevice } from '../device/ar-base/ar-device-base';
import { ARFeature } from '../device/ar-base/ar-feature-base';
import { ARHandlerLightingEstimation } from '../device/ar-base/ar-handler-base';
import { ARDeviceManager } from '../device/ar-device-manager';
import { WebXRDevice } from '../device/webxr/webxr-device';

export const arApi = {
    createDevice () {
        return ARDeviceManager.create(false);
    },

    checkDevice (mode: XRSessionModeControllerType, device: ARDevice): Promise<boolean> {
        return ARDeviceManager.checkSupported(mode, device);
    },

    initDevice (mode: XRSessionMode, device: ARDevice, featuresDataset: ARFeatureData[]): Promise<ARDevice | null> {
        return ARDeviceManager.init(mode, device, featuresDataset);
    },

    getDevice (): ARDevice | null {
        return ARDeviceManager.device;
    },

    removeDevice () {
        ARDeviceManager.clear();
    },

    isSupportedAR () {
        return ARDeviceManager.isSupportedAR();
    },

    openDeviceOrientation () {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        DeviceOrientationInputSource.Instance.start();
    },

    closeDeviceOrientation () {
        DeviceOrientationInputSource.Instance.stop();
    },

    setWebXRSessionMode (mode: XRSessionMode): Promise<boolean> {
        const device = this.getDevice();
        if (!device) {
            return Promise.resolve(false);
        }
        const webxrDevice = device as WebXRDevice;
        return webxrDevice.setSessionMode(mode);
    },
    getWebXRSessionMode (): XRSessionMode {
        const device = this.getDevice();
        if (!device) {
            return 'inline';
        }
        const webxrDevice = device as WebXRDevice;
        return webxrDevice.getSessionMode();
    },
    checkWebXRSessionMode (mode: XRSessionMode): Promise<boolean> {
        const device = this.getDevice();
        if (!device) {
            return Promise.resolve(false);
        }
        const webxrDevice = device as WebXRDevice;
        const promise = webxrDevice.checkSessionMode(mode);
        return promise;
    },

    getSession (): ARSession | null {
        return ARSession.getSession();
    },

    getFeature (type: FeatureType): ARFeature | null {
        const device = this.getDevice();
        if (device) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return device.tryGetFeatureByType(type);
        }
        return null;
    },

    checkFeatureEnable (type: FeatureType) {
        const device = this.getDevice();
        if (device) {
            const supports = device.FeatureSupportMask;
            if ((supports & type) === type) {
                return true;
            }
        }
        return false;
    },

    showAllVisualizer (type: ARTrackingType) {
        const session = ARSession.getSession();
        if (session) {
            session.manager?.showAllVisualizer(type);
        }
    },

    hideAllVisualizer (type: ARTrackingType) {
        const session = ARSession.getSession();
        if (session) {
            session.manager?.hideAllVisualizer(type);
        }
    },

    enableFeatureTracking (type: ARTrackingType, enable: boolean) {
        const session = ARSession.getSession();
        if (session) {
            session.manager?.enableFeatureTracking(type, enable);
        }
    },

    getFeatureConfig (type: ARTrackingType) {
        const session = ARSession.getSession();
        if (session) {
            return session.manager?.getFeatureConfig(type);
        }
        return null;
    },

    getFeatureAtSystem (type: ARTrackingType) {
        const session = ARSession.getSession();
        if (session) {
            return session.manager?.getFeature(type);
        }
        return null;
    },

    enableLightingEstimation (enable: boolean) {
        const session = ARSession.getSession();
        if (session) {
            session.manager?.enableFeatureTracking(ARTrackingType.Lighting, enable);
        }

        const feature = this.getFeature(FeatureType.LightingEstimation);
        if (feature) {
            (feature.getHandler() as ARHandlerLightingEstimation).enableLightingEstimation(enable);
        }
    },

    screenHitTest (mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null> {
        const device = this.getDevice();
        if (device) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return device.screenHitTest(mode, touchPoint);
        }
        return Promise.reject(new Error('screenHitTest error by session === null or session.device === null !'));
    },

    worldHitTest (mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState> {
        const device = this.getDevice();
        if (device) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return device.worldHitTest(mode, ray);
        }
        return Promise.reject(new Error('worldHitTest error by session === null or session.device === null !'));
    },

};
