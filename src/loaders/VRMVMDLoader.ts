import * as MMDParser from 'mmd-parser';
import * as THREE from 'three';
import { VRMVMD } from '../animation';

export class VRMVMDLoader {
  private fileLoader: THREE.FileLoader;

  constructor(manager?: THREE.LoadingManager) {
    this.fileLoader = new THREE.FileLoader(manager);
  }

  public load(
    url: string,
    onLoad?: (vmd: VRMVMD) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    this.fileLoader.setResponseType('arraybuffer');
    this.fileLoader.load(
      url,
      buffer => {
        const mmdParser = new MMDParser.Parser();
        const object = mmdParser.parseVmd(buffer, true);
        // TODO: Call onProgress.
        onLoad(new VRMVMD(object));
      },
      onProgress,
      onError
    );
  }
}
