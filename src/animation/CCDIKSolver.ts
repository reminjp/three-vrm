import * as THREE from 'three';

// https://github.com/mrdoob/three.js/blob/master/examples/js/animation/CCDIKSolver.js
export class CCDIKSolver {
  private iks: CCDIKConfig[];

  constructor(iks?: CCDIKConfig[]) {
    this.iks = iks || [];
    this.validate();
  }

  public update() {
    const q = new THREE.Quaternion();
    const targetPos = new THREE.Vector3();
    const targetVec = new THREE.Vector3();
    const effectorPos = new THREE.Vector3();
    const effectorVec = new THREE.Vector3();
    const linkPos = new THREE.Vector3();
    const invLinkQ = new THREE.Quaternion();
    const linkScale = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const vector = new THREE.Vector3();

    const iks = this.iks;

    // for reference overhead reduction in loop
    const math = Math;

    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];
      const effector = ik.effector;
      const target = ik.target;

      // don't use getWorldPosition() here for the performance
      // because it calls updateMatrixWorld( true ) inside.
      targetPos.setFromMatrixPosition(target.matrixWorld);

      const links = ik.links;
      const iteration = ik.iteration !== undefined ? ik.iteration : 1;

      for (let j = 0; j < iteration; j++) {
        let rotated = false;

        for (let k = 0, kl = links.length; k < kl; k++) {
          const link = links[k].bone;

          // skip this link and following links.
          // this skip is used for MMD performance optimization.
          if (links[k].enabled === false) {
            break;
          }

          const limitation = links[k].limitation;
          const rotationMin = links[k].rotationMin;
          const rotationMax = links[k].rotationMax;

          // don't use getWorldPosition/Quaternion() here for the performance
          // because they call updateMatrixWorld( true ) inside.
          link.matrixWorld.decompose(linkPos, invLinkQ, linkScale);
          invLinkQ.inverse();
          effectorPos.setFromMatrixPosition(effector.matrixWorld);

          // work in link world
          effectorVec.subVectors(effectorPos, linkPos);
          effectorVec.applyQuaternion(invLinkQ);
          effectorVec.normalize();

          targetVec.subVectors(targetPos, linkPos);
          targetVec.applyQuaternion(invLinkQ);
          targetVec.normalize();

          let angle = targetVec.dot(effectorVec);

          if (angle > 1.0) {
            angle = 1.0;
          } else if (angle < -1.0) {
            angle = -1.0;
          }

          angle = math.acos(angle);

          // skip if changing angle is too small to prevent vibration of bone
          // Refer to http://www20.atpages.jp/katwat/three.js_r58/examples/mytest37/mmd.three.js
          if (angle < 1e-5) {
            continue;
          }

          if (ik.minAngle !== undefined && angle < ik.minAngle) {
            angle = ik.minAngle;
          }

          if (ik.maxAngle !== undefined && angle > ik.maxAngle) {
            angle = ik.maxAngle;
          }

          axis.crossVectors(effectorVec, targetVec);
          axis.normalize();

          q.setFromAxisAngle(axis, angle);
          link.quaternion.multiply(q);

          // TODO: re-consider the limitation specification
          if (limitation !== undefined) {
            let c = link.quaternion.w;

            if (c > 1.0) {
              c = 1.0;
            }

            const c2 = math.sqrt(1 - c * c);
            link.quaternion.set(limitation.x * c2, limitation.y * c2, limitation.z * c2, c);
          }

          if (rotationMin !== undefined) {
            link.rotation.setFromVector3(link.rotation.toVector3(vector).max(rotationMin));
          }

          if (rotationMax !== undefined) {
            link.rotation.setFromVector3(link.rotation.toVector3(vector).min(rotationMax));
          }

          link.updateMatrixWorld(true);

          rotated = true;
        }

        if (!rotated) {
          break;
        }
      }
    }

    return this;
  }

  private validate() {
    const iks = this.iks;

    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];
      const effector = ik.effector;
      const links = ik.links;
      let link0;
      let link1;

      link0 = effector;

      for (let j = 0, jl = links.length; j < jl; j++) {
        link1 = links[j].bone;

        if (link0.parent !== link1) {
          console.warn('THREE.CCDIKSolver: bone ' + link0.name + ' is not the child of bone ' + link1.name);
        }

        link0 = link1;
      }
    }
  }
}

export interface CCDIKConfig {
  target: THREE.Object3D;
  effector: THREE.Object3D;
  links: Array<{
    bone: THREE.Object3D;
    limitation?: THREE.Vector3;
    rotationMin?: THREE.Vector3;
    rotationMax?: THREE.Vector3;
    enabled?: boolean;
  }>;
  iteration?: number;
  minAngle?: number;
  maxAngle?: number;
}
