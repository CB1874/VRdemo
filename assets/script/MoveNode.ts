import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoveNode')
export class MoveNode extends Component {

    @property
    speed: number = 5; // 移动速度，单位为米/秒

    start() {
        // 可以在这里进行初始化
    }

    update(deltaTime: number) {
        // 计算每帧移动的距离
        const distance = this.speed * deltaTime; // 计算每帧移动的距离
        // 更新目标节点的位置
        if (this.node) {
            this.node.translate(new Vec3(this.speed*deltaTime,0,0));
            console.log("Current Position:", this.node.position.toString());
        }
    }
}