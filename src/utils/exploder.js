import * as THREE from "three";
import { Vector3 } from "three";
// import TWEEN from "@tweenjs/tween.js";
import gsap from "gsap";
/**
 * Exploder class is used to explode an object
 */
export default class Exploder {
  /**
   * Constructor of Explode
   * @param objectId target object id, that is going to be exploded
   * @param position if undefined, will explode object by its center
   * @param scale scale factor, 1 means 1 time farer away from exploder's position
   */
  constructor(scene, objectId, position, scale) {
    this.explodedTimes = 0;
    this.scene = scene;
    this.objectId = objectId;
    if (!objectId) {
      console.log(`Invalid objectId: ${objectId}`);
    }
    this.scale = scale || 1;
    if (scale <= 0) {
      console.log(`Invalid scale: ${scale}`);
    }
    if (position) {
      this.position = position;
    } else {
      this.position = new Vector3();
      this.getObjectCenter(this.position);
    }
  }

  /**
   * Explode the object
   */
  explode() {
    if (!this.objectId || !this.position || !this.scale) {
      console.log(
        `Invalid objectId: ${this.objectId}, or position: ${this.position}, or this.power: ${this.scale}`
      );
      return;
    }
    const object = this.scene.getObjectById(this.objectId);
    if (!object || !object.children) {
      console.log("No children to explode!");
      return;
    }
    console.log(
      `position: ${this.position.x}, ${this.position.y}, ${this.position.z}`
    );
    object.children.forEach((childObj, idx) => {
      const pos = new Vector3(
        childObj.position.x,
        childObj.position.y,                        
        childObj.position.z
      );
      console.log(pos, 'pos');
      const distance = pos.sub(this.position); // get distance from childObj to exploder position
      let poss = new Vector3(
        childObj.position.x,
        childObj.position.y,
        childObj.position.z
      );
      let res = poss.addScaledVector(distance, this.scale);
      gsap.to(childObj.position, {
        duration: 0.8,
        x: res.x,
        y: res.y,
        z: res.z,
      });
      // new TWEEN.Tween(childObj.position)
      //   .to({ x: res.x, y: res.y, z: res.z }, 800)
      //   .start();
    });
    this.explodedTimes++;
  }

  /**
   * Unexplode the object
   */
  unexplode() {
    const object = this.scene.getObjectById(this.objectId);
    if (!object || !object.children) {
      console.log("No children to explode!");
      return;
    }
    for (let i = this.explodedTimes; i > 0; --i) {
      object.children.forEach((childObj) => {
        const pos = new Vector3(
          childObj.position.x,
          childObj.position.y,
          childObj.position.z
        );
        const factor = this.scale / (1 + this.scale);
        const dist = pos.sub(this.position);
        dist.x *= factor;
        dist.y *= factor;
        dist.z *= factor;
        childObj.position.sub(dist);
      });
    }
    this.explodedTimes = 0;
  }

  getObjectCenter(center) {
    const bbox = new THREE.Box3();
    if (!this.objectId) {
      console.log(`Invalid objectId: ${this.objectId}`);
      return;
    }
    const object = this.scene.getObjectById(this.objectId);
    if (!object || !object.children) {
      console.log("No children to explode!");
      return;
    }
    object.traverse((obj) => {
      bbox.expandByObject(obj);
    });
    bbox.getCenter(center);
  }
}
