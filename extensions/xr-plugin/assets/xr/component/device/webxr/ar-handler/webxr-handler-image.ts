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

import { Quat, Size, Vec3 } from 'cc';
import { ARHandlerImageTracking } from '../../ar-base/ar-handler-base';
import { ARImage, ARLibImageData, ARTrackingState } from '../../../../../ar/component/framework/utils/ar-defines';

enum ImageTrackingCurStatus {
    None,
    Added,
    Updated,
    Removed,
}

interface IWebXRTrackedImage {
    id: number;
    trackingState?: XRImageTrackingState;
    score: XRImageTrackingScore;
    realWorldWidth: number,
    pose?: XRPose | undefined;
    ratio: number;
    curState: ImageTrackingCurStatus;
}

enum ImageTrackingScoreStatus {
    NotReceived,
    Waiting,
    Received,
}

export class ARWebXRHandlerImageTracking extends ARHandlerImageTracking {
    protected _featureName = 'image-tracking';
    private _enable = true;
    private _imageLibs: ARLibImageData[] = [];
    private _originalTrackingRequest: XRTrackedImageInit[] = [];
    private _trackedImages: IWebXRTrackedImage[] = [];
    private _trackableScoreStatus: ImageTrackingScoreStatus = ImageTrackingScoreStatus.NotReceived;
    private _maxTrackingNum = 0;
    private _curTrackingNum = 0;
    public enableImageTracking (enable: boolean) {
        this._enable = enable;
    }

    public addImagesToLib (images: ARLibImageData[]) {
        this._imageLibs = images;
    }

    public setImageMaxTrackingNumber (count: number) {
        this._maxTrackingNum = count;
        this._curTrackingNum = 0;
    }

    public createImageBitmapFromSource (imagePath: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        const promise = new Promise<ImageBitmap>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                image.decode().then(() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.createImageBitmap(image, options).then((imageBitmap) => {
                        console.log(imageBitmap);
                        resolve(imageBitmap);
                    });
                });
            };
            image.onerror = (err) => {
                reject(new Error(`Error loading image ${image.src}`));
            };

            image.src = imagePath;
        });

        return promise;
    }

    public createImageBitmap (image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return createImageBitmap(image, options);
    }

    public attachFeatureSessionInit (): Promise<XRSessionInit> {
        if (this._imageLibs.length <= 0) {
            return Promise.resolve({});
        }
        const promises = this._imageLibs.map((image) => this.createImageBitmapFromSource(image.assetPath));

        return Promise.all(promises).then((images) => {
            this._originalTrackingRequest = images.map((image, idx) => ({
                image,
                widthInMeters: this._imageLibs[idx].widthInMeters === 0 ? 0.15 : this._imageLibs[idx].widthInMeters,
            }));
            return {
                optionalFeatures: [this._featureName],
                trackedImages: this._originalTrackingRequest,
            };
        }).catch(() => Promise.resolve({}));
    }

    public process (frame: XRFrame, immersiveRefSpace: XRReferenceSpace) {
        if (!this._feature || !this._feature.config?.enable || !frame || !frame.getImageTrackingResults) {
            return;
        }

        if (this._trackableScoreStatus === ImageTrackingScoreStatus.NotReceived) {
            if (!frame.session.getTrackedImageScores || this._trackableScoreStatus !== ImageTrackingScoreStatus.NotReceived) {
                return;
            }

            this._trackableScoreStatus = ImageTrackingScoreStatus.Waiting;
            const promise = frame.session.getTrackedImageScores().then((imageScores) => {
                if (!imageScores || imageScores.length === 0) {
                    this._trackableScoreStatus = ImageTrackingScoreStatus.NotReceived;
                    return;
                }

                for (let idx = 0; idx < imageScores.length; ++idx) {
                    const originalBitmap = this._originalTrackingRequest[idx].image;
                    const imageObject: IWebXRTrackedImage = {
                        id: idx,
                        ratio: originalBitmap.width / originalBitmap.height,
                        score: imageScores[idx],
                        curState: ImageTrackingCurStatus.None,
                        realWorldWidth: originalBitmap.width,
                    };
                    this._trackedImages[idx] = imageObject;
                }
                this._trackableScoreStatus = imageScores.length > 0 ? ImageTrackingScoreStatus.Received : ImageTrackingScoreStatus.NotReceived;
            });
        }

        const removedImages: ARImage[] = [];
        const addedImages: ARImage[] = [];
        const updatedImages: ARImage[] = [];

        const imageTrackedResults = frame.getImageTrackingResults();
        for (const result of imageTrackedResults) {
            const imageIndex = result.index;

            const imageObject = this._trackedImages[imageIndex];
            if (!imageObject || imageObject.score === 'untrackable') {
                console.warn('image not trackable:', imageObject.id);
                continue;
            }
            imageObject.trackingState = result.trackingState;
            imageObject.realWorldWidth = result.measuredWidthInMeters;

            const pose = frame.getPose(result.imageSpace, immersiveRefSpace);
            if (pose) {
                imageObject.pose = pose;
            }
            const image = this._updateImageWithXRImage(imageObject);
            if (imageObject.trackingState === 'emulated') {
                if (imageObject.curState !== ImageTrackingCurStatus.None) {
                    imageObject.curState = ImageTrackingCurStatus.Removed;
                }
            } else if (imageObject.curState === ImageTrackingCurStatus.None) {
                imageObject.curState = ImageTrackingCurStatus.Added;
            } else {
                imageObject.curState = ImageTrackingCurStatus.Updated;
            }

            if (imageObject.curState === ImageTrackingCurStatus.Added) {
                if (this._curTrackingNum >= this._maxTrackingNum) {
                    console.warn('The number of tracks reached the upper limit : ', this._curTrackingNum, this._maxTrackingNum);
                    continue;
                }
                addedImages.push(image);
                this._curTrackingNum++;
            } else if (imageObject.curState === ImageTrackingCurStatus.Removed) {
                imageObject.curState = ImageTrackingCurStatus.None;
                image.trackingState = ARTrackingState.STOPPED;
                removedImages.push(image);
                this._curTrackingNum = Math.max(0, --this._curTrackingNum);
            } else if (imageObject.curState === ImageTrackingCurStatus.Updated) {
                updatedImages.push(image);
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

    private _updateImageWithXRImage (imageContext: IWebXRTrackedImage): ARImage {
        const image: ARImage = {
            id: imageContext.id,
            pose: {
                position: new Vec3(
                    imageContext.pose?.transform.position.x,
                    imageContext.pose?.transform.position.y,
                    imageContext.pose?.transform.position.z,
                ),
                rotation: new Quat(
                    imageContext.pose?.transform.orientation.x,
                    imageContext.pose?.transform.orientation.y,
                    imageContext.pose?.transform.orientation.z,
                    imageContext.pose?.transform.orientation.w,
                ),
            },
            libIndex: imageContext.id,
            trackingState: ARTrackingState.TRACKING,
            extent: new Size(imageContext.realWorldWidth, imageContext.realWorldWidth * imageContext.ratio),
        };
        return image;
    }
}
