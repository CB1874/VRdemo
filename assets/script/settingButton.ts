import { _decorator, Component, Node, director, tweenUtil } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('set')
export class settingBtnScript extends Component {
    @property(Node)
    settingsPanel:Node=null
    @property(Node)
    startButton:Node=null
    @property(Node)
    setting:Node=null
    @property(Node)
    question:Node=null
    @property(Node)
    questionPanel:Node=null
    onLoad() {
        // 可在这里做一些初始化操作
    }

    start() {
        // 可在这里做一些场景初始化后的逻辑
    }
    public onSettingButtonClicked(){
        if (this.settingsPanel) {
            this.settingsPanel.active = true;
            this.startButton.active=false;
            this.setting.active=false;
            this.question.active=false;
        }
    }

    public onCloseButtonClicked(){
        if(this.setting&&this.startButton){
            this.settingsPanel.active = false;
            this.startButton.active=true;
            this.setting.active=true;
            this.question.active=true;
        }
    }

    public openQuestionPanel(){
        if(this.questionPanel){
            this.questionPanel.active=true;
            this.startButton.active=false;
            this.setting.active=false;
            this.question.active=false;
        }
    }

    public closeQuestionPanel() {
        if(this.setting&&this.startButton&&this.questionPanel){
            this.question.active=true;
            this.questionPanel.active=false;
            this.startButton.active=true;
            this.setting.active=true;
        }
    }
}
