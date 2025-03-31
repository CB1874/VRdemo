import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
export let delta = new Vec3();

@ccclass('test')
export class test extends Component {

    @property(Node)
    obj: Node=null;

    private _lastPos: Vec3 = new Vec3();
    

    start() {
        //this._lastPos = this.node.position.clone();
    }

    update(deltaTime: number) {
        //let v = Math.floor(Math.random()*(30-1+1)+1)
        // const currentPos=this.node.position.clone();
        // delta = currentPos.subtract(this._lastPos);
        // console.log("controller position:",this.node.position.toString());
        // console.log("controller delta: ",delta.length().toString());

        //this._lastPos=this.node.position.clone();

        let v =5;
        if (this.obj.isValid) {
            this.obj.translate(new Vec3(0,0,-v*deltaTime));
            console.log("test position:", this.obj.position.toString());
        } else {
            console.warn("The object has been destroyed.");
        }
    }
}
