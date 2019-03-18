import * as THREE from 'three';

// cf. https://github.com/mrdoob/three.js/blob/master/examples/js/animation/CCDIKSolver.js
export class CCDIKSolver {
  private iks: CCDIKConfig[];

  constructor(iks?: CCDIKConfig[]) {
    this.iks = iks || [];
    this.validate();
  }

  public update() {
    // Prepare objects for the performance.
    const quaternion = new THREE.Quaternion();
    const targetPosition = new THREE.Vector3();
    const targetVector = new THREE.Vector3();
    const effectorPosition = new THREE.Vector3();
    const effectorVector = new THREE.Vector3();
    const linkPosition = new THREE.Vector3();
    const linkQuaternionInverse = new THREE.Quaternion();
    const linkScale = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const vector = new THREE.Vector3();

    this.iks.forEach(ik => {
      // Use matrixWorld instead of getWorldPosition for the performance.
      targetPosition.setFromMatrixPosition(ik.target.matrixWorld);

      for (let iteration = ik.iteration !== undefined ? ik.iteration : 1; iteration > 0; iteration--) {
        let didConverge = true;

        let shouldSkip = false;
        ik.links.forEach(link => {
          if (shouldSkip || link.enabled === false) {
            shouldSkip = true;
            return;
          }

          // Use matrixWorld instead of getWorldPosition for the performance.
          link.bone.matrixWorld.decompose(linkPosition, linkQuaternionInverse, linkScale);
          linkQuaternionInverse.inverse();
          effectorPosition.setFromMatrixPosition(ik.effector.matrixWorld);

          effectorVector.subVectors(effectorPosition, linkPosition);
          effectorVector.applyQuaternion(linkQuaternionInverse);
          effectorVector.normalize();

          targetVector.subVectors(targetPosition, linkPosition);
          targetVector.applyQuaternion(linkQuaternionInverse);
          targetVector.normalize();

          let angle = targetVector.dot(effectorVector);

          if (angle > 1.0) {
            angle = 1.0;
          } else if (angle < -1.0) {
            angle = -1.0;
          }

          angle = Math.acos(angle);

          if (angle < 1e-5) {
            return;
          }

          if (ik.minAngle !== undefined && angle < ik.minAngle) {
            angle = ik.minAngle;
          }

          if (ik.maxAngle !== undefined && angle > ik.maxAngle) {
            angle = ik.maxAngle;
          }

          axis.crossVectors(effectorVector, targetVector);
          axis.normalize();

          quaternion.setFromAxisAngle(axis, angle);
          link.bone.quaternion.multiply(quaternion);

          if (link.limitation) {
            let c = link.bone.quaternion.w;
            if (c > 1.0) {
              c = 1.0;
            }
            const c2 = Math.sqrt(1 - c * c);
            link.bone.quaternion.set(link.limitation.x * c2, link.limitation.y * c2, link.limitation.z * c2, c);
          }

          if (link.rotationMin) {
            link.bone.rotation.setFromVector3(link.bone.rotation.toVector3(vector).max(link.rotationMin));
          }

          if (link.rotationMax) {
            link.bone.rotation.setFromVector3(link.bone.rotation.toVector3(vector).min(link.rotationMax));
          }

          link.bone.updateMatrixWorld(true);

          didConverge = false;
        });

        if (didConverge) {
          break;
        }
      }
    });

    return this;
  }

  private validate() {
    this.iks.forEach(ik => {
      let link0 = ik.effector;
      let link1;
      ik.links.forEach(link => {
        link1 = link.bone;
        if (link0.parent !== link1) {
          console.warn('CCDIKSolver: bone ' + link0.name + ' is not the child of bone ' + link1.name);
        }
        link0 = link1;
      });
    });
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
