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

import { _decorator } from 'cc';
import { ARFace } from '../utils/ar-defines';
import { FactorType } from '../utils/ar-enum';
import { ARFactorBase } from './factor-base';

const { ccclass, property } = _decorator;

@ccclass('cc.ARFaceTrackingContent')
export class ARFaceTrackingContent extends ARFactorBase<ARFace> {
    @property({ serializable: true })
    protected _brows = true;
    @property({ serializable: true })
    protected _cheeks = true;
    @property({ serializable: true })
    protected _eyes = true;
    @property({ serializable: true })
    protected _jaw = true;
    @property({ serializable: true })
    protected _lips = true;
    @property({ serializable: true })
    protected _mouth = true;
    @property({ serializable: true })
    protected _face = true;

    constructor (uuid: string) {
        super();
        this.uuid = uuid;
        this.type = FactorType.FACE_CONTENT;
    }

    @property({
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.ar_face_tracking_content.brows',
        })
    set brows (val) {
        if (val === this._brows) {
            return;
        }
        this._brows = val;
        this.updateListener(val);
    }
    get brows () {
        return this._brows;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.ar_face_tracking_content.cheeks',
        })
    set cheeks (val) {
        if (val === this._cheeks) {
            return;
        }
        this._cheeks = val;
        this.updateListener(val);
    }
    get cheeks () {
        return this._cheeks;
    }

    @property({
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.ar_face_tracking_content.eyes',
        })
    set eyes (val) {
        if (val === this._eyes) {
            return;
        }
        this._eyes = val;
        this.updateListener(val);
    }
    get eyes () {
        return this._eyes;
    }

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.ar_face_tracking_content.jaw',
        })
    set jaw (val) {
        if (val === this._jaw) {
            return;
        }
        this._jaw = val;
        this.updateListener(val);
    }
    get jaw () {
        return this._jaw;
    }

    @property({ displayOrder: 5})
    set lips (val) {
        if (val === this._lips) {
            return;
        }
        this._lips = val;
        this.updateListener(val);
    }
    get lips () {
        return this._lips;
    }

    @property({ displayOrder: 6})
    set mouth (val) {
        if (val === this._mouth) {
            return;
        }
        this._mouth = val;
        this.updateListener(val);
    }
    get mouth () {
        return this._mouth;
    }

    @property({ displayOrder: 7})
    set face (val) {
        if (val === this._face) {
            return;
        }
        this._face = val;
        this.updateListener(val);
    }
    get face () {
        return this._face;
    }

    public match (trackable: ARFace): boolean {
        return true;
    }

    public reset () {
        this.brows = true;
        this.cheeks = true;
        this.eyes = true;
        this.jaw = true;
        this.lips = true;
        this.mouth = true;
        this.face = true;
    }
}
