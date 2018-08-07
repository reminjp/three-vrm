# three-vrm

TypeScript/JavaScript implementation of VRMLoader in three.js.

## Dependencies

- [three.js](https://github.com/mrdoob/three.js/)

```sh
yarn add three
```

## Usage

```sh
yarn add three-vrm
```

```ts
import { VRM, VRMLoader } from 'three-vrm';

const vrmLoader = new VRMLoader();

vrmLoader.load(
  'MyModel.vrm',
  (vrm: VRM) => {
    console.log(vrm);
    myScene.add(vrm.scene);
  },
  (progress: ProgressEvent) => {
    console.log(`Loading... (${100 * (progress.loaded / progress.total)} %)`);
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
