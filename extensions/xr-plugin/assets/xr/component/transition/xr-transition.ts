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

import { _decorator, Component, Node, director, Animation, ccenum, find, instantiate, Prefab, Mask, UITransform, SceneAsset } from 'cc';

const { ccclass, property, menu, help } = _decorator;

/**
 * @en The type for mask.
 *
 * @zh 遮罩组件类型。
 */
export enum XRMaskType {
    /**
     * @en Rect mask.
     *
     * @zh
     * 使用矩形作为遮罩。
     */
    GRAPHICS_RECT = 0,

    /**
     * @en Ellipse Mask.
     *
     * @zh
     * 使用椭圆作为遮罩。
     */
    GRAPHICS_ELLIPSE = 1
}

/**
 * @en The type for slide.
 *
 * @zh 滑动方向类型。
 */
export enum SlideType {
    SLIDE_IN_BOTTOM = 0,
    SLIDE_IN_TOP = 1,
    SLIDE_IN_LEFT = 2,
    SLIDE_IN_RIGHT = 3,
}

export enum TransitionType {
    LOADING = 0,
    BLINK = 1,
    SLIDE = 2
}

ccenum(TransitionType);

@ccclass('XRTransition')
@help('i18n:cc.ARFaceTracking')
@menu('hidden:XR/Transition/XRTransition')
export class XRTransition extends Component {
    @property({ type: Node })
    public control: Node | null = null;
    @property({ type: Animation })
    public loadingAni: Animation | null = null;
    @property({ type: Animation })
    public blinkAni: Animation | null = null;
    @property({ type: Animation })
    public slinkAni: Animation | null = null;
    @property({ type: Node })
    public progressNode: Node | null = null;
    @property({ type: Prefab })
    public transitionEndRootPrefab: Prefab | null = null;
    @property({ type: Prefab })
    public transitionEndPrefab: Prefab | null = null;

    private _transitionType: TransitionType = TransitionType.LOADING;
    private _maskType = XRMaskType.GRAPHICS_ELLIPSE;
    private _slideType = SlideType.SLIDE_IN_BOTTOM;
    private _progress: UITransform | null = null;

    private _setBlinkMaskType (type) {
        this._maskType = type;
        if (this.blinkAni) {
            this.blinkAni.node.getComponent(Mask)!.type = type;
        }
    }

    private _setslideType (type) {
        this._slideType = type;
        if (this.slinkAni) {
            this.slinkAni.defaultClip = this.slinkAni.clips[type];
        }
    }

    private _playAni (type) {
        this._transitionType = type;
        switch (this._transitionType) {
        case TransitionType.LOADING:
            if (this.blinkAni) {
                this.blinkAni.node.active = false;
            }
            if (this.slinkAni) {
                this.slinkAni.node.active = false;
            }
            if (this.progressNode) {
                this.progressNode.active = true;
                const comp = this.progressNode.getChildByName('bg')?._uiProps?.uiTransformComp;
                if (comp) {
                    this._progress = comp;
                }
            }
            if (this.loadingAni) {
                this.loadingAni.play('loadingAppearAni');
                this.loadingAni.on(Animation.EventType.FINISHED, this._loadingBounceAni, this);
            }
            break;
        case TransitionType.BLINK:
            if (this.loadingAni) {
                this.loadingAni.node.active = false;
            }
            if (this.slinkAni) {
                this.slinkAni.node.active = false;
            }
            this.blinkAni?.play();
            break;
        case TransitionType.SLIDE:
            if (this.loadingAni) {
                this.loadingAni.node.active = false;
            }
            if (this.blinkAni) {
                this.blinkAni.node.active = false;
            }
            this.slinkAni?.play();
            break;
        default:
            break;
        }
    }

    private _loadingBounceAni () {
        this.loadingAni?.play('loadingBounceAni');
    }

    public transitionStart (maskType, transitionType, slideType) {
        // Set the transition type
        this._setBlinkMaskType(maskType);
        // Set slide type
        this._setslideType(slideType);
        // Open transition node
        if (this.control) {
            this.control.active = true;
        }
        // Play start animation
        this._playAni(transitionType);
    }

    public transitionProgress (num) {
        switch (this._transitionType) {
        case TransitionType.LOADING:
            if (this.progressNode?._uiProps.uiTransformComp && this._progress) {
                const width = Math.round(this.progressNode._uiProps.uiTransformComp.width * num);
                this._progress.width = this._progress.width > width ? this._progress.width : width;
            }
            break;
        case TransitionType.BLINK:
        case TransitionType.SLIDE:
            break;
        default:
            break;
        }
    }

    private _createTransitionEnd (transitionEnd, transitionEndRoot, prefabName: string) {
        const canvas = find('Canvas');
        let end: Node | null = null;
        if (canvas) {
            if (transitionEnd) {
                const endNode = instantiate(transitionEnd) as Node;
                canvas.addChild(endNode);
                end = endNode.getChildByName(prefabName);
            }
        } else if (transitionEndRoot) {
            const endNode = instantiate(transitionEndRoot) as Node;
            director.getScene()?.addChild(endNode);
            end = endNode.getChildByPath(`TransitionEnd/${prefabName}`);
        }
        return end;
    }

    private _playTransitionEnd (transitionType, transitionEnd, transitionEndRoot, maskType, slideType) {
        switch (transitionType) {
        case TransitionType.LOADING:
            {
                const loadingEnd = this._createTransitionEnd(transitionEnd, transitionEndRoot, 'loadingEnd');
                if (loadingEnd) {
                    loadingEnd.active = true;
                }
            }
            break;
        case TransitionType.BLINK:
            {
                const blinkEnd = this._createTransitionEnd(transitionEnd, transitionEndRoot, 'blinkEnd');
                if (blinkEnd) {
                    blinkEnd.active = true;
                    const mask = blinkEnd.getComponent(Mask);
                    if (mask) {
                        mask.type = Number(maskType);
                    }
                }
            }
            break;
        case TransitionType.SLIDE:
            {
                const slideEnd = this._createTransitionEnd(transitionEnd, transitionEndRoot, 'slideEnd');
                if (slideEnd) {
                    slideEnd.active = true;
                    const ani = slideEnd.getComponent(Animation);
                    if (ani) {
                        ani.defaultClip = ani.clips[slideType];
                    }
                }
            }
            break;
        default:
            break;
        }
    }

    public transitionEnd (scene: string | SceneAsset) {
        const transitionType = this._transitionType;
        const maskType = this._maskType;
        const slideType = this._slideType;
        const transitionEnd = this.transitionEndPrefab;
        const transitionEndRoot = this.transitionEndRootPrefab;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        if (scene instanceof SceneAsset) {
            director.runScene(scene, () => { }, () => {
                that._playTransitionEnd(transitionType, transitionEnd, transitionEndRoot, maskType, slideType);
            });
        } else {
            director.loadScene(scene, () => {
                that._playTransitionEnd(transitionType, transitionEnd, transitionEndRoot, maskType, slideType);
            });
        }
    }
}
