import * as React from 'react';
import { render } from 'react-dom';
import Dropzone from 'react-dropzone';
import ReactResizeDetector from 'react-resize-detector';
import { BarLoader } from 'react-spinners';
import { VRM, VRMLoader, VRMVMD, VRMVMDLoader } from '../../src';
import Viewer from './Viewer';

const aliciaSolidModel: string = require('../res/alicia_solid.vrm'); // tslint:disable-line:no-var-requires
const shibuSendagayaModel: string = require('../res/shibu_sendagaya.vrm'); // tslint:disable-line:no-var-requires
const cubeTestModel: string = require('../res/cube_test.vrm'); // tslint:disable-line:no-var-requires
const wavefileMotion: string = require('../res/wavefile_v2.vmd'); // tslint:disable-line:no-var-requires

interface State {
  isBusy: boolean;
  progress: number;
  vrm?: VRM;
  vmd?: VRMVMD;
}

class App extends React.Component<{}, State> {
  private objectURL: string;

  constructor(props: {}) {
    super(props);
    this.state = { isBusy: false, progress: 0 };

    this.onDrop = this.onDrop.bind(this);
    this.showCubeTestModel = this.showCubeTestModel.bind(this);
    this.showAliciaSolidModel = this.showAliciaSolidModel.bind(this);
    this.showShibuSendagayaModel = this.showShibuSendagayaModel.bind(this);
    this.showWavefileMotion = this.showWavefileMotion.bind(this);
  }

  public componentDidMount() {
    this.loadVRM(shibuSendagayaModel);
  }

  public render() {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Dropzone accept=".vrm,.vmd" disableClick={true} multiple={false} onDrop={this.onDrop}>
          {({ getRootProps }) => (
            <div {...getRootProps()} style={{ width: '100%', height: '100%', border: 'none' }}>
              <ReactResizeDetector handleWidth={true} handleHeight={true}>
                {(width?: number, height?: number) => (
                  <Viewer
                    vrm={this.state.vrm}
                    vmd={this.state.vmd}
                    width={width || window.innerWidth}
                    height={height || window.innerHeight}
                  />
                )}
              </ReactResizeDetector>
            </div>
          )}
        </Dropzone>

        <div style={{ position: 'fixed', top: 0, left: 0, margin: '1rem', color: '#ffffff' }}>
          <h1>
            <a href="https://github.com/rdrgn/three-vrm">three-vrm</a> example
          </h1>
          <p>Drop .vrm file to preview.</p>
          <h2>Sample Models (VRM)</h2>
          <p>
            <a onClick={this.showAliciaSolidModel}>Alicia Solid</a>
          </p>
          <p>
            <a onClick={this.showShibuSendagayaModel}>Shibu Sendagaya</a>
          </p>
          <p>
            <a onClick={this.showCubeTestModel}>Cube Test</a>
          </p>
          <h2>Sample Motions (VMD)</h2>
          <p>
            <a onClick={this.showWavefileMotion}>[WIP] WAVEFILE</a>
          </p>
        </div>

        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <BarLoader color={'#9e9e9e'} loading={this.state.isBusy} />
        </div>
      </div>
    );
  }

  private onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
    if (acceptedFiles.length) {
      if (this.state.isBusy) {
        return;
      }
      // this.setState({ isBusy: true, progress: 0 });

      if (this.objectURL) {
        URL.revokeObjectURL(this.objectURL);
      }
      this.objectURL = URL.createObjectURL(acceptedFiles[0]);

      switch (acceptedFiles[0].name.split('.').pop()) {
        case 'vrm': {
          this.loadVRM(this.objectURL);
          break;
        }
        case 'vmd': {
          this.loadVMD(this.objectURL);
          break;
        }
      }
    }
  }

  private loadVRM(url: string) {
    this.setState({ isBusy: true, progress: 0 });
    new VRMLoader().load(
      url,
      (vrm: VRM) => {
        console.log('VRM', vrm);
        this.setState({ isBusy: false, vrm });
      },
      (progress: ProgressEvent) => {
        console.log('Loading VRM...', 100 * (progress.loaded / progress.total), '%');
        this.setState({ progress: progress.loaded / progress.total });
      },
      (error: ErrorEvent) => {
        console.error(error);
        this.setState({ isBusy: false });
      }
    );
  }

  private loadVMD(url: string) {
    this.setState({ isBusy: true, progress: 0 });
    new VRMVMDLoader().load(
      url,
      (vmd: VRMVMD) => {
        console.log('VMD', vmd);
        this.setState({ isBusy: false, vmd });
      },
      (progress: ProgressEvent) => {
        console.log('Loading VMD...', 100 * (progress.loaded / progress.total), '%');
        this.setState({ progress: progress.loaded / progress.total });
      },
      (error: ErrorEvent) => {
        console.error(error);
        this.setState({ isBusy: false });
      }
    );
  }

  private showCubeTestModel() {
    this.loadVRM(cubeTestModel);
  }

  private showAliciaSolidModel() {
    this.loadVRM(aliciaSolidModel);
  }

  private showShibuSendagayaModel() {
    this.loadVRM(shibuSendagayaModel);
  }

  private showWavefileMotion() {
    this.loadVMD(wavefileMotion);
  }
}

render(<App />, document.getElementById('root'));
