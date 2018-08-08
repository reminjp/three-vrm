import * as THREE from 'three';
import { BlendShapeMaster } from '../data/BlendShapeMaster';
import { FirstPerson } from '../data/FirstPerson';
import { Humanoid } from '../data/Humanoid';
import { MaterialProperty } from '../data/MaterialProperty';
import { Meta } from '../data/Meta';
import { SecondaryAnimation } from '../data/SecondaryAnimation';
import { Node, VRM } from '../data/VRM';

const GLTFLoader = require('three-gltf-loader'); // tslint:disable-line:no-var-requires

export class VRMLoader {
  private manager: THREE.LoadingManager;
  private gltfLoader: any;

  constructor(manager?: THREE.LoadingManager) {
    this.manager = manager || THREE.DefaultLoadingManager;
    this.gltfLoader = new GLTFLoader(this.manager);
  }

  public load(
    url: string,
    onLoad?: (vrm: VRM) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    this.gltfLoader.load(
      url,
      (gltf: any) => {
        const vrm = new VRM();

        Object.assign(vrm, gltf);

        vrm.materialProperties = gltf.userData.gltfExtensions.VRM.materialProperties as MaterialProperty[];
        vrm.humanoid = gltf.userData.gltfExtensions.VRM.humanoid as Humanoid;
        vrm.meta = gltf.userData.gltfExtensions.VRM.meta as Meta;
        vrm.blendShapeMaster = gltf.userData.gltfExtensions.VRM.blendShapeMaster as BlendShapeMaster;
        vrm.firstPerson = gltf.userData.gltfExtensions.VRM.firstPerson as FirstPerson;
        vrm.secondaryAnimation = gltf.userData.gltfExtensions.VRM.secondaryAnimation as SecondaryAnimation;

        // Create an array of glTF nodes.
        const namedObjects: Map<string, THREE.Object3D> = new Map();
        vrm.scene.traverse((object: THREE.Object3D) => {
          namedObjects.set(object.name, object);
        });
        vrm.nodes = vrm.parser.json.nodes.map((nodeJson: any) => {
          const node = new Node();
          node.name = nodeJson.name;
          node.children = nodeJson.children && [].concat(nodeJson.children);
          node.object3d = nodeJson.name && namedObjects.get(nodeJson.name);
          return node;
        });

        // Convert materials.
        vrm.scene.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            const toVRMMaterial = (gltfMaterial: THREE.MeshMaterialType) => {
              const property = vrm.materialProperties.find(p => p.name === gltfMaterial.name);

              if (!property) {
                return gltfMaterial;
              }

              // TODO: Support VRM shaders.

              // if (property.shader === 'VRM/UnlitTexture') {
              // }

              // if (property.shader === 'VRM/UnlitCutout') {
              // }

              // if (property.shader === 'VRM/UnlitTransparent') {
              // }

              // if (property.shader === 'VRM/UnlitTransparentZWrite') {
              // }

              // if (property.shader === 'VRM/MToon') {
              // }

              const material = new THREE.MeshBasicMaterial();
              if ('color' in gltfMaterial) {
                material.color = gltfMaterial.color;
              }
              if ('map' in gltfMaterial) {
                material.map = gltfMaterial.map;
              }
              material.lights = false;
              material.alphaTest = 0.5;
              material.skinning = true;
              return material;

              // return gltfMaterial;
            };

            if (Array.isArray(object.material)) {
              object.material = object.material.map(m => toVRMMaterial(m));
            } else {
              object.material = toVRMMaterial(object.material);
            }
          }
        });

        onLoad(vrm);
      },
      onProgress,
      onError
    );
  }

  public setCrossOrigin(crossOrigin: string) {
    this.gltfLoader.setCrossOrigin(crossOrigin);
    return this;
  }

  public setPath(path: string) {
    this.gltfLoader.setPath(path);
    return this;
  }

  public setDRACOLoader(dracoLoader: any) {
    this.gltfLoader.setDRACOLoader(dracoLoader);
    return this;
  }
}
