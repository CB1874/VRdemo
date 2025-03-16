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

import { _decorator, Node, assetManager, RenderRoot2D, Sprite, SpriteFrame, Vec3, UITransform, Size, CCObject, director } from 'cc';
import { EDITOR } from 'cc/env';
import { ARActionUpdateBase, ARActionBase } from '../framework/actions/action-base';
import { ARAlignment } from '../framework/actions/alignment';
import { ARDisplayChildren } from '../framework/actions/display-children';
import { ARImageSource } from '../framework/factors/image-source';
import { ARActionData, ImageFeatureEventParam } from '../framework/utils/ar-defines';
import { ActionType, ARPropType, FactorType, ARTrackingType } from '../framework/utils/ar-enum';
import { arEvent } from '../framework/utils/ar-event';
import { ARTrackingBase } from './ar-tracking-base';
import { ARTrackEvent } from '../framework/actions/track-event';
import { ARSurfaceOverlay } from '../framework/actions/surface-overlay';
import { ARFallback } from '../framework/actions/fall-back';

const { ccclass, property, help, menu, executeInEditMode } = _decorator;
declare const cce: any;

/**
 * @en
 * AR image tracking feature components
 * @zh
 * AR图像追踪特性组件
 */
@ccclass('cc.ARImageTracking')
@help('i18n:cc.ARImageTracking')
@menu('XR/AR Tracking/ARImageTracking')
@executeInEditMode
export class ARImageTracking extends ARTrackingBase {
    @property({ serializable: true })
    protected _enableNativeFallBack = true;

    @property({ serializable: true })
    protected _enableWebFallBack = true;

    @property({ serializable: true})
    protected _imageSource: ARImageSource | null = null;

    @property({ serializable: true})
    protected _display: ARActionBase<ARActionData> | null = null;

    @property({ serializable: true})
    protected _alignment: ARActionUpdateBase | null = null;

    @property({ serializable: true})
    protected _surfaceOverlay: ARActionBase<ARActionData> | null = null;

    @property({ serializable: true})
    protected _fallback: ARActionBase<ARActionData> | null = null;

    private _sceneImage: Node | null = null;

    @property({
        type: ARTrackingType,
        displayOrder: 1,
        readonly: true,
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
        displayName: "Enable auto fallback in Native",
        tooltip: 'i18n:xr-plugin.tracking.enableNativeFallBack',
        })
    set enableNativeFallBack (val) {
        if (val === this._enableNativeFallBack) {
            return;
        }
        this._enableNativeFallBack = val;
        this.updateFeature(true);
    }
    get enableNativeFallBack () {
        return this._enableNativeFallBack;
    }

    @property({
        displayOrder: 1,
        displayName: "Adaptive enable 3rd AR Library in Web",
        tooltip: 'i18n:xr-plugin.tracking.enableWebFallBack',
        })
    set enableWebFallBack (val) {
        if (val === this._enableWebFallBack) {
            return;
        }
        this._enableWebFallBack = val;
        this.updateFeature(true);
    }
    get enableWebFallBack () {
        return this._enableWebFallBack;
    }

    @property({
        displayOrder: 5,
        group: { name: 'Factor', displayOrder: 1},
        visible: (function (this: ARImageTracking) {
            return this.imageSource !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.imageSource',
        })
    set imageSource (val) {
        if (val === this._imageSource) {
            return;
        }
        this._imageSource = val;
        this.updateSceneImage();
    }
    get imageSource () {
        return this._imageSource;
    }

    @property({
        displayOrder: 6,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARImageTracking) {
            return this.display !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.display',
        })
    set display (val) {
        if (val) {
            const display = val as ARDisplayChildren;
            if (this._alignment) {
                this._alignment.closeTracking = display.stopTracking;
            }
        }
        if (val === this._display) {
            return;
        }
        this._display = val;
    }
    get display () {
        return this._display;
    }

    @property({
        displayOrder: 7,
        displayName: "Align",
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARImageTracking) {
            return this.alignment !== null;
            }),
        tooltip: 'i18n:xr-plugin.tracking.alignment',
        })
    set alignment (val) {
        if (val === this._alignment) {
            return;
        }
        this._alignment = val;
        if (this._alignment && this._display) {
            this._alignment.closeTracking = (this._display as ARDisplayChildren).stopTracking;
        }
    }
    get alignment () {
        return this._alignment;
    }

    @property({
        displayOrder: 8,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARImageTracking) {
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
        displayOrder: 9,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARImageTracking) {
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
        displayOrder: 10,
        group: { name: 'Action', displayOrder: 2},
        visible: (function (this: ARImageTracking) {
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
            this.addMenuFactor(FactorType.IMAGE_SOURCE);

            this.addMenuAction(ActionType.DISPLAY_CHILDREN);
            this.addMenuAction(ActionType.TRACK_EVENT);
            this.addMenuAction(ActionType.SURFACE_OVERLAY);
            this.addMenuAction(ActionType.ALIGNMENT);
            this.addMenuAction(ActionType.FALLBACK);

            if (!this.initialized) {
                this.initialized = true;
                this.trackingType = ARTrackingType.Image;
                if (!this.imageSource) {
                    this.imageSource = new ARImageSource(this.node.uuid);
                }
                if (!this.display) {
                    this.display = new ARDisplayChildren();
                }
                if (!this.alignment) {
                    this.alignment = new ARAlignment();
                }
                this.addFactor(this.imageSource);
                this.addAction(this.display);
                this.addAction(this.alignment);
            }
        }

        if (this.imageSource) {
            this.imageSource.uuid = this.node.uuid;
            this.imageSource.registerImageAssetsChange();
        }
        this.createSceneImage();
    }

    onDestroy () {
        super.onDestroy();
        this.removeSceneImage();
    }

    private removeSceneImage () {
        this._sceneImage = this.node.getChildByName('__scene_image__');
        if (this._sceneImage && this._sceneImage.isValid) {
            this._sceneImage.parent = null;
            this._sceneImage.destroy();
            this._sceneImage = null;
        }
    }

    private createSceneImage () {
        this.removeSceneImage();
        if (EDITOR) {
            assetManager.loadAny({ uuid: '255e67f3-b91b-4568-8843-b0075f513f73' }, (err, assets) => {
                this.removeSceneImage();
                this._sceneImage = new Node('__scene_image__');
                this.node.addChild(this._sceneImage);
                this._sceneImage.eulerAngles = new Vec3(-90, 0, 0);

                this._sceneImage.addComponent(RenderRoot2D);
                const sprite = this._sceneImage.addComponent(Sprite);
                assetManager.loadAny({ uuid: 'fa235423-e2f5-491b-8972-ec0e98225f5b' }, (err, mat) => {
                    sprite.customMaterial = mat;
                });
                sprite.spriteFrame = SpriteFrame.createWithImage(assets);
                this._sceneImage._objFlags |= CCObject.Flags.HideInHierarchy;

                const tf = this._sceneImage.getComponent(UITransform)!;
                tf.contentSize = new Size(0.15, 0.15);

                this.updateSceneImage();
            });
        }
    }

    private updateSceneImage () {
        const imageEffect = () => {
            if (this._imageSource) {
                const images = this._imageSource.getImageAssets();
                const image = images.length <= 0 ? null : images[0].imageAsset;
                const uuid = images.length <= 0 ? '255e67f3-b91b-4568-8843-b0075f513f73' : images[0].imageAsset._uuid;
                assetManager.loadAny({ uuid }, (err, assets) => {
                    if (this._sceneImage && this._imageSource) {
                        const sprite = this._sceneImage.getComponent(Sprite)!;
                        sprite.spriteFrame = SpriteFrame.createWithImage(assets);
                        const tf = this._sceneImage.getComponent(UITransform)!;
                        if (image) {
                            tf.contentSize = this._imageSource.getImageAssetsSize(image._uuid);
                        } else {
                            tf.contentSize = new Size(0.15, 0.15);
                        }
                    }
                });
            }
        };

        if (this._sceneImage) {
            if (this._imageSource) {
                this._imageSource.removeListener();
                this._imageSource.addListener((event: any) => {
                    imageEffect();
                });
                imageEffect();
            } else {
                assetManager.loadAny({ uuid: '255e67f3-b91b-4568-8843-b0075f513f73' }, (err, assets) => {
                    if (this._sceneImage) {
                        const sprite = this._sceneImage.getComponent(Sprite)!;
                        sprite.spriteFrame = SpriteFrame.createWithImage(assets);

                        const tf = this._sceneImage.getComponent(UITransform)!;
                        tf.contentSize = new Size(0.15, 0.15);
                    }
                });
            }
        }
    }

    public updateFeature (canUse: boolean) {
        const param: ImageFeatureEventParam = {
            ft: this.trackingType,
            uuid: this.node.uuid,
            canUse,
            tracking: this,
            images: this.imageSource ? this.imageSource.getImageAssets() : [],
            enableNativeFallBack: this.enableNativeFallBack,
            enableWebFallBack: this.enableWebFallBack,
        };
        arEvent.collectFeature(param);
    }

    public addProp (args0: any, args1: any): void {
        if (args0 === ARPropType.Factor) {
            switch (args1) {
            case FactorType.IMAGE_SOURCE:
                this.imageSource = new ARImageSource(this.node.uuid);
                this.addFactor(this.imageSource);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.DISPLAY_CHILDREN:
                this.display = new ARDisplayChildren();
                this.addAction(this.display);
                break;
            case ActionType.ALIGNMENT:
                this.alignment = new ARAlignment();
                this.addAction(this.alignment);
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent = new ARTrackEvent();
                this.addAction(this.trackEvent);
                break;
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay = new ARSurfaceOverlay();
                this.addAction(this.surfaceOverlay);
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
            case FactorType.IMAGE_SOURCE:
                this.imageSource = null;
                this.removeFactor(args1);
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.DISPLAY_CHILDREN:
                this.display = null;
                this.removeAction(args1);
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent = null;
                this.removeAction(args1);
                break;
            case ActionType.ALIGNMENT:
                this.alignment = null;
                this.removeAction(args1);
                break;
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay = null;
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
            case FactorType.IMAGE_SOURCE:
                this.imageSource?.reset();
                break;
            default:
                break;
            }
        } else {
            switch (args1) {
            case ActionType.DISPLAY_CHILDREN:
                this.display?.reset();
                break;
            case ActionType.TRACK_EVENT:
                this.trackEvent?.reset();
                break;
            case ActionType.ALIGNMENT:
                this.alignment?.reset();
                break;
            case ActionType.SURFACE_OVERLAY:
                this.surfaceOverlay?.reset();
                break;
            case ActionType.FALLBACK:
                this.fallback?.reset();
                break;
            default:
                break;
            }
        }
    }

    public updateImageSourceProp (args0: any,  args1: any): void {
        if (this.imageSource) {
            this.imageSource.updateImageAssets(parseInt(args0), args1);

            cce.Engine.repaintInEditMode();
        }
    }
}
