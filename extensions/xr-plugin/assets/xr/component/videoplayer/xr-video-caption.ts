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

import { _decorator, Component, Asset, ccenum, assetManager } from 'cc';
import { SubtitleData, XRVideoPlayer } from './xr-video-player';

const { ccclass, property, menu } = _decorator;

export enum CaptionSourceType {
    REMOTE,
    LOCAL
}
ccenum(CaptionSourceType);

@ccclass('cc.XRVideoCaption')
@menu('XR/Extra/XRVideoCaption')
export class XRVideoCaption extends Component {
    @property
    private _resourceType: CaptionSourceType = CaptionSourceType.LOCAL;
    @property
    protected _remoteURL = '';

    @property({ displayName: 'Caption Source Type', type: CaptionSourceType, tooltip: 'i18n:xr-plugin.videoplayer.captionSourceType' })
    get resourceType () {
        return this._resourceType;
    }
    set resourceType (val) {
        if (this._resourceType !== val) {
            this._resourceType = val;
        }
    }

    @property({
        tooltip: 'i18n:xr-plugin.videoplayer.captionRemoteURL',
        visible: (function (this: XRVideoCaption) {
            return this.resourceType === CaptionSourceType.REMOTE;
            })
        })
    get remoteURL () {
        return this._remoteURL;
    }
    set remoteURL (val: string) {
        if (this._remoteURL !== val) {
            this._remoteURL = val;
            this.loadRemoteFile();
        }
    }

    @property({
        tooltip: 'i18n:xr-plugin.videoplayer.captionFile',
        type: Asset, displayName: 'Caption File', visible: (function (this: XRVideoCaption) {
            return this.resourceType === CaptionSourceType.LOCAL;
            })
        })
    protected _file: Asset | null = null;
    get captionFile () {
        return this._file;
    }
    set captionFile (val) {
        if (this._file !== val) {
            this._file = val;
            this.loadLocalFile();
        }
    }

    @property({
        tooltip: 'i18n:xr-plugin.videoplayer.videoPlayer',
        type: XRVideoPlayer,
        })
    public videoPlayer: XRVideoPlayer | null = null

    start () {
        if (this.resourceType === CaptionSourceType.LOCAL) {
            this.loadLocalFile();
        } else {
            this.loadRemoteFile();
        }
    }

    loadLocalFile (): void {
        if (this._file) {
            const content = this._file._nativeAsset as string;
            this.asyncParseContent(content);
        }
    }

    loadRemoteFile (): void {
        if (this._remoteURL.length > 0) {
            assetManager.downloader.register('.srt', (url, options, onComplete) => {
                assetManager.downloader.downloadFile(url, { priority: 0, xhrResponseType: 'arraybuffer' }, (loaded: number, total: number) => {
                    console.log(`download file progress : ${loaded}/${total}`);
                }, onComplete);
            });
            assetManager.parser.register('.srt', (file, options, onComplete) => {
                onComplete(null, file);
            });

            assetManager.loadRemote<Asset>(this.remoteURL, (err: Error, data: Asset) => {
                if (err) {
                    console.log(`loadRemote srt failed !!!${err.message}`);
                    return;
                }

                if (data._nativeAsset.toString() === '[object ArrayBuffer]') {
                    const bufferData: ArrayBuffer = data._nativeAsset as ArrayBuffer;
                    const res: string = String.fromCharCode.apply(null, Array.from(new Uint16Array(bufferData)));
                    this.asyncParseContent(res);
                }
            });
        }
    }

    asyncParseContent (content: string): void {
        const asyncLoad: Promise<Array<SubtitleData>> = new Promise<Array<SubtitleData>>((resolve, reject) => {
            const data: Array<SubtitleData> = this.parseSubtitleContent(content);
            if (data.length > 0) {
                if (resolve) {
                    resolve(data);
                }
            } else if (reject) {
                reject(new Array<SubtitleData>());
            }
        });
        asyncLoad.then((data) => {
            if (this.videoPlayer) {
                this.videoPlayer.subtitleData = data;
            }
        }).catch((error) => {
            console.error(`promise reject : ${error}`);
        });
    }

    parseSubtitleContent (content: string): Array<SubtitleData> {
        const array: string[] = this.tryParse(content);
        const items: Array<SubtitleData> = [];
        for (let i = 0; i < array.length; i += 4) {
            const startTime = this.doCorrectFormat(array[i + 1].trim());
            const endTime = this.doCorrectFormat(array[i + 2].trim());
            const new_line: SubtitleData = {
                id: array[i].trim(),
                startTime,
                startSeconds: this._timestampToSeconds(startTime),
                endTime,
                endSeconds: this._timestampToSeconds(endTime),
                text: array[i + 3].trim(),
            };
            items.push(new_line);
        }
        return items;
    }

    private tryParse (data: string): string[] {
        data = data.replace(/\r/g, '');
        const regex =            /(\d+)\n(\d{1,2}:\d{2}:\d{2},\d{1,3}) --> (\d{1,2}:\d{2}:\d{2},\d{1,3})/g;
        const data_array = data.split(regex);
        data_array.shift(); // remove first '' in array
        return data_array;
    }

    private doCorrectFormat (time: string): string {
        // Fix the format if the format is wrong
        // 00:00:28.9670 Become 00:00:28,967
        // 00:00:28.967  Become 00:00:28,967
        // 00:00:28.96   Become 00:00:28,960
        // 00:00:28.9    Become 00:00:28,900

        // 00:00:28,96   Become 00:00:28,960
        // 00:00:28,9    Become 00:00:28,900
        // 00:00:28,0    Become 00:00:28,000
        // 00:00:28,01   Become 00:00:28,010
        // 0:00:10,500   Become 00:00:10,500
        const str = time.replace('.', ',');

        let hour = '';
        let minute = '';
        let second = '';
        let millisecond = '';

        // Handle millisecond
        const [front, ms] = str.split(',');
        millisecond = this._fixedStrDigit(3, ms);

        // Handle hour
        const [a_hour, a_minute, a_second] = front.split(':');
        hour = this._fixedStrDigit(2, a_hour, false);
        minute = this._fixedStrDigit(2, a_minute, false);
        second = this._fixedStrDigit(2, a_second, false);

        return `${hour}:${minute}:${second},${millisecond}`;
    }

    /*
    // make sure string is 'how_many_digit' long
    // if str is shorter than how_many_digit, pad with 0
    // if str is longer than how_many_digit, slice from the beginning
    // Example:
    Input: fixed_str_digit(3, '100')
    Output: 100
    Explain: unchanged, because "100" is 3 digit
    Input: fixed_str_digit(3, '50')
    Output: 500
    Explain: pad end with 0
    Input: fixed_str_digit(3, '50', false)
    Output: 050
    Explain: pad start with 0
    Input: fixed_str_digit(3, '7771')
    Output: 777
    Explain: slice from beginning
    */
    private _fixedStrDigit (how_many_digit: number, str: string, padEnd = true) {
        if (str.length > how_many_digit) {
            str = str.slice(0, how_many_digit);
        }
        if (str.length < how_many_digit) {
            if (padEnd) {
                for (let i = 0; i < how_many_digit; i++) {
                    str += '0';
                }
            } else {
                for (let i = 0; i < how_many_digit; i++) {
                    str = `0${str}`;
                }
            }
        }

        return str;
    }

    private _timestampToSeconds (srtTimestamp: string): number {
        const [rest, millisecondsString] = srtTimestamp.split(',');
        const milliseconds = parseInt(millisecondsString);
        const [hours, minutes, seconds] = rest.split(':').map((x) => parseInt(x));
        return milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours;
    }
}
