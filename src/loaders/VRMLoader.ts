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
              if (property.shader === 'VRM/UnlitTexture') {
                return new THREE.MeshBasicMaterial({
                  color: 'color' in gltfMaterial && gltfMaterial.color,
                  map: 'map' in gltfMaterial && gltfMaterial.map,
                  lights: false,
                  alphaTest: 0,
                  skinning: true,
                });
              }

              // if (property.shader === 'VRM/UnlitCutout') {
              // }

              // if (property.shader === 'VRM/UnlitTransparent') {
              // }

              // if (property.shader === 'VRM/UnlitTransparentZWrite') {
              // }

              // TODO: Implement with ShaderMaterial.
              if (property.shader === 'VRM/MToon') {
                const center = Math.max(0, Math.min(1, (1 + property.floatProperties._ShadeShift) / 2));
                const delta = Math.max(0, Math.min(1, 1 - property.floatProperties._ShadeToony));

                const lightColor = new THREE.Color(1, 1, 1);
                const shadeColor = new THREE.Color(
                  property.vectorProperties._ShadeColor[0],
                  property.vectorProperties._ShadeColor[1],
                  property.vectorProperties._ShadeColor[2]
                );

                const size = 256;
                const data = new Uint8Array(3 * size);
                const color = new THREE.Color();

                for (let i = 0; i < size; i++) {
                  const stride = 3 * i;
                  const t = Math.max(0, Math.min(1, (i / size - center + delta / 2) / delta));
                  color.addColors(shadeColor.clone().multiplyScalar(1 - t), lightColor.clone().multiplyScalar(t));
                  data[stride + 0] = Math.floor(255 * color.r);
                  data[stride + 1] = Math.floor(255 * color.g);
                  data[stride + 2] = Math.floor(255 * color.b);
                }
                const texture = new THREE.DataTexture(data, size, 1, THREE.RGBFormat);
                texture.needsUpdate = true;

                // MeshToonMaterial is not defined in @types/three.
                return new (THREE as any).MeshToonMaterial({
                  color: 'color' in gltfMaterial && gltfMaterial.color,
                  map: 'map' in gltfMaterial && gltfMaterial.map,
                  lights: true,
                  shininess: false,
                  alphaTest: 0.5,
                  skinning: true,
                  gradientMap: texture,
                }) as THREE.MeshPhongMaterial;
              }

              return gltfMaterial;
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
