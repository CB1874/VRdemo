import { _decorator, Component, Node, Vec3} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpeedController')
export class SpeedControl extends Component {
    @property(Node)
    controllerModel: Node = null; // 已连接的Pico手柄模型

    @property(Node)
    character: Node = null;      // 被控角色

    private _lastPos: Vec3 = new Vec3();

    start() {
        this._lastPos = this.controllerModel.position.clone();
    }

    update(dt: number) {
        // 计算位移差
        const delta = this.controllerModel.position.subtract(this._lastPos);
        console.log("controller position:",this.controllerModel.position.toString());
        console.log("controller delta: ",delta.length().toString());

        // 更新记录点
        this._lastPos.set(this.controllerModel.position.clone());
        
        this.character.translate(new Vec3(0,0,-delta.length()));
        console.log("character position:",this.character.position.toString());

    }
}


