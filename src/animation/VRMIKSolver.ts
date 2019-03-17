import * as THREE from 'three';
import { VRM } from '../data';
import { CCDIKSolver } from './CCDIKSolver';

export const USERDATA_KEY_VRM_IK_SOLVER = 'VRMIK';

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

    const iteration = 10;

    // LeftFoot
    {
      const target = new THREE.Object3D();
      target.name = 'LeftBoneIKTarget';
      const targetOffset = new THREE.Object3D();
      const effector = this.vrm.getNodeByHumanBoneName('leftFoot');
      targetOffset.applyMatrix(effector.matrixWorld);
      targetOffset.add(target);
      this.vrm.model.add(targetOffset);

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
                // limitation: new THREE.Vector3(1, 0, 0),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-0.5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName('leftUpperLeg'),
                rotationMin: new THREE.Vector3((-45 / 180) * Math.PI, 0, (-180 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((180 / 180) * Math.PI, (90 / 180) * Math.PI, (45 / 180) * Math.PI),
              },
            ],
            iteration,
          },
        ]),
      };
    }

    // RightFoot
    {
      const target = new THREE.Object3D();
      target.name = 'RightBoneIKTarget';
      const targetOffset = new THREE.Object3D();
      const effector = this.vrm.getNodeByHumanBoneName('rightFoot');
      targetOffset.applyMatrix(effector.matrixWorld);
      targetOffset.add(target);
      this.vrm.model.add(targetOffset);

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
                // limitation: new THREE.Vector3(1, 0, 0),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-0.5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName('rightUpperLeg'),
                rotationMin: new THREE.Vector3((-45 / 180) * Math.PI, (-90 / 180) * Math.PI, (-45 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((180 / 180) * Math.PI, 0, (180 / 180) * Math.PI),
              },
            ],
            iteration,
          },
        ]),
      };
    }

    // LeftToes
    {
      const target = new THREE.Object3D();
      target.name = 'LeftToesIKTarget';
      const targetOffset = new THREE.Object3D();
      const effector = this.vrm.getNodeByHumanBoneName('leftToes');
      targetOffset.applyMatrix(effector.matrixWorld);
      targetOffset.add(target);
      this.vrm.model.add(targetOffset);

      this.iks[VRMIKName.LeftToes] = {
        enabled: false,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [{ bone: this.vrm.getNodeByHumanBoneName('leftFoot') }],
            iteration,
          },
        ]),
      };
    }

    // RightToes
    {
      const target = new THREE.Object3D();
      target.name = 'RightToesIKTarget';
      const targetOffset = new THREE.Object3D();
      const effector = this.vrm.getNodeByHumanBoneName('rightToes');
      targetOffset.applyMatrix(effector.matrixWorld);
      targetOffset.add(target);
      this.vrm.model.add(targetOffset);

      this.iks[VRMIKName.RightToes] = {
        enabled: false,
        target,
        solver: new CCDIKSolver([
          {
            target,
            effector,
            links: [{ bone: this.vrm.getNodeByHumanBoneName('rightFoot') }],
            iteration,
          },
        ]),
      };
    }

    // Debug
    this.iks.forEach((ik: any) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      ik.target.add(sphere);
    });
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
