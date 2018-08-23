# three-vrm

[![Latest NPM release][npm-badge]][npm-badge-url]
[![License][license-badge]][license-badge-url]

**This package is still under development.**
**The usage may be destructively changed.**

TypeScript/JavaScript implementation of [VRM](https://dwango.github.io/en/vrm/) for three.js.

[VRM](https://dwango.github.io/vrm/) 形式の 3D モデルを three.js で使用するためのパッケージです。

## Dependencies

- [three.js](https://github.com/mrdoob/three.js/)

```sh
yarn add three
```

## Usage

Install the [package][npm-badge-url] from `npm` and import it.

```sh
yarn add three-vrm
```

This code loads a VRM file with `VRMLoader`.
You have to create a `Scene`, a `Camera`, and a `WebGLRenderer` to render the VRM.
See the usage of [three.js](https://github.com/mrdoob/three.js/).

```ts
import * as THREE from 'three';
import { VRM, VRMLoader } from 'three-vrm';

const scene = new THREE.Scene();

const vrmLoader = new VRMLoader();

vrmLoader.load(
  'model.vrm',
  (vrm: VRM) => {
    console.log(vrm);
    scene.add(vrm.scene);
  },
  (progress: ProgressEvent) => {
    console.log(progress.loaded / progress.total);
  },
  (error: ErrorEvent) => {
    console.error(error);
  }
);
```

Alternatively, if you load three.js in your HTML, you may download `node_modules/three-vrm/lib/index.js` and include it.

```html
<script src="js/three.min.js"></script>
<script src="js/vrm.js"></script>
<script>
  var scene = new THREE.Scene();

  var vrmLoader = new THREEVRM.VRMLoader();

  ...
</script>
```

### VRMLoader

A loader for VRM resources.

`VRMLoader( manager?: THREE.LoadingManager )`

Creates a new VRMLoader.

`.load ( url: string, onLoad?: Function, onProgress?: Function, onError?: Function ) : void`

Loads a VRM model.

### VRM

VRM model data.

`.asset : object`

A glTF asset property.

`.scene : THREE.Scene`

A `Scene`.

`.parser : object`

A `GLTFParser` created by `GLTFLoader`.

`.userData: object`

A dictionary object with extension data.

`.materialProperties : Array`

VRM material properties.

`.humanoid : object`

VRM bone mapping.

`.meta : object`

VRM model information.

`.blendShapeMaster : object`

VRM blendShapeMaster with an array of BlendShapeGroups to group BlendShape.

`.firstPerson : object`

VRM first-person settings.

`.secondaryAnimation : object`

VRM swaying object settings.

## Development

```sh
yarn
yarn start
```

Open `localhost:8080` with a browser.

## License

[MIT](./LICENSE)

[npm-badge]: https://img.shields.io/npm/v/three-vrm.svg
[npm-badge-url]: https://www.npmjs.com/package/three-vrm
[license-badge]: https://img.shields.io/npm/l/three-vrm.svg
[license-badge-url]: ./LICENSE
