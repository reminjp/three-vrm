import * as THREE from 'three';
import { VRM } from '../data';
import { CCDIKSolver } from '../vendor/three/examples/CCDIKSolver';

export const USERDATA_KEY_VRM_IK_SOLVER = 'VRMIK';

// TODO: Implement IK using VRM.humanoid (Unity's HumanDescription).
export class VRMIKSolver {
  public static initialize(vrm: VRM) {
    if (!vrm.userData[USERDATA_KEY_VRM_IK_SOLVER]) {
      vrm.userData[USERDATA_KEY_VRM_IK_SOLVER] = new VRMIKSolver(vrm);
    }
    return vrm.userData[USERDATA_KEY_VRM_IK_SOLVER] as VRMIKSolver;
  }

  private vrm: VRM;
  private iks: Array<{ enabled: boolean; target: THREE.Object3D; solver: CCDIKSolver }>;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.iks = [];

    // LeftFoot
    {
      const target = new THREE.Object3D();
      target.name = 'LeftBoneIKTarget';
      const effector = this.vrm.getNodeByHumanBoneName('leftFoot');
      target.applyMatrix(effector.matrixWorld);
      this.vrm.model.add(target);

      this.iks[VRMIKName.LeftFoot] = {
        enabled: true,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [
              {
                bone: this.vrm.getNodeByHumanBoneName('leftLowerLeg'),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName('leftUpperLeg'),
                rotationMin: new THREE.Vector3((-90 / 180) * Math.PI, (-90 / 180) * Math.PI, (-180 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((180 / 180) * Math.PI, (90 / 180) * Math.PI, (45 / 180) * Math.PI),
              },
            ],
            iteration: 128,
          },
        ]),
      };
    }

    // RightFoot
    {
      const target = new THREE.Object3D();
      target.name = 'RightBoneIKTarget';
      const effector = this.vrm.getNodeByHumanBoneName('rightFoot');
      target.applyMatrix(effector.matrixWorld);
      this.vrm.model.add(target);

      this.iks[VRMIKName.RightFoot] = {
        enabled: true,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [
              {
                bone: this.vrm.getNodeByHumanBoneName('rightLowerLeg'),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName('rightUpperLeg'),
                rotationMin: new THREE.Vector3((-90 / 180) * Math.PI, (-90 / 180) * Math.PI, (-45 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((180 / 180) * Math.PI, (90 / 180) * Math.PI, (180 / 180) * Math.PI),
              },
            ],
            iteration: 128,
          },
        ]),
      };
    }

    // LeftToes
    {
      const target = new THREE.Object3D();
      target.name = 'LeftToesIKTarget';
      const effector = this.vrm.getNodeByHumanBoneName('leftToes');
      target.applyMatrix(effector.matrix);
      this.iks[VRMIKName.LeftFoot].target.add(target);

      this.iks[VRMIKName.LeftToes] = {
        enabled: true,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [
              {
                bone: this.vrm.getNodeByHumanBoneName('leftFoot'),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, (-180 / 180) * Math.PI, (-5 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((45 / 180) * Math.PI, (180 / 180) * Math.PI, (5 / 180) * Math.PI),
              },
            ],
            iteration: 2,
          },
        ]),
      };
    }

    // RightToes
    {
      const target = new THREE.Object3D();
      target.name = 'RightToesIKTarget';
      const effector = this.vrm.getNodeByHumanBoneName('rightToes');
      target.applyMatrix(effector.matrix);
      this.iks[VRMIKName.RightFoot].target.add(target);

      this.iks[VRMIKName.RightToes] = {
        enabled: true,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [
              {
                bone: this.vrm.getNodeByHumanBoneName('rightFoot'),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, (-180 / 180) * Math.PI, (-5 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((45 / 180) * Math.PI, (180 / 180) * Math.PI, (5 / 180) * Math.PI),
              },
            ],
            iteration: 2,
          },
        ]),
      };
    }

    // Debug
    // this.iks.forEach((ik: any) => {
    //   const sphere = new THREE.Mesh(
    //     new THREE.SphereGeometry(0.025, 8, 8),
    //     new THREE.MeshBasicMaterial({ color: 0x00ffff })
    //   );
    //   ik.target.add(sphere);
    // });
  }

  public update() {
    this.iks.forEach((ik: any) => {
      if (!ik.enabled) {
        return;
      }

      ik.solver.update();
    });
  }

  public copy(vrmIKSolver: VRMIKSolver) {
    this.vrm = vrmIKSolver.vrm;
    this.iks = vrmIKSolver.iks;
  }

  public getTarget(ikName: VRMIKName) {
    return this.iks[ikName].target;
  }
}

export enum VRMIKName {
  LeftFoot,
  RightFoot,
  LeftToes,
  RightToes,
}
