import * as React from 'react';
import { render } from 'react-dom';
import Dropzone from 'react-dropzone';
import ReactResizeDetector from 'react-resize-detector';
import Viewer from './Viewer';

const sampleModel: string = require('../res/AliciaSolid.vrm'); // tslint:disable-line:no-var-requires

interface State {
  model: string;
}

class App extends React.Component<{}, State> {
  private objectURL: string;

  constructor(props: {}) {
    super(props);
    this.state = { model: sampleModel };

    this.onDrop = this.onDrop.bind(this);
  }

  public render() {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Dropzone
          accept=".vrm"
          disableClick={true}
          disablePreview={true}
          multiple={false}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onDrop={this.onDrop}
        >
          <ReactResizeDetector handleWidth={true} handleHeight={true}>
            {(width?: number, height?: number) => (
              <Viewer
                model={this.state.model}
                width={width || window.innerWidth}
                height={height || window.innerHeight}
                backgroundColor={'#212121'}
              />
            )}
          </ReactResizeDetector>
        </Dropzone>
        <div style={{ position: 'fixed', top: 0, left: 0, margin: '1rem', color: '#ffffff' }}>
          <h1>
            <a href="https://github.com/rdrgn/three-vrm">three-vrm</a> example
          </h1>
          <p>Drop .vrm file to preview.</p>
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
      this.setState({ model: this.objectURL });
    }
  }
}

render(<App />, document.getElementById('root'));
