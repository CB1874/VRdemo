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

import { assetManager, ImageAsset, Size, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
import { ARSession } from '../../ar-session';
import { ARImage, ARImageAsset, ImageFeatureEventParam } from '../utils/ar-defines';
import { FactorType, ARTrackingType } from '../utils/ar-enum';
import { arEvent } from '../utils/ar-event';
import { ARFactorBase } from './factor-base';
import { ARFactorEvent } from './factor-event';

const BASE_SIZE = 0.15;
const { ccclass, property } = _decorator;

@ccclass('cc.ARImageSetItem')
export class ARImageSetItem extends ARFactorEvent {
    @property({serializable: true})
    public _image: ImageAsset | null = null;

    @property({serializable: true})
    public _enablePhysicalSize = true;

    @property({serializable: true})
    public _imagePhysicalSize: Size = new Size(0, 0);

    @property({serializable: true, visible: false})
    private _imageSize: Size | null = null;

    @property({
        type: ImageAsset,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.factor.image_source.image_set_item.image',
        })
    set image (val) {
        if (val === this._image) {
            return;
        }
        this._image = val;
        if (val) {
            const min = Math.min(val.width, val.height);
            const max = Math.max(val.width, val.height);
            const v = BASE_SIZE * (min / max);
            this._imageSize = val.width > val.height ? new Size(BASE_SIZE, v) : new Size(v, BASE_SIZE);
            this.imagePhysicalSize = this._imageSize.clone();
        } else {
            this.imagePhysicalSize = new Size(0, 0);
            this._imageSize = null;
        }
        this.updateListener(val);
    }
    get image () {
        return this._image;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.factor.image_source.image_set_item.enablePhysicalSize',
        })
    set enablePhysicalSize (val) {
        if (val === this._enablePhysicalSize) {
            return;
        }
        this._enablePhysicalSize = val;
        this.updateListener(val);
    }
    get enablePhysicalSize () {
        return this._enablePhysicalSize;
    }

    @property({
        type: Size,
        displayOrder: 3,
        visible: (function (this: ARImageSetItem) {
            return this.enablePhysicalSize;
            }),
        tooltip: 'i18n:xr-plugin.factor.image_source.image_set_item.imagePhysicalSize',
        })
    set imagePhysicalSize (val) {
        if (val === this._imagePhysicalSize) {
            return;
        }

        if (this._imageSize && this._imageSize.width > 0 && (val.width !== this._imagePhysicalSize.width)) {
            const s = val.width / this._imageSize.width;
            val.height = s * this._imageSize.height;
        }

        if (this._imageSize && this._imageSize.height > 0 && (val.height !== this._imagePhysicalSize.height)) {
            const s = val.height / this._imageSize.height;
            val.width = s * this._imageSize.width;
        }
        this._imagePhysicalSize = val;
        this.updateListener(val);
    }
    get imagePhysicalSize () {
        return this._imagePhysicalSize;
    }
}

@ccclass('cc.ARImageSource')
export class ARImageSource extends ARFactorBase<ARImage> {
    @property({ serializable: true })
    protected _imageSource: Array<ARImageSetItem> = [];

    constructor (uuid: string) {
        super();
        this.uuid = uuid;
        this.type = FactorType.IMAGE_SOURCE;
    }

    @property({
        type: [ARImageSetItem],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.factor.image_source.imageSource',
        })
    set imageSource (val) {
        if (val === this._imageSource) {
            return;
        }
        this._imageSource = val;
        this.registerImageAssetsChange();
        this.collectImageAssets();

        this.updateListener(val);
    }
    get imageSource () {
        return this._imageSource;
    }

    public registerImageAssetsChange () {
        this._imageSource.forEach((element) => {
            element.removeListener();
            element.addListener((image) => {
                this.collectImageAssets();
            });
        });
    }

    public getImageAssets (): ARImageAsset[] {
        const assets: ARImageAsset[] = [];
        if (this._imageSource) {
            this._imageSource.forEach((element) => {
                if (element && element.image) {
                    assets.push({
                        imageAsset: element.image,
                        widthInMeters: element.enablePhysicalSize ? element.imagePhysicalSize.x : 0,
                        heightInMeters: element.enablePhysicalSize ? element.imagePhysicalSize.y : 0,
                    });
                }
            });
        }
        return assets;
    }

    public getImageAssetsSize (uuid: string): Size {
        if (this._imageSource) {
            for (let index = 0; index < this._imageSource.length; index++) {
                const element = this._imageSource[index];
                if (element && element.image && element.image._uuid === uuid) {
                    return element.imagePhysicalSize;
                }
            }
        }
        return new Size(0, 0);
    }

    public updateImageAssets (index: number, uuid: string) {
        if (this._imageSource) {
            this._imageSource.forEach((element, idx) => {
                if (element && index === idx) {
                    assetManager.loadAny({ uuid }, (err, assets) => {
                        element.image = assets;
                    });
                }
            });
        }
    }

    private collectImageAssets () {
        if (EDITOR) {
            const param: ImageFeatureEventParam = {
                ft: ARTrackingType.Image,
                uuid: this.uuid,
                canUse: true,
                images: this.getImageAssets(),
            };
            arEvent.collectFeature(param);

            this.updateListener(null);
        }
    }

    public match (trackable: ARImage): boolean {
        for (let index = 0; index < this._imageSource.length; index++) {
            const item: ARImageSetItem = this._imageSource[index];
            if (item.image) {
                const imageId = ARSession.getSession()?.manager?.configuration.getImageAssetsIndex(this.uuid, item.image.nativeUrl);
                if (imageId === trackable.libIndex) {
                    return true;
                }
            }
        }
        return false;
    }

    public reset () {
        this.imageSource = [];
    }
}
