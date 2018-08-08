import * as React from 'react';
import * as THREE from 'three';
import * as VRM from '../../src';

const OrbitControls = require('three-orbitcontrols'); // tslint:disable-line:no-var-requires

interface Props {
  model: string;
  width: number;
  height: number;
  backgroundColor?: string;
}

export default class Viewer extends React.Component<Props, {}> {
  private isInitialized: boolean;
  private requestID: number;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: THREE.OrbitControls;
  private vrm: VRM.VRM;

  constructor(props: Props) {
    super(props);
    this.state = { isInitialized: false, isLoaded: false };

    this.isInitialized = false;

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
      <div style={{ width: this.props.width, height: this.props.height, margin: 0, padding: 0 }}>
        <canvas
          ref={c => {
            if (!c) {
              return;
            }
            this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.props.width, this.props.height);
          }}
          style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}
        />
      </div>
    );
  }

  private update() {
    this.requestID = window.requestAnimationFrame(this.update);
    this.renderScene();
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.props.backgroundColor || '#000000');

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 1, -2);
    this.scene.add(directionalLight);

    this.camera = new THREE.PerspectiveCamera(50, this.props.width / this.props.height);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement) as THREE.OrbitControls;
    this.controls.enablePan = false;
    this.controls.target.set(0, 1, 0);

    this.isInitialized = true;
  }

  private renderScene() {
    if (!this.isInitialized) {
      return;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private loadModel() {
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
    }

    const vrmLoader = new VRM.VRMLoader();

    vrmLoader.load(
      this.props.model,
      (vrm: VRM.VRM) => {
        this.vrm = vrm;
        this.modelDidLoad();
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

    this.scene.updateMatrixWorld(true);
    const headNodeIndex = this.vrm.humanoid.humanBones.find(humanBone => humanBone.bone === 'head').node;
    const headBone = this.vrm.nodes[headNodeIndex].object3d;
    const headY = headBone.getWorldPosition(new THREE.Vector3()).y;
    this.camera.position.set(0, headY, -headY);
    this.controls.target.set(0, 0.75 * headY, 0);

    this.renderScene();
  }
}
