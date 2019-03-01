import * as MMDParser from 'mmd-parser';
import * as React from 'react';
import DatGui, { DatBoolean, DatColor, DatFolder, DatNumber } from 'react-dat-gui';
import 'react-dat-gui/build/react-dat-gui.css';
import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import { VRM, VRMHumanoidUtils, VRMLoader } from '../../src';

interface Props {
  model: string;
  motion?: string;
  width: number;
  height: number;
}

interface State {
  isInitialized: boolean;
  isBusy: boolean;
  progress: number;
  data: any;
}

export default class Viewer extends React.Component<Props, State> {
  private requestID: number;
  private clock: THREE.Clock;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: THREE.OrbitControls;
  private helpers: THREE.Group;
  private vrm: VRM;
  private animationClip: THREE.AnimationClip;
  private animationMixers: THREE.AnimationMixer[];

  constructor(props: Props) {
    super(props);
    this.state = {
      isInitialized: false,
      isBusy: false,
      progress: 0,
      data: { background: '#212121', isAxesVisible: true },
    };

    this.clock = new THREE.Clock();
    this.animationMixers = [];

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

    // On motion changed.
    if (prevProps.motion !== this.props.motion) {
      this.loadMotion();
    }

    this.renderScene();
  }

  public render() {
    return (
      <>
        <div style={{ width: this.props.width, height: this.props.height, margin: 0, padding: 0, cursor: 'move' }}>
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
        {this.state.isBusy && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 'bold',
            }}
          >
            {`${Math.round(100 * this.state.progress)} %`}
          </div>
        )}
        {this.state.isInitialized && this.vrm && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, margin: '1rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            {this.vrm.meta.contactInformation ? (
              <a href={this.vrm.meta.contactInformation}>{this.vrm.meta.title}</a>
            ) : (
              this.vrm.meta.title
            )}
            {' by '}
            {this.vrm.meta.author}
          </div>
        )}
        <DatGui data={this.state.data} onUpdate={this.onDataUpdate}>
          <DatFolder title="Environment" closed={true}>
            <DatColor path="background" label="Background" />
            <DatBoolean path="isAxesVisible" label="Axes" />
          </DatFolder>
          <DatFolder title="Blend Shape Group" closed={true}>
            {this.vrm &&
              this.vrm.blendShapeMaster.blendShapeGroups.map((e, i) => (
                <DatNumber key={i} path={'blendShape' + e.name} label={e.name} min={0} max={1} step={0.01} />
              ))}
          </DatFolder>
        </DatGui>
      </>
    );
  }

  private onDataUpdate(data: any) {
    if (!this.state.isInitialized) {
      return;
    }

    if (data.background !== this.state.data.background) {
      this.scene.background = new THREE.Color(data.background);
    }

    if (data.isAxesVisible !== this.state.data.isAxesVisible) {
      this.helpers.visible = data.isAxesVisible;
    }

    this.vrm.blendShapeMaster.blendShapeGroups.forEach((e, i) => {
      if (data['blendShape' + e.name] !== this.state.data['blendShape' + e.name]) {
        this.vrm.setBlendShapeGroupWeight(i, data['blendShape' + e.name]);
      }
    });

    this.setState({ data });
  }

  private update() {
    this.requestID = window.requestAnimationFrame(this.update);
    const delta = this.clock.getDelta();

    this.animationMixers.forEach(e => {
      e.update(delta);
    });

    this.renderScene();
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.state.data.background);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 1, -2);
    this.scene.add(directionalLight);

    this.helpers = new THREE.Group();
    const gridHelper = new THREE.GridHelper(10, 10);
    const axesHelper = new THREE.AxesHelper(5);
    gridHelper.visible = this.state.data.isAxesVisible;
    axesHelper.visible = this.state.data.isAxesVisible;
    this.helpers.add(gridHelper);
    this.helpers.add(axesHelper);
    this.scene.add(this.helpers);

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
    this.setState({ isBusy: true, progress: 0 });

    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
    }
    this.animationMixers.length = 0;

    const vrmLoader = new VRMLoader();

    vrmLoader.load(
      this.props.model,
      (vrm: VRM) => {
        this.vrm = vrm;
        this.modelDidLoad();
        this.setState({ isBusy: false });
      },
      (progress: ProgressEvent) => {
        console.log('Loading model...', 100 * (progress.loaded / progress.total), '%');
        this.setState({ progress: progress.loaded / progress.total });
      },
      (error: ErrorEvent) => {
        console.error(error);
      }
    );
  }

  private modelDidLoad() {
    console.log('VRM', this.vrm);

    // console.log(this.vrm.humanoid.humanBones.map(e => [e.bone, this.vrm.getNode(e.node).type]));

    this.scene.add(this.vrm.scene);

    const headY = 1.5;
    this.camera.position.set(0, headY, -headY);
    this.controls.target.set(0, 0.75 * headY, 0);

    const data = this.state.data;
    this.vrm.blendShapeMaster.blendShapeGroups.forEach(e => {
      data['blendShape' + e.name] = 0;
    });
    this.setState({ data });

    this.vrm.scene.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.SkinnedMesh) {
        this.animationMixers.push(new THREE.AnimationMixer(object3d));
      }
    });
  }

  private loadMotion() {
    const fileLoader = new THREE.FileLoader();
    fileLoader.setResponseType('arraybuffer');
    fileLoader.load(this.props.motion, buffer => {
      const mmdParser = new MMDParser.Parser();
      const vmd = mmdParser.parseVmd(buffer);
      console.log('VMD', vmd);

      const motionsMap = new Map<number, any[]>();
      vmd.motions.forEach((motion: any) => {
        const humanBoneName = VRMHumanoidUtils.stringToHumanBoneName(motion.boneName);
        const humanBone = humanBoneName && this.vrm.humanoid.humanBones.find(e => humanBoneName === e.bone);
        if (humanBone === undefined) {
          return;
        }
        if (!motionsMap.has(humanBone.node)) {
          motionsMap.set(humanBone.node, []);
        }
        motionsMap.get(humanBone.node).push(motion);
      });
      motionsMap.forEach(array => {
        array.sort((a: any, b: any) => {
          return a.frameNum - b.frameNum;
        });
      });

      const tracks: THREE.KeyframeTrack[] = [];
      motionsMap.forEach((motions, nodeIndex) => {
        const bone = this.vrm.getNode(nodeIndex);

        const times: number[] = [];
        const positions: number[] = [];
        const rotations: number[] = [];
        // const positionInterpolations: number[] = [];
        // const rotationInterpolations: number[] = [];

        motions.forEach(motion => {
          times.push(motion.frameNum / 30);
          const bonePosition = bone.position.toArray();
          for (let i = 0; i < 3; i++) {
            positions.push(bonePosition[i] + motion.position[i] * 0.08);
          }
          for (let i = 0; i < 4; i++) {
            rotations.push(motion.rotation[i]);
          }
          // for (let i = 0; i < 3; i++) {
          //   positionInterpolations.push(
          //     motion.interpolation[i + 0] / 127,
          //     motion.interpolation[i + 8] / 127,
          //     motion.interpolation[i + 4] / 127,
          //     motion.interpolation[i + 12] / 127
          //   );
          // }
          // rotationInterpolations.push(
          //   motion.interpolation[3 + 0] / 127,
          //   motion.interpolation[3 + 8] / 127,
          //   motion.interpolation[3 + 4] / 127,
          //   motion.interpolation[3 + 12] / 127
          // );
        });

        if (times.length === 0) {
          return;
        }

        // TODO: Use interpolations.
        tracks.push(new THREE.VectorKeyframeTrack(`.bones[${bone.name}].position`, times, positions));
        tracks.push(new THREE.QuaternionKeyframeTrack(`.bones[${bone.name}].quaternion`, times, rotations));
      });

      this.animationClip = new THREE.AnimationClip(THREE.Math.generateUUID(), -1, tracks);
      this.motionDidLoad();
    });
  }

  private motionDidLoad() {
    console.log('AnimationClip', this.animationClip);
    if (this.animationMixers) {
      this.animationMixers.forEach(e => {
        const animationAction = e.clipAction(this.animationClip);
        animationAction.play();
      });
    }
  }
}
