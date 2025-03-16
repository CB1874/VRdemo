import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {

    @property(Node)
    obj: Node=null;

    @property
    v:number=5;

    start() {

    }

    update(deltaTime: number) {
        if (this.obj.isValid) {
            this.obj.translate(new Vec3(0,0,-this.v*deltaTime));
            console.log("position:", this.obj.position.toString());
            console.log("worldposition:", this.obj.worldPosition.toString());
        } else {
            console.warn("The object has been destroyed.");
        }
    }
}
