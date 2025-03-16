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

import { Camera, Settings, settings, sys, view, screen, TangentWeightMode } from 'cc';

const ccwindow: typeof window = typeof globalThis.jsb !== 'undefined' ? (typeof jsb.window !== 'undefined' ? jsb.window : globalThis) : globalThis;
const ccdocument = ccwindow.document;

export class MindAR {
    private _video: HTMLVideoElement | null = null;

    private _camera: Camera | null = null;
    get Camera (): Camera | null {
        return this._camera;
    }
    set Camera (val: Camera | null) {
        this._camera = val;
    }
    get Video (): HTMLVideoElement | null {
        return this._video;
    }

    private _cameraFov = 45;
    private _videoTextureCoords = [0, 0, 0, 1, 1, 0, 1, 1];

    public adapterMediaDevice () {
        // Older browsers may not implement mediaDevices at all, so we can set an empty object first
        const env = navigator as any;
        if (env.mediaDevices === undefined) {
            env.mediaDevices = {};
        }
        if (env.mediaDevices.getUserMedia === undefined) {
            env.mediaDevices.getUserMedia = (constraints) => {
                const getUserMedia = env.getUserMedia || env.webkitGetUserMedia || env.mozGetUserMedia || env.msGetUserMedia;

                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }

                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            };
        }
    }

    private createVideoPlayer () {
        const video = this._video = ccdocument.createElement('video');
        video.className = 'cocosMindARVideo';
        video.style.position = 'absolute';
        video.style.bottom = '0px';
        video.style.left = '0px';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style['object-fit'] = 'cover';
        video.style['transform-origin'] = '0px 100% 0px';
        video.style['-webkit-transform-origin'] = '0px 100% 0px';
        video.setAttribute('preload', 'auto');
        video.setAttribute('webkit-playsinline', '');
        // This x5-playsinline tag must be added, otherwise the play, pause events will only fire once, in the qq browser.
        video.setAttribute('x5-playsinline', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
    }

    private getCameraStream (): Promise<MediaStream> {
        return new Promise<MediaStream>((resolve, reject) => {
            const getMediaStream = () => {
                console.log('getMediaStream...');
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.log('sorry, your browser not support getUserMedia api.');
                    reject(new Error('sorry, your browser not support getUserMedia api.'));
                    return;
                }
                const constraints = {
                    audio: false,
                    video: {
                        facingMode: 'environment',
                    },
                };
                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    resolve(stream);
                }).catch((err) => {
                    console.log('getUserMedia error:', JSON.stringify(err));
                    reject(new Error('sorry, your browser getUserMedia error.'));
                });
            };

            const getMediaStreamByDeviceId = (deviceId: string) => {
                console.log('getMediaStreamByDeviceId...', deviceId);
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.log('sorry, your browser not support getUserMedia api.');
                    reject(new Error('sorry, your browser not support getUserMedia api.'));
                    return;
                }
                const constraints = {
                    audio: false,
                    video: {
                        optional: [
                            {
                                sourceId: deviceId,
                            },
                        ],
                    },
                };
                navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints).then((stream) => {
                    resolve(stream);
                }).catch((err) => {
                    console.log('getUserMedia error:', JSON.stringify(err));
                    reject(new Error('sorry, your browser getUserMedia error.'));
                });
            };

            if (navigator && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function' && sys.os !== sys.OS.IOS) {
                const primise = navigator.mediaDevices.enumerateDevices().then((dev) => {
                    let deviceId: string | null = null;
                    for (const item of dev) {
                        if (item.kind === 'videoinput') {
                            if (item.label.indexOf('back') !== -1) {
                                const arr = item.label.split(' ');
                                if (parseInt(arr[1]) === 0 && arr[0].indexOf('camera') !== -1) {
                                    //camera 0
                                    deviceId = item.deviceId;
                                    break;
                                }
                            } else {
                                deviceId = item.deviceId;
                            }
                        }
                    }
                    if (deviceId) {
                        getMediaStreamByDeviceId(deviceId);
                    } else {
                        getMediaStream();
                    }
                });
            } else {
                getMediaStream();
            }
        });
    }

    public startVideo (): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.createVideoPlayer();
            this.getCameraStream().then((stream) => {
                if (this._video) {
                    if ('srcObject' in this._video) {
                        this._video.srcObject = stream;
                    } else {
                        // Prevent using it in new browsers because it is no longer supported
                        (this._video as HTMLVideoElement).src = window.URL.createObjectURL(stream as any);
                    }
                    this._video.addEventListener('loadedmetadata', () => {
                        this._video?.play();
                        resolve(true);
                        globalThis.__globalXR.webAR = this;
                        globalThis.__globalXR.webAR.IsVideoReady = true;

                        const settingOrientation = settings.querySettings(Settings.Category.SCREEN, 'orientation');
                        this.updateCameraTexCoords(settingOrientation);

                        view.on('canvas-resize', () => {
                            this.updateCameraTexCoords(settingOrientation);
                        });
                    });
                }
            }).catch((err) => {
                console.log('getUserMedia error', err);
                reject(new Error('sorry, your browser getUserMedia error.'));
            });
        });
    }

    public stopVideo () {
        if (this._video) {
            this._video.pause();
            if (this._video.srcObject) {
                const tracks = (this._video.srcObject as any).getTracks();
                tracks.forEach((track) => {
                    track.stop();
                });
            }
            this._video.remove();
            this._video = null;
        }
        globalThis.__globalXR.webAR = null;
    }

    public getCameraFov (): number {
        return this._cameraFov;
    }

    public getCameraTexCoords (): number[] {
        return this._videoTextureCoords;
    }

    private updateCameraTexCoords (settingOrientation: string) {
        if (!this._video) {
            return;
        }
        const vp = view.getViewportRect();
        const vW = this._video.videoWidth;
        const vH = this._video.videoHeight;
        let vpW = vp.width;
        let vpH = vp.height;

        // as the setting fixed orientation is like simulate in web, need exchange vp for calculation
        let mismatchFlag = false;
        if ((settingOrientation === 'landscape' && (window.orientation === 0 || window.orientation === 180))
        || (settingOrientation === 'portrait' && (window.orientation === 90 || window.orientation === -90))) {
            const temp = vpW;
            vpW = vpH;
            vpH = temp;
            mismatchFlag = true;
        }

        if (!mismatchFlag) {
            if (window.orientation === 90 || window.orientation === -90) {
                this._cameraFov = 2 * Math.atan(Math.tan(45 * Math.PI / 180 / 2) / (vpW / vpH) * (vW / vH)) / Math.PI * 180;
            } else {
                this._cameraFov = 45;
            }
        } else if (settingOrientation === 'landscape') {
            this._cameraFov = 2 * Math.atan(Math.tan(45 * Math.PI / 180 / 2) * (vpW / vpH)) / Math.PI * 180;
        } else if (settingOrientation === 'portrait') {
            this._cameraFov = 2 * Math.atan(Math.tan(45 * Math.PI / 180 / 2) * (vW / vH)) / Math.PI * 180;
        }

        let scaleX = vpW / vW;
        let scaleY = vpH / vH;
        if (scaleX >= scaleY) {
            scaleY /= scaleX;
            scaleX = 1;
        } else {
            scaleX /= scaleY;
            scaleY = 1;
        }

        const deltaX = (1 - scaleX) / 2.0;
        const deltaY = (1 - scaleY) / 2.0;

        if (!mismatchFlag) {
            this._videoTextureCoords[0] = deltaX;
            this._videoTextureCoords[1] = deltaY;
            this._videoTextureCoords[2] = deltaX;
            this._videoTextureCoords[3] = 1 - deltaY;
            this._videoTextureCoords[4] = 1 - deltaX;
            this._videoTextureCoords[5] = deltaY;
            this._videoTextureCoords[6] = 1 - deltaX;
            this._videoTextureCoords[7] = 1 - deltaY;
        } else {
            this._videoTextureCoords[0] = 1 - deltaX;
            this._videoTextureCoords[1] = deltaY;
            this._videoTextureCoords[2] = deltaX;
            this._videoTextureCoords[3] = deltaY;
            this._videoTextureCoords[4] = 1 - deltaX;
            this._videoTextureCoords[5] = 1 - deltaY;
            this._videoTextureCoords[6] = deltaX;
            this._videoTextureCoords[7] = 1 - deltaY;
        }
    }
}
