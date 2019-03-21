import * as MMDParser from 'mmd-parser';
import * as THREE from 'three';
import { VMD } from '../data';

export class VMDLoader {
  private fileLoader: THREE.FileLoader;

  constructor(manager?: THREE.LoadingManager) {
    this.fileLoader = new THREE.FileLoader(manager);
  }

  public load(
    url: string,
    onLoad?: (vmd: VMD) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    this.fileLoader.setResponseType('arraybuffer');
    this.fileLoader.load(
      url,
      buffer => {
        const mmdParser = new MMDParser.Parser();
        const object = mmdParser.parseVmd(buffer, true);
        onLoad(new VMD().fromObject(object));
      },
      onProgress,
      onError
    );
  }
}
