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

import { assetManager, Camera, director, Mat4, Quat, Size, Vec3, math, settings, Settings } from 'cc';
import { ARHandlerImageTracking } from '../../ar-base/ar-handler-base';
import { ARImage, ARLibImageData, ARTrackingState } from '../../../../../ar/component/framework/utils/ar-defines';

const mindar = globalThis.MINDAR && globalThis.MINDAR.IMAGE;
interface IWebARTrackedImage {
    targetIndex: number;
    type: string;
    worldMatrix: Float32Array | null;
}
export class ARWebARHandlerImageTracking extends ARHandlerImageTracking {
    private _enable = true;
    private _imageLibs: ARLibImageData[] = [];

    private _controller: any = null;
    private _maxTrackingNum = 0;
    private _trackingList: Map<number, IWebARTrackedImage> = new Map<number, IWebARTrackedImage>();
    private _postMatrixs: Mat4[] = [];
    private _postWidth: number[] = [];
    private _trackingData = null;
    private _settingOrientation: string | null = null;

    public enableImageTracking (enable: boolean) {
        this._enable = enable;
    }

    public addImagesToLib (images: ARLibImageData[]) {
        this._imageLibs = images;
    }

    public setImageMaxTrackingNumber (count: number) {
        this._maxTrackingNum = count;
    }

    private getImageSizeInMeters (index: number) {
        const ARLibImageData = this._imageLibs[index];
        if (ARLibImageData) {
            return {
                widthInMeters: ARLibImageData.widthInMeters === 0 ? 0.15 : ARLibImageData.widthInMeters,
                heightInMeters: ARLibImageData.heightInMeters === 0 ? 0.15 : ARLibImageData.heightInMeters,
            };
        }
        return { widthInMeters: 0.15, heightInMeters: 0.15 };
    }

    public update (camera?: Camera | null) {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }
        const removedImages: ARImage[] = [];
        const addedImages: ARImage[] = [];
        const updatedImages: ARImage[] = [];

        if (this._trackingData) {
            const { targetIndex, worldMatrix } = this._trackingData;

            const image = this._updateImageWithXRImage(this._trackingData, camera);
            if (worldMatrix === null) {
                image.trackingState = ARTrackingState.STOPPED;
                removedImages.push(image);
                this._trackingList.delete(targetIndex);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (this._trackingList.has(targetIndex)) {
                    updatedImages.push(image);
                } else {
                    addedImages.push(image);
                    this._trackingList.set(targetIndex, this._trackingData);
                }
            }

            if (removedImages.length > 0) {
                this._feature.onRemoveTracking(removedImages);
            }
            if (addedImages.length > 0) {
                this._feature.onAddTracking(addedImages);
            }
            if (updatedImages.length > 0) {
                this._feature.onUpdateTracking(updatedImages);
            }
        }
    }

    public start (video: HTMLVideoElement | null) {
        this._settingOrientation = settings.querySettings(Settings.Category.SCREEN, 'orientation');
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            if (!video) {
                console.warn('video === null');
                reject();
                return;
            }

            this._controller = new mindar.Controller({
                inputWidth: video.videoWidth,
                inputHeight: video.videoHeight,
                filterMinCF: 1,
                filterBeta: 10000,
                warmupTolerance: 0,
                missTolerance: 0,
                maxTrack: this._maxTrackingNum,
                debugMode: false,
                onUpdate: (data) => {
                    if (data.type === 'updateMatrix') {
                        this._trackingData = data;
                    }
                },
            });
            if (!this._controller) {
                console.warn('this._controller === null');
                reject();
                return;
            }
            const uuid = director.getScene()?.uuid;
            let path = `./assets/main/mind/${uuid}.mind`;
            if (assetManager.downloader.remoteBundles.length > 0) {
                path = `./remote/main/mind/${uuid}.mind`;
            }

            const { dimensions: imageTargetDimensions } = await this._controller.addImageTargets(path);

            this._postMatrixs = [];
            for (let i = 0; i < imageTargetDimensions.length; i++) {
                const position = new Vec3();
                const quaternion = new Quat();
                const scale = new Vec3();
                const [markerWidth, markerHeight] = imageTargetDimensions[i];
                position.x = markerWidth / 2;
                position.y = markerWidth / 2 + (markerHeight - markerWidth) / 2;
                scale.x = markerWidth;
                scale.y = markerWidth;
                scale.z = markerWidth;
                const postMatrix = new Mat4();
                postMatrix.fromRTS(quaternion, position, scale);
                this._postMatrixs.push(postMatrix);
                this._postWidth.push(markerWidth / this.getImageSizeInMeters(i).widthInMeters);
            }

            await this._controller.dummyRun(video);

            this._controller.processVideo(video);
            resolve();
        });
    }

    public stop () {
        if (this._controller) {
            this._controller.stopProcessVideo();
            this._controller.dispose();
            this._controller = null;
        }
    }

    private _updateImageWithXRImage (imageContext: IWebARTrackedImage, camera?: Camera | null): ARImage {
        const outVec = new Vec3();
        const outQuat = new Quat();

        if (imageContext.worldMatrix) {
            const mat = imageContext.worldMatrix;
            const tmpMat4 = new Mat4(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5], mat[6], mat[7],
                mat[8], mat[9], mat[10], mat[11], mat[12], mat[13], mat[14], mat[15]);

            Mat4.multiply(tmpMat4, tmpMat4, this._postMatrixs[imageContext.targetIndex]);

            const arCameraMgr = camera?.node;
            if (arCameraMgr) {
                const cameraMatrix = arCameraMgr.worldMatrix.clone();
                if ((this._settingOrientation === 'landscape' && (window.orientation === 0 || window.orientation === 180))
                    || (this._settingOrientation === 'portrait' && (window.orientation === 90 || window.orientation === -90))) {
                    cameraMatrix.rotate(math.toRadian(-90), Vec3.FORWARD);
                }
                Mat4.multiply(tmpMat4, cameraMatrix, tmpMat4);
            }

            tmpMat4.getTranslation(outVec);
            outVec.multiplyScalar(1 / this._postWidth[imageContext.targetIndex]);

            tmpMat4.getRotation(outQuat);
            Quat.rotateAroundLocal(outQuat, outQuat, Vec3.RIGHT, math.toRadian(90));
        }
        const size = this.getImageSizeInMeters(imageContext.targetIndex);
        const image: ARImage = {
            id: imageContext.targetIndex,
            pose: {
                position: outVec,
                rotation: outQuat,
            },
            libIndex: imageContext.targetIndex,
            trackingState: ARTrackingState.TRACKING,
            extent: new Size(size.widthInMeters, size.heightInMeters),
        };
        return image;
    }
}
