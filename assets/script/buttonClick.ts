import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BtnScript')
export class BtnScript extends Component {

    onLoad() {
        // 可在这里做一些初始化操作
    }

    start() {
        // 可在这里做一些场景初始化后的逻辑
    }

    // 点击按钮时要执行的函数
    public onButtonClicked() {
        // 假设要切换到名为 "MapScene" 的场景
        console.log('click')
        director.loadScene("xr_main");
    }
}
