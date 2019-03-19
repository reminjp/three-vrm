import * as THREE from 'three';
import { VRMBlendShapeUtils } from '../animation';
import { VRMMMDUtils } from '../animation/utils';
import { USERDATA_KEY_VRM, VRM, VRMBlendShapeBind, VRMHumanBoneName } from '../data';
import { CubicBezierInterpolation } from '../vendor/three/examples/CubicBezierInterpolation';
import { VRMAnimationClip } from './VRMAnimationClip';
import { VRMIKName, VRMIKSolver } from './VRMIKSolver';

const mmdIKBoneNames: string[] = [];
mmdIKBoneNames[VRMIKName.LeftFoot] = '左足ＩＫ';
mmdIKBoneNames[VRMIKName.RightFoot] = '右足ＩＫ';
mmdIKBoneNames[VRMIKName.LeftToes] = '左つま先ＩＫ';
mmdIKBoneNames[VRMIKName.RightToes] = '右つま先ＩＫ';

export class VRMVMD {
  private duration: number;
  private motionsMap: Map<VRMHumanBoneName, VRMVMDMotion[]>;
  private ikMotionsMap: Map<VRMIKName, VRMVMDMotion[]>;
  private morphsMap: Map<string, VRMVMDMorph[]>;

  constructor(vmd: any) {
    // Motions
    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1);
    const rotationOffsets = new Map<VRMHumanBoneName, THREE.Quaternion>([
      ['leftShoulder', new THREE.Quaternion().setFromAxisAngle(front, (-5 / 180) * Math.PI)],
      ['rightShoulder', new THREE.Quaternion().setFromAxisAngle(front, (5 / 180) * Math.PI)],
      ['leftUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (-35 / 180) * Math.PI)],
      ['rightUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (35 / 180) * Math.PI)],
    ]);

    const motions: VRMVMDMotion[] = vmd.motions.map((e: any) => {
      const motion = new VRMVMDMotion();
      motion.boneName = e.boneName;
      motion.humanBoneName = VRMMMDUtils.getHumanBoneNameByBoneName(e.boneName);
      // 30 fps
      motion.time = e.frameNum / 30;
      // 1 unit length in VMD = 0.08 m
      motion.position = new THREE.Vector3(-e.position[0], e.position[1], -e.position[2]).multiplyScalar(0.08);
      motion.rotation = new THREE.Quaternion(e.rotation[0], -e.rotation[1], e.rotation[2], -e.rotation[3]);
      if (rotationOffsets.has(motion.humanBoneName)) {
        motion.rotation.multiply(rotationOffsets.get(motion.humanBoneName));
      }

      motion.interpolation = e.interpolation;
      return motion;
    });
    motions.sort((a, b) => {
      return a.time - b.time;
    });
    this.motionsMap = new Map();
    this.ikMotionsMap = new Map();
    motions.forEach(motion => {
      if (!motion.humanBoneName) {
        const ikName: VRMIKName = mmdIKBoneNames.findIndex(boneName => boneName === motion.boneName);
        if (ikName !== -1) {
          if (!this.ikMotionsMap.has(ikName)) {
            this.ikMotionsMap.set(ikName, []);
          }
          this.ikMotionsMap.get(ikName).push(motion);
        }
        return;
      }
      if (!this.motionsMap.has(motion.humanBoneName)) {
        this.motionsMap.set(motion.humanBoneName, []);
      }
      this.motionsMap.get(motion.humanBoneName).push(motion);
    });

    // Morphs
    const morphs: VRMVMDMorph[] = vmd.morphs.map((e: any) => {
      const morph = new VRMVMDMorph();
      morph.blendShapeGroupName = VRMBlendShapeUtils.stringToBlendShapeGroupName(e.morphName);
      morph.time = e.frameNum / 30;
      morph.weight = e.weight;
      return morph;
    });
    morphs.sort((a, b) => {
      return a.time - b.time;
    });
    this.morphsMap = new Map();
    morphs.forEach(morph => {
      if (!this.morphsMap.has(morph.blendShapeGroupName)) {
        this.morphsMap.set(morph.blendShapeGroupName, []);
      }
      this.morphsMap.get(morph.blendShapeGroupName).push(morph);
    });

    // To true up the duration of tracks.
    this.duration = 0;
    if (motions.length && this.duration < motions[motions.length - 1].time) {
      this.duration = motions[motions.length - 1].time;
    }
    if (morphs.length && this.duration < morphs[morphs.length - 1].time) {
      this.duration = morphs[morphs.length - 1].time;
    }
  }

  public toAnimationClip(vrm: VRM): VRMAnimationClip {
    const ik = VRMIKSolver.initialize(vrm);

    // For motions.
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    vrm.model.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.SkinnedMesh) {
        skinnedMeshes.push(object3d);
      }
    });
    const humanBoneNameToBone = new Map<VRMHumanBoneName, THREE.Object3D>();
    const humanBoneNameToRootObject = new Map<VRMHumanBoneName, THREE.SkinnedMesh>();
    vrm.humanoid.humanBones.forEach(humanBone => {
      const bone = vrm.getNode(humanBone.node);
      if (bone.type !== 'Bone') {
        return;
      }
      humanBoneNameToBone.set(humanBone.bone, bone);
      humanBoneNameToRootObject.set(
        humanBone.bone,
        skinnedMeshes.find(m => m.skeleton.bones.findIndex(e => e.name === bone.name) !== -1)
      );
    });

    // For morphs.
    const blendShapeGroupNameToBinds = new Map<string, VRMBlendShapeBind[]>();
    vrm.blendShapeMaster.blendShapeGroups.forEach(g => {
      blendShapeGroupNameToBinds.set(g.name, g.binds);
    });

    // Tracks binded to each Object3D.
    const tracksMap = new Map<THREE.Object3D, THREE.KeyframeTrack[]>();

    // Create motion tracks.
    this.motionsMap.forEach((motions, humanBoneName) => {
      const bone = humanBoneNameToBone.get(humanBoneName);
      const root = humanBoneNameToRootObject.get(humanBoneName);
      if (!bone) {
        return;
      }
      if (!tracksMap.has(root)) {
        tracksMap.set(root, []);
      }

      // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      const positionInterpolations: number[] = [];
      const rotationInterpolations: number[] = [];

      motions.forEach(motion => {
        times.push(motion.time);
        const p = motion.position.clone().add(bone.userData[USERDATA_KEY_VRM].default.position);
        positions.push(p.x, p.y, p.z);
        const r = motion.rotation;
        rotations.push(r.x, r.y, r.z, r.w);

        // Control points of cubic Bézier curve.
        // cf. http://atupdate.web.fc2.com/vmd_format.htm
        for (let i = 0; i < 3; i++) {
          positionInterpolations.push(
            motion.interpolation[i + 0] / 127, // time1
            motion.interpolation[i + 8] / 127, // value1
            motion.interpolation[i + 4] / 127, // time2
            motion.interpolation[i + 12] / 127 // value2
          );
        }
        rotationInterpolations.push(
          motion.interpolation[3 + 0] / 127,
          motion.interpolation[3 + 8] / 127,
          motion.interpolation[3 + 4] / 127,
          motion.interpolation[3 + 12] / 127
        );
      });

      if (times.length === 0) {
        return;
      }

      // True up the duration of tracks.
      if (times[times.length - 1] < this.duration) {
        times.push(this.duration);
        const pl = positions.length;
        positions.push(positions[pl - 3], positions[pl - 2], positions[pl - 1]);
        const rl = rotations.length;
        rotations.push(rotations[rl - 4], rotations[rl - 3], rotations[rl - 2], rotations[rl - 1]);
        positionInterpolations.push(0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1);
        rotationInterpolations.push(0, 0, 1, 1);
      }

      const positionTrack = new THREE.VectorKeyframeTrack(`.bones[${bone.name}].position`, times, positions);
      const quaternionTrack = new THREE.QuaternionKeyframeTrack(`.bones[${bone.name}].quaternion`, times, rotations);
      (positionTrack as any).createInterpolant = (result: number[]) => {
        return new CubicBezierInterpolation(times, positions, 3, result, new Float32Array(positionInterpolations));
      };
      (quaternionTrack as any).createInterpolant = (result: number[]) => {
        return new CubicBezierInterpolation(times, rotations, 4, result, new Float32Array(rotationInterpolations));
      };
      tracksMap.get(root).push(positionTrack);
      tracksMap.get(root).push(quaternionTrack);
    });

    // Create IK motion tracks.
    if (this.ikMotionsMap.size) {
      tracksMap.set(vrm.model, []);
    }
    this.ikMotionsMap.forEach((motions, ikName) => {
      const target = ik.getTarget(ikName);

      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      const positionInterpolations: number[] = [];
      const rotationInterpolations: number[] = [];

      motions.forEach(motion => {
        times.push(motion.time);
        const p = motion.position.clone().add(target.position);
        positions.push(p.x, p.y, p.z);
        const r = motion.rotation;
        rotations.push(r.x, r.y, r.z, r.w);

        for (let i = 0; i < 3; i++) {
          positionInterpolations.push(
            motion.interpolation[i + 0] / 127, // time1
            motion.interpolation[i + 8] / 127, // value1
            motion.interpolation[i + 4] / 127, // time2
            motion.interpolation[i + 12] / 127 // value2
          );
        }
        rotationInterpolations.push(
          motion.interpolation[3 + 0] / 127,
          motion.interpolation[3 + 8] / 127,
          motion.interpolation[3 + 4] / 127,
          motion.interpolation[3 + 12] / 127
        );
      });

      if (times.length === 0) {
        return;
      }

      // True up the duration of tracks.
      if (times[times.length - 1] < this.duration) {
        times.push(this.duration);
        const pl = positions.length;
        positions.push(positions[pl - 3], positions[pl - 2], positions[pl - 1]);
        const rl = rotations.length;
        rotations.push(rotations[rl - 4], rotations[rl - 3], rotations[rl - 2], rotations[rl - 1]);
        positionInterpolations.push(0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1);
        rotationInterpolations.push(0, 0, 1, 1);
      }

      const positionTrack = new THREE.VectorKeyframeTrack(`${target.uuid}.position`, times, positions);
      const quaternionTrack = new THREE.QuaternionKeyframeTrack(`${target.uuid}.quaternion`, times, rotations);
      (positionTrack as any).createInterpolant = (result: number[]) => {
        return new CubicBezierInterpolation(times, positions, 3, result, new Float32Array(positionInterpolations));
      };
      (quaternionTrack as any).createInterpolant = (result: number[]) => {
        return new CubicBezierInterpolation(times, rotations, 4, result, new Float32Array(rotationInterpolations));
      };
      tracksMap.get(vrm.model).push(positionTrack);
      tracksMap.get(vrm.model).push(quaternionTrack);
    });

    // Create morph tracks.
    this.morphsMap.forEach((morphs, blendShapeGroupName) => {
      const binds = blendShapeGroupNameToBinds.get(blendShapeGroupName);
      if (!binds) {
        return;
      }

      binds.forEach(bind => {
        const meshes = vrm.getSubMeshesByIndex(bind.mesh);
        meshes.forEach(mesh => {
          if (!tracksMap.has(mesh)) {
            tracksMap.set(mesh, []);
          }

          const times: number[] = [];
          const values: number[] = [];

          morphs.forEach(morph => {
            times.push(morph.time);
            values.push((bind.weight / 100) * morph.weight);
          });

          // True up the duration of tracks.
          if (times.length && times[times.length - 1] < this.duration) {
            times.push(this.duration);
            values.push(values[values.length - 1]);
          }

          tracksMap
            .get(mesh)
            .push(new THREE.NumberKeyframeTrack(`.morphTargetInfluences[morphTarget${bind.index}]`, times, values));
        });
      });
    });

    // Create AnimationClip from tracks.
    const vrmAnimationClip = new VRMAnimationClip();
    tracksMap.forEach((tracks, root) => {
      vrmAnimationClip.clips.push({ clip: new THREE.AnimationClip(THREE.Math.generateUUID(), -1, tracks), root });
    });
    return vrmAnimationClip;
  }
}

class VRMVMDMotion {
  public boneName: string;
  public humanBoneName: VRMHumanBoneName;
  public time: number;
  public position: THREE.Vector3;
  public rotation: THREE.Quaternion;
  public interpolation: number[];
}

class VRMVMDMorph {
  public blendShapeGroupName: string;
  public time: number;
  public weight: number;
}
