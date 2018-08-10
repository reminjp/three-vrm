# three-vrm

**This package is still under development. The usage may be changed.**

TypeScript/JavaScript implementation of VRM for three.js.

## Dependencies

- [three.js](https://github.com/mrdoob/three.js/)

```sh
yarn add three
```

## Usage

Install the [package](https://www.npmjs.com/package/three-vrm) and import it.

```sh
yarn add three-vrm
```

Load a VRM file with `VRMLoader`.

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

## Development

```sh
yarn
yarn start
```

Open `localhost:8080` with a browser.

## License

[MIT](./LICENSE)
