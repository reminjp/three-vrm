import * as THREE from 'three';

export function createCreateInterpolant(
  parameterPositions: number[],
  sampleValues: number[],
  sampleSize: number,
  params: number[]
) {
  return (result: number[]) => {
    return new CubicBezierInterpolation(parameterPositions, sampleValues, sampleSize, result, new Float32Array(params));
  };
}

// https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/MMDLoader.js
export class CubicBezierInterpolation extends THREE.Interpolant {
  private interpolationParams: Float32Array;

  constructor(
    parameterPositions: number[],
    sampleValues: number[],
    sampleSize: number,
    resultBuffer: number[],
    params: Float32Array
  ) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
    this.interpolationParams = params;
  }

  public interpolate_(i1: number, t0: number, t: number, t1: number) {
    const result = this.resultBuffer;
    const values = (this as any).sampleValues; // TODO: Upgrade three.js
    const stride = this.valueSize;
    const params = this.interpolationParams;

    const offset1 = i1 * stride;
    const offset0 = offset1 - stride;

    // No interpolation if next key frame is in one frame in 30fps.
    // This is from MMD animation spec.
    // '1.5' is for precision loss. times are Float32 in Three.js Animation system.
    const weight1 = t1 - t0 < (1 / 30) * 1.5 ? 0.0 : (t - t0) / (t1 - t0);

    if (stride === 4) {
      // Quaternion
      const x1 = params[i1 * 4 + 0];
      const x2 = params[i1 * 4 + 1];
      const y1 = params[i1 * 4 + 2];
      const y2 = params[i1 * 4 + 3];

      const ratio = this._calculate(x1, x2, y1, y2, weight1);

      THREE.Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
    } else if (stride === 3) {
      // Vector3
      for (let i = 0; i !== stride; ++i) {
        const x1 = params[i1 * 12 + i * 4 + 0];
        const x2 = params[i1 * 12 + i * 4 + 1];
        const y1 = params[i1 * 12 + i * 4 + 2];
        const y2 = params[i1 * 12 + i * 4 + 3];

        const ratio = this._calculate(x1, x2, y1, y2, weight1);

        result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
      }
    } else {
      // Number
      const x1 = params[i1 * 4 + 0];
      const x2 = params[i1 * 4 + 1];
      const y1 = params[i1 * 4 + 2];
      const y2 = params[i1 * 4 + 3];

      const ratio = this._calculate(x1, x2, y1, y2, weight1);

      result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
    }

    return result;
  }

  private _calculate(x1: number, x2: number, y1: number, y2: number, x: number) {
    let c = 0.5;
    let t = c;
    let s = 1.0 - t;
    const loop = 15;
    const eps = 1e-5;
    const math = Math;

    let sst3;
    let stt3;
    let ttt;

    for (let i = 0; i < loop; i++) {
      sst3 = 3.0 * s * s * t;
      stt3 = 3.0 * s * t * t;
      ttt = t * t * t;

      const ft = sst3 * x1 + stt3 * x2 + ttt - x;

      if (math.abs(ft) < eps) {
        break;
      }

      c /= 2.0;

      t += ft < 0 ? c : -c;
      s = 1.0 - t;
    }

    return sst3 * y1 + stt3 * y2 + ttt;
  }
}
