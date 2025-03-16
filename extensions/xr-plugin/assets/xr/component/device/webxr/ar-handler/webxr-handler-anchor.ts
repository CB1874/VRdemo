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

import { Quat, Vec3 } from 'cc';
import { ARHandlerAnchor } from '../../ar-base/ar-handler-base';
import { ARAnchor, ARTrackingState } from '../../../../../ar/component/framework/utils/ar-defines';

interface IWebXRFutureAnchor {
    nativeAnchor?: XRAnchor;
    submitted: boolean;
    resolved: boolean;
    resolve: (xrAnchor: ARAnchor) => void;
    reject: (msg?: string) => void;
    xrTransformation: XRRigidTransform | undefined;
}

export interface IWebXRAnchor {
    id: number;
    anchorPose: XRPose | undefined;
    xrAnchor: XRAnchor;
    remove(): void;
}

export class ARWebXRHandlerAnchor extends ARHandlerAnchor {
    protected _featureName = 'anchors';
    private _enable = true;
    private _anchorId = 1;
    private _detectedAnchors: Array<IWebXRAnchor> = [];
    private _lastFrameDetected: XRAnchorSet = new Set();
    private _futureAnchors: IWebXRFutureAnchor[] = [];
    private _immersiveRefSpace: XRReferenceSpace | null = null;

    public enableAnchor (enable: boolean) {
        this._enable = enable;
    }

    public attachFeatureSessionInit (): Promise<XRSessionInit> {
        return Promise.resolve({
            optionalFeatures: [this._featureName],
        });
    }

    public process (frame: XRFrame, immersiveRefSpace: XRReferenceSpace) {
        if (!this._feature || !this._feature.config?.enable || !frame) {
            return;
        }
        this._immersiveRefSpace = immersiveRefSpace;

        const trackedAnchors = frame.trackedAnchors;

        const removedAnchors: ARAnchor[] = [];
        const addedAnchors: ARAnchor[] = [];
        const updatedAnchors: ARAnchor[] = [];
        if (trackedAnchors) {
            for (let index = 0; index < this._detectedAnchors.length; index++) {
                const anchorContext = this._detectedAnchors[index];
                if (!trackedAnchors.has(anchorContext.xrAnchor)) {
                    this._detectedAnchors.splice(index--, 1);

                    console.debug(`anchor was removed, id=${anchorContext.id}`);
                    const anchor: ARAnchor = this._updateAnchorWithXRAnchor(anchorContext);
                    anchor.trackingState = ARTrackingState.STOPPED;
                    removedAnchors.push(anchor);
                }
            }

            trackedAnchors.forEach((xrAnchor) => {
                if (!this._lastFrameDetected.has(xrAnchor)) {
                    const anchorPose = frame.getPose(xrAnchor.anchorSpace, immersiveRefSpace);
                    const anchorContext: IWebXRAnchor  = {
                        id: this._anchorId,
                        anchorPose,
                        xrAnchor,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        remove: () => xrAnchor.delete(),
                    };
                    this._detectedAnchors.push(anchorContext);

                    const anchor: ARAnchor = this._updateAnchorWithXRAnchor(anchorContext);
                    console.debug(`New plane detected, id=${anchorContext.id}`);
                    addedAnchors.push(anchor);

                    const results = this._futureAnchors.filter((futureAnchor) => futureAnchor.nativeAnchor === xrAnchor);
                    const result = results[0];
                    if (result) {
                        result.resolve(anchor);
                        result.resolved = true;
                    }

                    this._anchorId++;
                } else {
                    const index = this._findIndexInAnchorArray(xrAnchor);
                    const anchorContext = this._detectedAnchors[index];
                    if (anchorContext) {
                        const anchorPose = frame.getPose(xrAnchor.anchorSpace, immersiveRefSpace);
                        anchorContext.anchorPose = anchorPose;

                        const anchor = this._updateAnchorWithXRAnchor(anchorContext);
                        updatedAnchors.push(anchor);
                    }
                }
            });
            this._lastFrameDetected = trackedAnchors;

            if (removedAnchors.length > 0) {
                this._feature.onRemoveTracking(removedAnchors);
            }
            if (addedAnchors.length > 0) {
                this._feature.onAddTracking(addedAnchors);
            }
            if (updatedAnchors.length > 0) {
                this._feature.onUpdateTracking(updatedAnchors);
            }
        }

        this._futureAnchors.forEach((futureAnchor) => {
            if (!futureAnchor.resolved && !futureAnchor.submitted && futureAnchor.xrTransformation) {
                this._createAnchorByTransformation(futureAnchor.xrTransformation, frame)?.then(
                    (nativeAnchor) => {
                        futureAnchor.nativeAnchor = nativeAnchor;
                    },
                    (error) => {
                        futureAnchor.resolved = true;
                        futureAnchor.reject(error);
                    },
                );
                futureAnchor.submitted = true;
            }
        });
    }

    private _findIndexInAnchorArray (xrAnchor: XRAnchor) {
        for (let i = 0; i < this._detectedAnchors.length; ++i) {
            if (this._detectedAnchors[i].xrAnchor === xrAnchor) {
                return i;
            }
        }
        return -1;
    }

    private _updateAnchorWithXRAnchor (anchorContext: IWebXRAnchor): ARAnchor {
        const anchor: ARAnchor = {
            id: anchorContext.id,
            pose: {
                position: new Vec3(
                    anchorContext.anchorPose?.transform.position.x,
                    anchorContext.anchorPose?.transform.position.y,
                    anchorContext.anchorPose?.transform.position.z,
                ),
                rotation: new Quat(
                    anchorContext.anchorPose?.transform.orientation.x,
                    anchorContext.anchorPose?.transform.orientation.y,
                    anchorContext.anchorPose?.transform.orientation.z,
                    anchorContext.anchorPose?.transform.orientation.w,
                ),
            },
            trackingState: ARTrackingState.TRACKING,
        };
        return anchor;
    }

    private _createAnchorByTransformation (xrTransformation: XRRigidTransform, frame: XRFrame) {
        if (frame.createAnchor && this._immersiveRefSpace) {
            try {
                // let anchorPose = new XRRigidTransform(
                //     {x: 0, y: 0, z: -1},
                //     {x: 0, y: 0, z: 0, w: 1});
                return frame.createAnchor(xrTransformation, this._immersiveRefSpace);
            } catch (e: any) {
                throw new Error(e);
            }
        } else {
            throw new Error('createAnchor are not enabled !');
        }
    }

    public tryHitTest (xrTransformation: XRRigidTransform | undefined): Promise<ARAnchor>  {
        return new Promise<ARAnchor>((resolve, reject) => {
            this._futureAnchors.push({
                nativeAnchor: undefined,
                resolved: false,
                submitted: false,
                xrTransformation,
                resolve,
                reject,
            });
        });
    }
}
