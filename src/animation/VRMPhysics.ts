import * as THREE from 'three';
import { VRM } from '../data';

// cf. https://github.com/dwango/UniVRM/blob/master/Assets/VRM/UniVRM/Scripts/SpringBone/VRMSpringBone.cs
export class VRMPhysics {
  private vrm: VRM;
  private springBoneGroups: SpringBoneGroup[];
  private sphereColliderGroups: SphereColliderGroup[];

  constructor(vrm: VRM) {
    this.vrm = vrm;

    this.sphereColliderGroups = this.vrm.secondaryAnimation.colliderGroups.map(colliderGroup => {
      const group = new SphereColliderGroup(this.vrm.getNode(colliderGroup.node));
      colliderGroup.colliders.forEach(c => {
        group.createSphereCollider(new THREE.Vector3(c.offset.x, c.offset.y, c.offset.z), c.radius);
      });
      return group;
    });

    this.springBoneGroups = this.vrm.secondaryAnimation.boneGroups.map(boneGroup => {
      const g = new SpringBoneGroup();
      g.stiffnessForce = boneGroup.stiffiness;
      g.gravityPower = boneGroup.gravityPower;
      g.gravityDirection = new THREE.Vector3(
        boneGroup.gravityDir.x,
        boneGroup.gravityDir.y,
        boneGroup.gravityDir.z
      ).normalize();
      g.dragForce = boneGroup.dragForce;
      g.center = boneGroup.center !== -1 ? this.vrm.getNode(boneGroup.center) : undefined;
      g.hitRadius = boneGroup.hitRadius;
      boneGroup.bones.forEach(node => {
        this.vrm.getNode(node).traverse(object3d => {
          if (object3d.type === 'Bone') {
            g.springBones.push(new SpringBone(g, object3d as THREE.Bone));
          }
        });
      });
      g.colliderGroups = boneGroup.colliderGroups.map(index => this.sphereColliderGroups[index]);
      return g;
    });
  }

  public reset(): VRMPhysics {
    this.springBoneGroups.forEach(g => {
      g.reset();
    });
    return this;
  }

  public update(delta: number): VRMPhysics {
    this.sphereColliderGroups.forEach(g => {
      g.update();
    });
    this.springBoneGroups.forEach(g => {
      g.update(delta);
    });
    return this;
  }
}

class SpringBoneGroup {
  public stiffnessForce: number;
  public gravityPower: number;
  public gravityDirection: THREE.Vector3;
  public dragForce: number;
  public center: THREE.Object3D;
  public hitRadius: number;
  public springBones: SpringBone[];
  public colliderGroups: SphereColliderGroup[];

  constructor() {
    this.stiffnessForce = 1.0;
    this.gravityPower = 1.0;
    this.gravityDirection = new THREE.Vector3(0, -1, 0);
    this.dragForce = 0.4;
    this.hitRadius = 0.02;
    this.springBones = [];
    this.colliderGroups = [];
  }

  public reset() {
    this.springBones.forEach(springBone => {
      springBone.reset();
    });
  }

  public update(delta: number) {
    this.springBones.forEach(springBone => {
      springBone.update(delta);
    });
  }
}

class SpringBone {
  public group: SpringBoneGroup;
  public bone: THREE.Bone;

  private initialQuaternion: THREE.Quaternion;
  private previousTailWorldPosition: THREE.Vector3;
  private currentTailWorldPosition: THREE.Vector3;
  private length: number;
  private boneAxis: THREE.Vector3;

  constructor(group: SpringBoneGroup, bone: THREE.Bone) {
    this.group = group;
    this.bone = bone;

    this.initialQuaternion = bone.quaternion.clone();

    let childPosition;
    if (bone.children.length === 0) {
      const position = this.bone
        .getWorldPosition(new THREE.Vector3())
        .sub(this.bone.parent.getWorldPosition(new THREE.Vector3()))
        .multiplyScalar(0.07)
        .add(this.bone.getWorldPosition(new THREE.Vector3()));
      childPosition = this.bone.worldToLocal(position);
    } else {
      childPosition = this.bone.children[0].position.clone();
      const scale = this.bone.children[0].getWorldScale(new THREE.Vector3());
      childPosition.x *= scale.x;
      childPosition.y *= scale.y;
      childPosition.z *= scale.z;
    }

    const childWorldPosition = this.bone.localToWorld(childPosition.clone());
    this.currentTailWorldPosition = this.group.center
      ? this.group.center.worldToLocal(childWorldPosition)
      : childWorldPosition;
    this.previousTailWorldPosition = this.currentTailWorldPosition.clone();

    this.length = childPosition.length();
    this.boneAxis = childPosition.normalize();
  }

  public reset() {
    this.bone.setRotationFromQuaternion(this.initialQuaternion);
  }

  public update(delta: number) {
    const previousTail = this.group.center
      ? this.group.center.localToWorld(this.previousTailWorldPosition)
      : this.previousTailWorldPosition;
    const currentTail = this.group.center
      ? this.group.center.localToWorld(this.currentTailWorldPosition)
      : this.currentTailWorldPosition;

    // Calculate next position by Verlet integration.
    const nextTail = currentTail.clone();
    nextTail.add(
      currentTail
        .clone()
        .sub(previousTail)
        .multiplyScalar(1 - this.group.dragForce)
    );
    nextTail.add(
      this.boneAxis
        .clone()
        .applyQuaternion(this.bone.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(this.initialQuaternion))
        .multiplyScalar(delta * this.group.stiffnessForce)
    );
    nextTail.add(this.group.gravityDirection.clone().multiplyScalar(delta * this.group.gravityPower));

    // Fix the bone length.
    const worldPosition = this.bone.getWorldPosition(new THREE.Vector3());
    nextTail
      .sub(worldPosition)
      .normalize()
      .multiplyScalar(this.length)
      .add(worldPosition);

    // Move by colliders.
    //

    this.previousTailWorldPosition = this.group.center ? this.group.center.worldToLocal(currentTail) : currentTail;
    this.currentTailWorldPosition = this.group.center ? this.group.center.worldToLocal(nextTail) : nextTail;

    // Apply rotation.
    this.bone.setRotationFromQuaternion(this.tailPositionToQuaternion(nextTail));
  }

  private tailPositionToQuaternion(tailWorldPosition: THREE.Vector3): THREE.Quaternion {
    const q = this.bone.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(this.initialQuaternion);
    const vFrom = this.boneAxis
      .clone()
      .applyQuaternion(q)
      .normalize();
    const vTo = tailWorldPosition
      .clone()
      .sub(this.bone.getWorldPosition(new THREE.Vector3()))
      .normalize();
    return new THREE.Quaternion()
      .setFromUnitVectors(vFrom, vTo)
      .multiply(q)
      .premultiply(q.inverse());
  }
}

class SphereColliderGroup {
  public object3d: THREE.Object3D;
  public colliders: SphereCollider[];

  constructor(object3d: THREE.Object3D) {
    this.object3d = object3d;
    this.colliders = [];
  }

  public createSphereCollider(offset: THREE.Vector3, radius: number) {
    this.colliders.push(new SphereCollider(this, offset, radius));
  }

  public update() {
    this.colliders.forEach(collider => {
      collider.update();
    });
  }
}

class SphereCollider {
  private group: SphereColliderGroup;
  private offset: THREE.Vector3;
  private radius: number;
  private position: THREE.Vector3;

  constructor(group: SphereColliderGroup, offset: THREE.Vector3, radius: number) {
    this.group = group;
    this.offset = offset.clone();
    this.radius = radius;
    this.position = new THREE.Vector3();
    this.update();
  }

  public update() {
    this.group.object3d.getWorldPosition(this.position);
    this.position.add(this.offset);
  }

  public getRadius() {
    return this.radius;
  }

  public getWorldPosition(target: THREE.Vector3): THREE.Vector3 {
    return target.copy(this.position);
  }
}
