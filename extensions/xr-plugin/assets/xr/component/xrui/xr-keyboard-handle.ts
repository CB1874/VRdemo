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

import { Input, XrKeyboardEventType, EventTarget } from 'cc';

export enum XrKeyCode {
    /**
     * @en None
     * @zh 没有分配
     */
    NONE = 0,
    /**
     * @en The back key on mobile phone
     * @zh 移动端返回键
     */
    MOBILE_BACK = 6,
    /**
     * @en The backspace key
     * @zh 退格键
     */
    BACKSPACE = 8,
    /**
     * @en The tab key
     * @zh Tab 键
     */
    TAB = 9,
    /**
     * @en The enter key
     * @zh 回车键
     */
    ENTER = 13,
    /**
     * @en The left shift key
     * @zh 左 Shift 键
     */
    SHIFT_LEFT = 16,
    /**
     * @en The left ctrl key
     * @zh 左 Ctrl 键
     */
    CTRL_LEFT = 17,
    /**
     * @en The left alt key
     * @zh 左 Alt 键
     */
    ALT_LEFT = 18,
    /**
     * @en The pause key
     * @zh 暂停键
     */
    PAUSE = 19,
    /**
     * @en The caps lock key
     * @zh 大写锁定键
     */
    CAPS_LOCK = 20,
    /**
     * @en The esc key
     * @zh ESC 键
     */
    ESCAPE = 27,
    /**
     * @en The space key
     * @zh 空格键
     */
    SPACE = 32,
    /**
     * @en The '!' key
     * @zh 感叹号键
     */
    EXCLAMATION = 33,
    /**
     * @en The '"' key
     * @zh 双引号键
     */
    DOUBLE_QUOTES = 34,
    /**
     * @en The '#' key
     * @zh #键
     */
    HASH_KEY = 35,
    /**
     * @en The '$' key
     * @zh $键
     */
    DOLLOR = 36,
    /**
     * @en The '%' key
     * @zh 百分号键
     */
    PERCENT = 37,
    /**
     * @en The '&' key
     * @zh &键
     */
    AND = 38,
    /**
     * @en The ''' key
     * @zh 单引号键
     */
    SINGLE_QUOTES = 39,
    /**
     * @en The '(' key
     * @zh 左括号键
     */
    PARENTHESES_LEFT = 40,
    /**
     * @en The ')' key
     * @zh 右括号键
     */
    PARENTHESES_RIGHT = 41,
    /**
     * @en The '*' key
     * @zh 星号键
     */
    ASTERISK = 42,
    /**
     * @en The '+' key
     * @zh 加号键
     */
    PLUS = 43,
    /**
     * @en The '-' key
     * @zh 减号键
     */
    MINUS = 45,
    /**
     * @en The Delete key
     * @zh 删除键
     */
    DELETE = 46,
    /**
     * @en The slash key '/'
     * @zh 正斜杠键 '/'
     */
    SLASH = 47,
    /**
     * @en The '0' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 0 键
     */
    DIGIT_0 = 48,
    /**
     * @en The '1' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 1 键
     */
    DIGIT_1 = 49,
    /**
     * @en The '2' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 2 键
     */
    DIGIT_2 = 50,
    /**
     * @en The '3' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 3 键
     */
    DIGIT_3 = 51,
    /**
     * @en The '4' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 4 键
     */
    DIGIT_4 = 52,
    /**
     * @en The '5' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 5 键
     */
    DIGIT_5 = 53,
    /**
     * @en The '6' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 6 键
     */
    DIGIT_6 = 54,
    /**
     * @en The '7' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 7 键
     */
    DIGIT_7 = 55,
    /**
     * @en The '8' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 8 键
     */
    DIGIT_8 = 56,
    /**
     * @en The '9' key on the top of the alphanumeric keyboard.
     * @zh 字母键盘上的 9 键
     */
    DIGIT_9 = 57,
    /**
     * @en The ':' key
     * @zh 冒号键
     */
    COLON = 58,
    /**
     * @en The ';' key
     * @zh 分号键
     */
    SEMICOLON = 59,
    /**
     * @en The '<' key
     * @zh 左尖括号键
     */
    ANGLE_BRACKET_LEFT = 60,
    /**
     * @en The '=' key
     * @zh 等于号键
     */
    EQUAL = 61,
    /**
     * @en The '>' key
     * @zh 左尖括号键
     */
    ANGLE_BRACKET_RIGHT = 62,
    /**
     * @en The '?' key
     * @zh 问号键
     */
    QUESTION = 63,
    /**
     * @en The '@' key
     * @zh @ 键
     */
    AT = 64,
    /**
     * @en The a key
     * @zh A 键
     */
    KEY_A = 65,
    /**
     * @en The b key
     * @zh B 键
     */
    KEY_B = 66,
    /**
     * @en The c key
     * @zh C 键
     */
    KEY_C = 67,
    /**
     * @en The d key
     * @zh D 键
     */
    KEY_D = 68,
    /**
     * @en The e key
     * @zh E 键
     */
    KEY_E = 69,
    /**
     * @en The f key
     * @zh F 键
     */
    KEY_F = 70,
    /**
     * @en The g key
     * @zh G 键
     */
    KEY_G = 71,
    /**
     * @en The h key
     * @zh H 键
     */
    KEY_H = 72,
    /**
     * @en The i key
     * @zh I 键
     */
    KEY_I = 73,
    /**
     * @en The j key
     * @zh J 键
     */
    KEY_J = 74,
    /**
     * @en The k key
     * @zh K 键
     */
    KEY_K = 75,
    /**
     * @en The l key
     * @zh L 键
     */
    KEY_L = 76,
    /**
     * @en The m key
     * @zh M 键
     */
    KEY_M = 77,
    /**
     * @en The n key
     * @zh N 键
     */
    KEY_N = 78,
    /**
     * @en The o key
     * @zh O 键
     */
    KEY_O = 79,
    /**
     * @en The p key
     * @zh P 键
     */
    KEY_P = 80,
    /**
     * @en The q key
     * @zh Q 键
     */
    KEY_Q = 81,
    /**
     * @en The r key
     * @zh R 键
     */
    KEY_R = 82,
    /**
     * @en The s key
     * @zh S 键
     */
    KEY_S = 83,
    /**
     * @en The t key
     * @zh T 键
     */
    KEY_T = 84,
    /**
     * @en The u key
     * @zh U 键
     */
    KEY_U = 85,
    /**
     * @en The v key
     * @zh V 键
     */
    KEY_V = 86,
    /**
     * @en The w key
     * @zh W 键
     */
    KEY_W = 87,
    /**
     * @en The x key
     * @zh X 键
     */
    KEY_X = 88,
    /**
     * @en The y key
     * @zh Y 键
     */
    KEY_Y = 89,
    /**
     * @en The z key
     * @zh Z 键
     */
    KEY_Z = 90,
    /**
     * @en The '[' key
     * @zh 左方括号键
     */
    SQUARE_BRACKET_LEFT = 91,
    /**
     * @en The back slash key '\'
     * @zh 反斜杠键 '\'
     */
    BACKSLASH = 92,
    /**
     * @en The ']' key
     * @zh 右方括号键
     */
    SQUARE_BRACKET_RIGHT = 93,
    /**
     * @en The '^' key
     * @zh ^号键
     */
    FACTORIAL = 94,
    /**
     * @en The '_' key
     * @zh 下横线键
     */
    TRANSVERSE_BOTTOM = 95,
    /**
     * @en The numeric keypad 0
     * @zh 数字键盘 0
     */
    NUM_0 = 96,
    /**
     * @en The numeric keypad 1
     * @zh 数字键盘 1
     */
    NUM_1 = 97,
    /**
     * @en The numeric keypad 2
     * @zh 数字键盘 2
     */
    NUM_2 = 98,
    /**
     * @en The numeric keypad 3
     * @zh 数字键盘 3
     */
    NUM_3 = 99,
    /**
     * @en The numeric keypad 4
     * @zh 数字键盘 4
     */
    NUM_4 = 100,
    /**
     * @en The numeric keypad 5
     * @zh 数字键盘 5
     */
    NUM_5 = 101,
    /**
     * @en The numeric keypad 6
     * @zh 数字键盘 6
     */
    NUM_6 = 102,
    /**
     * @en The numeric keypad 7
     * @zh 数字键盘 7
     */
    NUM_7 = 103,
    /**
     * @en The numeric keypad 8
     * @zh 数字键盘 8
     */
    NUM_8 = 104,
    /**
     * @en The numeric keypad 9
     * @zh 数字键盘 9
     */
    NUM_9 = 105,
    /**
     * @en The numeric keypad '*'
     * @zh 数字键盘 *
     */
    NUM_MULTIPLY = 106,
    /**
     * @en The numeric keypad '+'
     * @zh 数字键盘 +
     */
    NUM_PLUS = 107,
    /**
     * @en The numeric keypad '-'
     * @zh 数字键盘 -
     */
    NUM_SUBTRACT = 109,
    /**
     * @en The numeric keypad '.'
     * @zh 数字键盘小数点 '.'
     */
    NUM_DECIMAL = 110,
    /**
     * @en The numeric keypad '/'
     * @zh 数字键盘 /
     */
    NUM_DIVIDE = 111,
    /**
     * @en The F1 function key
     * @zh F1 功能键
     */
    F1 = 112,
    /**
     * @en The F2 function key
     * @zh F2 功能键
     */
    F2 = 113,
    /**
     * @en The F3 function key
     * @zh F3 功能键
     */
    F3 = 114,
    /**
     * @en The F4 function key
     * @zh F4 功能键
     */
    F4 = 115,
    /**
     * @en The F5 function key
     * @zh F5 功能键
     */
    F5 = 116,
    /**
     * @en The F6 function key
     * @zh F6 功能键
     */
    F6 = 117,
    /**
     * @en The F7 function key
     * @zh F7 功能键
     */
    F7 = 118,
    /**
     * @en The F8 function key
     * @zh F8 功能键
     */
    F8 = 119,
    /**
     * @en The F9 function key
     * @zh F9 功能键
     */
    F9 = 120,
    /**
     * @en The F10 function key
     * @zh F10 功能键
     */
    F10 = 121,
    /**
     * @en The F11 function key
     * @zh F11 功能键
     */
    F11 = 122,
    /**
     * @en The '{' key
     * @zh 左大括号键
     */
    BRACE_LEFT = 123,
    /**
     * @en The '|' key
     * @zh 竖号键
     */
    VERTICAL_BAR = 124,
    /**
     * @en The '}' key
     * @zh 右大括号键
     */
    BRACE_RIGHT = 125,
    /**
     * @en The '~' key
     * @zh ~号键
     */
    TILDE = 126,
    /**
     * @en The numlock key
     * @zh 数字锁定键
     */
    NUM_LOCK = 144,
    /**
     * @en The scroll lock key
     * @zh 滚动锁定键
     */
    SCROLL_LOCK = 145,
    /**
     * @en The ';' key.
     * @zh 分号键
     */
    // SEMICOLON = 186,
    /**
     * @en The '=' key.
     * @zh 等于号键
     */
    // EQUAL = 187,
    /**
     * @en The ',' key.
     * @zh 逗号键
     */
    COMMA = 188,
    /**
     * @en The dash '-' key.
     * @zh 中划线键
     */
    DASH = 189,
    /**
     * @en The '.' key
     * @zh 句号键
     */
    PERIOD = 190,
    /**
     * @en The slash key '/'
     * @zh 正斜杠键 '/'
     */
    // SLASH = 191,
    /**
     * @en The back quote key `
     * @zh 按键 `
     */
    BACK_QUOTE = 192,
    /**
     * @en The '[' key
     * @zh 按键 [
     */
    BRACKET_LEFT = 219,
    /**
     * @en The back slash key '\'
     * @zh 反斜杠键 '\'
     */
    // BACKSLASH = 220,
    /**
     * @en The ']' key
     * @zh 按键 ]
     */
    BRACKET_RIGHT = 221,
    /**
     * @en The quote key
     * @zh 单引号键
     */
    QUOTE = 222,
    /**
     * @en The right shift key
     * @zh 右 Shift 键
     */
    SHIFT_RIGHT = 2000,
    /**
     * @en The right ctrl key
     * @zh 右 Ctrl 键
     */
    CTRL_RIGHT = 2001,
    /**
     * @en The right alt key
     * @zh 右 Alt 键
     */
    ALT_RIGHT = 2002,
    /**
     * @en The numeric keypad enter
     * @zh 数字键盘 enter
     */
    NUM_ENTER = 2003,
    /**
     * @en The numeric keypad enter
     * @zh 收起键盘
     */
    HIDE = 2004
}

type KeyboardCallback = (res: XrKeyCode) => void;
type XRKeyboardInputCallback = (res: string) => void;

export class XrKeyboardInputSource {
    private _eventTarget: EventTarget = new EventTarget();

    public on (eventType: Input.EventType | XrKeyboardEventType, callback: KeyboardCallback | XRKeyboardInputCallback, target?: any) {
        this._eventTarget.on(eventType, callback, target);
    }

    public off (eventType: Input.EventType | XrKeyboardEventType, callback: KeyboardCallback | XRKeyboardInputCallback, target?: any) {
        this._eventTarget.off(eventType, callback, target);
    }

    public emit (type: Input.EventType | XrKeyboardEventType, event?: string | number) {
        this._eventTarget.emit(type, event);
    }
}

export const xrKeyboardEventInput = new XrKeyboardInputSource();
