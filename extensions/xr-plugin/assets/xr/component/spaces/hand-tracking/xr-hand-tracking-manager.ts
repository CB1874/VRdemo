/*
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

import { _decorator, Component, Node, sys } from 'cc';
import { XRSpacesConfigKey, XRSpacesFeatureManager, XRSpacesFeatureType } from '../xr-spaces-feature-manager';
import { XRHand, XRHandData, XRHandGestureData } from './xr-hand';

const { ccclass, menu, executionOrder, property } = _decorator;

declare const xr: any;

type onHandChanged = (data: XRHandData) => void;

@ccclass('cc.spaces.XRHandTrackingManager')
@executionOrder(-1)
@menu('hidden:XR/Spaces/XRHandTrackingManager')
export class XRHandTrackingManager extends XRSpacesFeatureManager {
    private _leftHandData: XRHandData = new XRHandData();
    private _rightHandData: XRHandData = new XRHandData();

    private _onHandChanged: onHandChanged | null = null;

    get leftHandData (): XRHandData {
        return this._leftHandData;
    }

    get rightHandData (): XRHandData {
        return this._rightHandData;
    }

    protected onStart (): void {
        if (sys.isXR) {
            this._leftHandData.internalIndex = 0;
            this._rightHandData.internalIndex = 1;
            xr.entry.setXRIntConfig(XRSpacesConfigKey.HAND_TRACKING, 1);
            console.log('[XRHandTrackingManager] onStart');
        }
    }

    protected onStop (): void {
        if (sys.isXR) {
            xr.entry.setXRIntConfig(XRSpacesConfigKey.HAND_TRACKING, 0);
            console.log('[XRHandTrackingManager] onStop');
        }
    }

    public getFeatureType (): XRSpacesFeatureType {
        return XRSpacesFeatureType.HAND_TRACKING;
    }

    protected onRetrieveChanges (deltaTime: number): void {
        if (sys.isXR) {
            const handTrackingData: string = xr.entry.getXRStringConfig(XRSpacesConfigKey.HAND_TRACKING_DATA);
            if (handTrackingData.length > 0) {
                const datas: string[] = handTrackingData.split('&');
                if (datas.length > 0) {
                    // hand joint data
                    this._leftHandData.praseData(datas[0]);
                    this._rightHandData.praseData(datas[1]);
                    // hand gesture data
                    this._leftHandData.gestureData.praseData(datas[2]);
                    this._rightHandData.gestureData.praseData(datas[3]);

                    if (this._onHandChanged) {
                        this._onHandChanged(this._leftHandData);
                        this._onHandChanged(this._rightHandData);
                    }
                }
            }
        }
    }

    public setHandChangedCallback (callback: onHandChanged) {
        this._onHandChanged = callback;
    }
}
