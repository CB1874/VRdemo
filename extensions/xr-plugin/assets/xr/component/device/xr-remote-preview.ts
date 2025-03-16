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

import { _decorator, Component, Quat, Vec3, Vec4, sys } from 'cc';

const { ccclass, menu } = _decorator;

const PACKET_HEAD_CODE = 0x000ABCDEF;

export enum XRDataPackageType {
    DPT_MSG_DEVICE_INFO = 1,
    DPT_MSG_POSE_DATA = 2,
    DPT_MSG_CONTROLLER_KEY = 3,
    DPT_MSG_CONTENT = 4
}

export enum XRVendor {
    VD_MONADO,
    VD_META_QUEST,
    VD_HUAWEIVR,
    VD_PICO,
    VD_ROKID
}

export enum XRKeyEventType {
    KET_CLICK,
    KET_STICK,
    KET_GRAB
}

export class XRPacketHeaderInfo {
    headFlag = 0;
    packetDataLength = 0;
    packetType: XRDataPackageType = XRDataPackageType.DPT_MSG_CONTENT;
    isValid = false;
    dataView: DataView | null = null;
    chunkArray: Int8Array | null = null;

    parseData (arrayBuffer: ArrayBuffer): void {
        this.chunkArray = new Int8Array(arrayBuffer);
        const chunkLen = this.chunkArray.length;
        this.dataView = new DataView(arrayBuffer);
        const packetHeadFlag = this.dataView.getUint32(0, true);
        const packetDataLength = this.dataView.getUint32(4, true);
        this.isValid = false;
        if (packetHeadFlag !== PACKET_HEAD_CODE) {
            console.log(
                `XRPacketHeaderInfo.parseData error head code not match : ${
                    packetHeadFlag}!=${PACKET_HEAD_CODE}`,
            );
            return;
        }

        if (chunkLen < packetDataLength + 8) {
            console.log(
                `XRPacketHeaderInfo.parseData error length not right : ${chunkLen
                }<${packetDataLength}`,
            );
            return;
        }

        this.packetType = this.dataView.getInt16(8, true);
        this.isValid = true;
    }
}

export class XRCommonMessage {
    packetType: XRDataPackageType | undefined = XRDataPackageType.DPT_MSG_CONTENT;
    messageContent = '';

    parseData (packetHeaderInfo: XRPacketHeaderInfo, arrayBuffer: ArrayBuffer): void {
        packetHeaderInfo.parseData(arrayBuffer);

        if (!packetHeaderInfo.isValid) {
            console.log('XRCommonMessage.parseData header invalid!');
            return;
        }
        this.packetType = packetHeaderInfo.dataView?.getInt16(8, true);
        const chunkArray = packetHeaderInfo.chunkArray?.slice(10, packetHeaderInfo.chunkArray?.length);
        if (chunkArray) {
            // eslint-disable-next-line no-control-regex
            this.messageContent = String.fromCharCode.apply(String, chunkArray).replace(/\u0000/g, '');
        }
    }

    print (): void {
        console.log(`XRDeviceInfo: \ntype.${this.packetType} \nmessageContent.${this.messageContent}`);
    }
}
export class XRDeviceInfo {
    packetType: XRDataPackageType | undefined = XRDataPackageType.DPT_MSG_CONTENT;
    version = 0;
    deviceName = '';
    xrVendorType = 0;
    leftEyeFov: Vec4 = new Vec4();
    rightEyeFov: Vec4 = new Vec4();

    parseData (packetHeaderInfo: XRPacketHeaderInfo, arrayBuffer: ArrayBuffer): void {
        packetHeaderInfo.parseData(arrayBuffer);

        if (!packetHeaderInfo.isValid) {
            console.log('XRDeviceInfo.parseData header invalid!');
            return;
        }

        if (packetHeaderInfo.dataView) {
            this.packetType = packetHeaderInfo.dataView.getInt16(8, true);
            this.version = packetHeaderInfo.dataView.getInt16(10, true);
            const chunkArray = packetHeaderInfo.chunkArray?.slice(12, 44);
            if (chunkArray) {
                // eslint-disable-next-line no-control-regex
                this.deviceName = String.fromCharCode.apply(String, chunkArray).replace(/\u0000/g, '');
            }
            this.xrVendorType = packetHeaderInfo.dataView.getInt16(44, true);
            this.leftEyeFov.x = packetHeaderInfo.dataView.getFloat32(46, true);
            this.leftEyeFov.y = packetHeaderInfo.dataView.getFloat32(46 + 4, true);
            this.leftEyeFov.z = packetHeaderInfo.dataView.getFloat32(46 + 4 * 2, true);
            this.leftEyeFov.w = packetHeaderInfo.dataView.getFloat32(46 + 4 * 3, true);
            this.rightEyeFov.x = packetHeaderInfo.dataView.getFloat32(46 + 4 * 4, true);
            this.rightEyeFov.y = packetHeaderInfo.dataView.getFloat32(46 + 4 * 5, true);
            this.rightEyeFov.z = packetHeaderInfo.dataView.getFloat32(46 + 4 * 6, true);
            this.rightEyeFov.w = packetHeaderInfo.dataView.getFloat32(46 + 4 * 7, true);
        }
    }

    print (): void {
        console.log(
            `XRDeviceInfo: \ntype.${this.packetType} \nversion.${this.version} \ndeviceName.${this.deviceName} \nxrVendorType.${this.xrVendorType
            } \nleftEyeFov.${this.leftEyeFov.x},${this.leftEyeFov.y},${this.leftEyeFov.z},${this.leftEyeFov.w} \nrightEyeFov.${this.rightEyeFov.x
            },${this.rightEyeFov.y},${this.rightEyeFov.z},${this.rightEyeFov.w}`,
        );
    }
}

export class XRPoseInfo {
    packetType: XRDataPackageType = XRDataPackageType.DPT_MSG_CONTENT;
    hmdOrientation: Quat = new Quat();
    hmdPosition: Vec3 = new Vec3();
    leftControllerOrientation: Quat = new Quat();
    leftControllerPosition: Vec3 = new Vec3();
    rightControllerOrientation: Quat = new Quat();
    rightControllerPosition: Vec3 = new Vec3();
    hmdEuler: Vec3 = new Vec3();
    leftControllerEuler: Vec3 = new Vec3();
    rightControllerEuler: Vec3 = new Vec3();

    parseData (packetHeaderInfo: XRPacketHeaderInfo, arrayBuffer: ArrayBuffer): void {
        packetHeaderInfo.parseData(arrayBuffer);

        if (!packetHeaderInfo.isValid) {
            console.log('XRPoseInfo.parseData header invalid!');
            return;
        }

        if (packetHeaderInfo.dataView) {
            this.packetType = packetHeaderInfo.dataView.getInt16(8, true);
            this.hmdOrientation.x = packetHeaderInfo.dataView.getFloat32(10, true);
            this.hmdOrientation.y = packetHeaderInfo.dataView.getFloat32(10 + 4, true);
            this.hmdOrientation.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 2, true);
            this.hmdOrientation.w = packetHeaderInfo.dataView.getFloat32(10 + 4 * 3, true);
            this.hmdPosition.x = packetHeaderInfo.dataView.getFloat32(10 + 4 * 4, true);
            this.hmdPosition.y = packetHeaderInfo.dataView.getFloat32(10 + 4 * 5, true);
            this.hmdPosition.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 6, true);
            this.leftControllerOrientation.x = packetHeaderInfo.dataView.getFloat32(10 + 4 * 7, true);
            this.leftControllerOrientation.y = packetHeaderInfo.dataView.getFloat32(10 + 4 * 8, true);
            this.leftControllerOrientation.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 9, true);
            this.leftControllerOrientation.w = packetHeaderInfo.dataView.getFloat32(10 + 4 * 10, true);
            this.leftControllerPosition.x = packetHeaderInfo.dataView.getFloat32(10 + 4 * 11, true);
            this.leftControllerPosition.y = packetHeaderInfo.dataView.getFloat32(10 + 4 * 12, true);
            this.leftControllerPosition.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 13, true);
            this.rightControllerOrientation.x = packetHeaderInfo.dataView.getFloat32(10 + 4 * 14, true);
            this.rightControllerOrientation.y = packetHeaderInfo.dataView.getFloat32(10 + 4 * 15, true);
            this.rightControllerOrientation.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 16, true);
            this.rightControllerOrientation.w = packetHeaderInfo.dataView.getFloat32(10 + 4 * 17, true);
            this.rightControllerPosition.x = packetHeaderInfo.dataView.getFloat32(10 + 4 * 18, true);
            this.rightControllerPosition.y = packetHeaderInfo.dataView.getFloat32(10 + 4 * 19, true);
            this.rightControllerPosition.z = packetHeaderInfo.dataView.getFloat32(10 + 4 * 20, true);
        }

        if (this.hmdOrientation.w === 0) {
            this.hmdOrientation.w = 1;
        }

        if (this.leftControllerOrientation.w === 0) {
            this.leftControllerOrientation.w = 1;
        }

        if (this.rightControllerOrientation.w === 0) {
            this.rightControllerOrientation.w = 1;
        }

        this.hmdOrientation.getEulerAngles(this.hmdEuler);
        this.leftControllerOrientation.getEulerAngles(this.leftControllerEuler);
        this.rightControllerOrientation.getEulerAngles(this.rightControllerEuler);
    }

    print (): void {
        console.log(
            `XRPoseInfo: \ntype.${this.packetType} \nhmdRot.${this.hmdEuler.toString()} \nhmdPos.${this.hmdPosition.toString()
            } \nleftCtrlRot.${this.leftControllerEuler.toString()} \nleftCtrlPos.${this.leftControllerPosition.toString()
            } \nrightCtrlRot.${this.rightControllerEuler.toString()} \nrightCtrlPos.${this.rightControllerPosition.toString()}`,
        );
    }
}

export class XRControllerKeyInfo {
    packetType: XRDataPackageType = XRDataPackageType.DPT_MSG_CONTENT;
    keyEventType = 0;
    stickAxisCode = 0;
    stickAxisValue = 0;
    stickKeyCode = 0;
    isButtonPressed = false;

    parseData (packetHeaderInfo: XRPacketHeaderInfo, arrayBuffer: ArrayBuffer): void {
        packetHeaderInfo.parseData(arrayBuffer);

        if (!packetHeaderInfo.isValid) {
            console.log('XRControllerKeyInfo.parseData header invalid!');
            return;
        }

        if (packetHeaderInfo.dataView) {
            this.packetType = packetHeaderInfo.dataView.getInt16(8, true);
            this.keyEventType = packetHeaderInfo.dataView.getInt16(10, true);
            this.stickAxisCode = packetHeaderInfo.dataView.getInt16(12, true);
            this.stickAxisValue = packetHeaderInfo.dataView.getFloat32(14, true);
            this.stickKeyCode = packetHeaderInfo.dataView.getInt16(18, true);
            this.isButtonPressed = packetHeaderInfo.dataView.getInt8(20) === 1;
        }
    }

    print (): void {
        console.log(
            `XRControllerKeyInfo: \ntype.${this.packetType} \nkeyEventType.${this.keyEventType
            } \nstickKeyCode.${this.stickKeyCode} \nbtnPressed.${this.isButtonPressed
            } \nstickAxisCode.${this.stickAxisCode} \nstickAxisValue.${this.stickAxisValue}`,
        );
    }
}

@ccclass('cc.XRRemotePreView')
@menu('XR/Extra/XRRemotePreView')
export class XRRemotePreView extends Component {
    private _wsClient: WebSocket | null = null;
    private _wsServerIp: string | null = null;
    private _xrPacketHeaderInfo: XRPacketHeaderInfo = new XRPacketHeaderInfo();
    private _xrDeviceInfo: XRDeviceInfo = new XRDeviceInfo();
    private _xrPoseInfo: XRPoseInfo = new XRPoseInfo();
    private _xrControllerKeyInfo: XRControllerKeyInfo = new XRControllerKeyInfo();
    private _xrCommonMessage: XRCommonMessage = new XRCommonMessage();
    private _wsLastTickTime = 0;
    private _retryCount = 0;

    update (deltaTime: number) {
        this._wsLastTickTime += deltaTime;
        if (this._wsLastTickTime >= 30) {
            this._wsLastTickTime = 0;
            if (this._wsClient && this._wsClient.readyState == WebSocket.OPEN) {
                this._wsClient.send('tick');
            }
        }
    }

    sendControllerKeyInfo (): void {
        if (sys.isBrowser) {
            const remoteInputEvent: CustomEvent = new CustomEvent('xr-remote-input', {
                detail: {
                    keyEventType: this._xrControllerKeyInfo.keyEventType,
                    stickAxisCode: this._xrControllerKeyInfo.stickAxisCode,
                    stickAxisValue: this._xrControllerKeyInfo.stickAxisValue,
                    stickKeyCode: this._xrControllerKeyInfo.stickKeyCode,
                    isButtonPressed: this._xrControllerKeyInfo.isButtonPressed,
                },
            });
            window.dispatchEvent(remoteInputEvent);
        }
    }

    syncHmdControllerPose (): void {
        this.node.emit('sync-pose', this._xrPoseInfo);
    }

    syncDeviceInfo (): void {
        this.node.emit('sync-device-info', this._xrDeviceInfo);
    }

    connect (ip?: string): void {
        if (this._wsServerIp === null) {
            this._wsServerIp = `ws://${ip}:8989`;
        }
        this._wsClient = new WebSocket(this._wsServerIp);

        this._wsClient.onopen = () => {
            console.log('[WebSocket] onopen');
        };

        this._wsClient.onmessage = (event: MessageEvent) => {
            this.getBufferData(event.data)
                .then((result: ArrayBuffer) => {
                    this.unpackData(result);
                })
                .catch((err) => {
                    console.log(`[WebSocket] getBufferData error.${err}`);
                });
        };

        this._wsClient.onerror = () => {
            console.log('[WebSocket] onerror');
        };

        this._wsClient.onclose = (event: CloseEvent) => {
            if (this._retryCount === 5) return;
            console.log(`[WebSocket] onclose:${event.code} | ${event.reason} | retryCount.${this._retryCount}`);
            this.scheduleOnce(this.connect, 3);
            this._retryCount++;
        };
        console.log('[XRRemotePreView] connect');
    }

    disconnect (): void {
        if (this._wsClient) {
            this._wsClient.onopen = null;
            this._wsClient.onmessage = null;
            this._wsClient.onerror = null;
            this._wsClient.onclose = null;
            this._wsClient.close();
        }
        this._wsClient = null;
    }

    getBufferData (data: Blob | ArrayBuffer): Promise<any> {
        return new Promise((resolve) => {
            if (data.toString() === '[object Blob]') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                data.arrayBuffer().then((buf) => {
                    resolve(buf);
                });
            } else {
                resolve(data);
            }
        });
    }

    private unpackData (arrayBuffer: ArrayBuffer) {
        this._xrPacketHeaderInfo.parseData(arrayBuffer);
        switch (this._xrPacketHeaderInfo.packetType) {
        case XRDataPackageType.DPT_MSG_CONTROLLER_KEY: {
            this._xrControllerKeyInfo.parseData(this._xrPacketHeaderInfo, arrayBuffer);
            // this.xrControllerKeyInfo.print();
            this.sendControllerKeyInfo();
            break;
        }
        case XRDataPackageType.DPT_MSG_DEVICE_INFO: {
            this._xrDeviceInfo.parseData(this._xrPacketHeaderInfo, arrayBuffer);
            this._xrDeviceInfo.print();
            this.syncDeviceInfo();
            break;
        }
        case XRDataPackageType.DPT_MSG_POSE_DATA: {
            this._xrPoseInfo.parseData(this._xrPacketHeaderInfo, arrayBuffer);
            // xrDeivcePoseInfo.print();
            this.syncHmdControllerPose();
            break;
        }
        case XRDataPackageType.DPT_MSG_CONTENT: {
            this._xrCommonMessage.parseData(this._xrPacketHeaderInfo, arrayBuffer);
            this._xrCommonMessage.print();
            break;
        }
        default:
            break;
        }
    }

    onDestroy () {
        this.disconnect();
    }
}
