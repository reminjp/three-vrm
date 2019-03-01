import * as React from 'react';
import { render } from 'react-dom';
import Dropzone from 'react-dropzone';
import ReactResizeDetector from 'react-resize-detector';
import Viewer from './Viewer';

const aliciaSolidModel: string = require('../res/AliciaSolid.vrm'); // tslint:disable-line:no-var-requires
const shibuSendagayaModel: string = require('../res/ShibuSendagaya.vrm'); // tslint:disable-line:no-var-requires
const wavefileMotion: string = require('../res/wavefile_v2.vmd'); // tslint:disable-line:no-var-requires

interface State {
  model: string;
  motion?: string;
}

class App extends React.Component<{}, State> {
  private objectURL: string;

  constructor(props: {}) {
    super(props);
    this.state = { model: aliciaSolidModel };

    this.onDrop = this.onDrop.bind(this);
    this.showAliciaSolidModel = this.showAliciaSolidModel.bind(this);
    this.showShibuSendagayaModel = this.showShibuSendagayaModel.bind(this);
    this.showWavefileMotion = this.showWavefileMotion.bind(this);
  }

  public render() {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Dropzone accept=".vrm" disableClick={true} multiple={false} onDrop={this.onDrop}>
          {({ getRootProps }) => (
            <div {...getRootProps()} style={{ width: '100%', height: '100%', border: 'none' }}>
              <ReactResizeDetector handleWidth={true} handleHeight={true}>
                {(width?: number, height?: number) => (
                  <Viewer
                    model={this.state.model}
                    motion={this.state.motion}
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
          <p>
            <a onClick={this.showAliciaSolidModel}>Alicia Solid (.vrm)</a>
          </p>
          <p>
            <a onClick={this.showShibuSendagayaModel}>Shibu Sendagaya (.vrm)</a>
          </p>
          <p>
            <a onClick={this.showWavefileMotion}>[WIP] WAVEFILE (.vmd)</a>
          </p>
        </div>
      </div>
    );
  }

  public onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
    if (acceptedFiles.length) {
      if (this.objectURL) {
        URL.revokeObjectURL(this.objectURL);
      }
      this.objectURL = URL.createObjectURL(acceptedFiles[0]);
      switch (acceptedFiles[0].name.split('.').pop()) {
        case 'vrm': {
          this.setState({ model: this.objectURL });
          break;
        }
        case 'vmd': {
          this.setState({ motion: this.objectURL });
          break;
        }
      }
    }
  }

  private showAliciaSolidModel() {
    this.setState({ model: aliciaSolidModel });
  }

  private showShibuSendagayaModel() {
    this.setState({ model: shibuSendagayaModel });
  }

  private showWavefileMotion() {
    this.setState({ motion: wavefileMotion });
  }
}

render(<App />, document.getElementById('root'));
