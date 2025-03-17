import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {

    @property(Node)
    obj: Node=null;

    start() {

    }

    update(deltaTime: number) {
        //let v = Math.floor(Math.random()*(30-1+1)+1)
        let v =5;
        if (this.obj.isValid) {
            this.obj.translate(new Vec3(0,0,-v*deltaTime));
            console.log("test position:", this.obj.position.toString());
        } else {
            console.warn("The object has been destroyed.");
        }
    }
}
