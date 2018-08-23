import * as React from 'react';
import * as THREE from 'three';
import * as VRM from '../../src';

import '../../node_modules/react-dat-gui/build/react-dat-gui.css';

const DatGui = require('react-dat-gui'); // tslint:disable-line:no-var-requires
const OrbitControls = require('three-orbitcontrols'); // tslint:disable-line:no-var-requires

interface Props {
  model: string;
  width: number;
  height: number;
  backgroundColor?: string;
}

interface State {
  isInitialized: boolean;
  isBusy: boolean;
  data: any;
}

export default class Viewer extends React.Component<Props, State> {
  private requestID: number;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: THREE.OrbitControls;
  private vrm: VRM.VRM;

  private lastUpdateTimeStamp: number;

  constructor(props: Props) {
    super(props);
    this.state = { isInitialized: false, isBusy: false, data: {} };

    this.onDataUpdate = this.onDataUpdate.bind(this);
    this.update = this.update.bind(this);
  }

  public componentDidMount() {
    this.initScene();
    this.loadModel();
    this.update();
  }

  public componentWillUnmount() {
    window.cancelAnimationFrame(this.requestID);
  }

  public componentDidUpdate(prevProps: Props) {
    // On screen resized.
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      console.log('Resize', 'width', this.props.width, 'height', this.props.height);

      if (this.renderer) {
        this.renderer.setSize(this.props.width, this.props.height);
      }

      if (this.camera) {
        this.camera.aspect = this.props.width / this.props.height;
        this.camera.updateProjectionMatrix();
      }
    }

    // On model changed.
    if (prevProps.model !== this.props.model) {
      this.loadModel();
    }

    this.renderScene();
  }

  public render() {
    return (
      <>
        <div style={{ width: this.props.width, height: this.props.height, margin: 0, padding: 0 }}>
          <canvas
            ref={c => {
              if (!c) {
                return;
              }

              if (this.renderer && c === this.renderer.domElement) {
                const size = this.renderer.getSize();
                if (this.props.width !== size.width || this.props.height !== size.height) {
                  this.renderer.setSize(this.props.width, this.props.height);
                }
                return;
              }

              this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true });
              this.renderer.setPixelRatio(window.devicePixelRatio);
              this.renderer.setSize(this.props.width, this.props.height);
            }}
            style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}
          />
        </div>
        <DatGui.default data={this.state.data} onUpdate={this.onDataUpdate}>
          <DatGui.DatFolder title="Blend Shape">
            {this.vrm &&
              this.vrm.blendShapeMaster.blendShapeGroups.map((e, i) => (
                <DatGui.DatNumber key={i} path={'blendShape' + e.name} label={e.name} min={0} max={1} step={0.01} />
              ))}
          </DatGui.DatFolder>
        </DatGui.default>
      </>
    );
  }

  private onDataUpdate(data: any) {
    if (this.state.isInitialized) {
      this.vrm.blendShapeMaster.blendShapeGroups.forEach((e, i) => {
        if (data['blendShape' + e.name] !== this.state.data['blendShape' + e.name]) {
          this.vrm.setBlendShapeWeight(i, data['blendShape' + e.name]);
        }
      });
    }

    this.setState({ data });
  }

  private update(timeStamp?: number) {
    this.requestID = window.requestAnimationFrame(this.update);

    if (timeStamp !== undefined) {
      if (this.lastUpdateTimeStamp !== undefined) {
        // const deltaTime = timeStamp - this.lastUpdateTimeStamp;
      }

      this.lastUpdateTimeStamp = timeStamp;
    }

    this.renderScene();
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.props.backgroundColor || '#000000');

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 1, -2);
    this.scene.add(directionalLight);

    const axesHelper = new THREE.AxesHelper(1000);
    this.scene.add(axesHelper);

    this.camera = new THREE.PerspectiveCamera(50, this.props.width / this.props.height, 0.01);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement) as THREE.OrbitControls;
    (this.controls as any).screenSpacePanning = true;
    this.controls.target.set(0, 1, 0);

    this.setState({ isInitialized: true });
  }

  private renderScene() {
    if (!this.state.isInitialized) {
      return;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private loadModel() {
    if (this.state.isBusy) {
      return;
    }
    this.setState({ isBusy: true });

    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
    }

    const vrmLoader = new VRM.VRMLoader();

    vrmLoader.load(
      this.props.model,
      (vrm: VRM.VRM) => {
        this.vrm = vrm;
        this.modelDidLoad();
        this.setState({ isBusy: false });
      },
      (progress: ProgressEvent) => {
        console.log('Loading model...', 100 * (progress.loaded / progress.total), '%');
      },
      (error: ErrorEvent) => {
        console.error(error);
      }
    );
  }

  private modelDidLoad() {
    console.log('VRM', this.vrm);

    this.scene.add(this.vrm.scene);

    const headY = 1.5;
    this.camera.position.set(0, headY, -headY);
    this.controls.target.set(0, 0.75 * headY, 0);

    const data = this.state.data;
    this.vrm.blendShapeMaster.blendShapeGroups.forEach(e => {
      data['blendShape' + e.name] = 0;
    });
    this.setState({ data });
  }
}