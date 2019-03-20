import * as THREE from 'three';
import { USERDATA_KEY_VRM, VRM, VRMHumanBoneName } from '../data';
import { CCDIKSolver } from '../vendor/three/examples/CCDIKSolver';

export const USERDATA_KEY_VRM_IK_SOLVER = 'VRMIK';

// TODO: Implement IK using VRM.humanoid (Unity's HumanDescription).
export class VRMIKSolver {
  private vrm: VRM;
  private iks: Array<{ enabled: boolean; target: THREE.Object3D; solver: CCDIKSolver }>;

  constructor(vrm: VRM) {
    if (vrm.userData[USERDATA_KEY_VRM_IK_SOLVER]) {
      this.copy(vrm.userData[USERDATA_KEY_VRM_IK_SOLVER]);
      return;
    }

    vrm.userData[USERDATA_KEY_VRM_IK_SOLVER] = this;

    this.vrm = vrm;
    this.iks = [];

    // LeftFoot
    {
      const target = new THREE.Object3D();
      target.name = 'LeftBoneIKTarget';
      const effector = this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.LeftFoot);
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
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.LeftLowerLeg),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.LeftUpperLeg),
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
      const effector = this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.RightFoot);
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
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.RightLowerLeg),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, 0, 0),
                rotationMax: new THREE.Vector3((-5 / 180) * Math.PI, 0, 0),
              },
              {
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.RightUpperLeg),
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
      const effector = this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.LeftToes);
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
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.LeftFoot),
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
      const effector = this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.RightToes);
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
                bone: this.vrm.getNodeByHumanBoneName(VRMHumanBoneName.RightFoot),
                rotationMin: new THREE.Vector3((-180 / 180) * Math.PI, (-180 / 180) * Math.PI, (-5 / 180) * Math.PI),
                rotationMax: new THREE.Vector3((45 / 180) * Math.PI, (180 / 180) * Math.PI, (5 / 180) * Math.PI),
              },
            ],
            iteration: 2,
          },
        ]),
      };
    }

    // Store initial state.
    this.iks.forEach((ik: any) => {
      ik.target.userData[USERDATA_KEY_VRM] = {};

      ik.target.userData[USERDATA_KEY_VRM].default = {
        position: ik.target.position.clone(),
        quaternion: ik.target.quaternion.clone(),
      };
    });

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
