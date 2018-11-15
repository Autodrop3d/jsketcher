import {Face3, FaceColors, Geometry, Mesh, MeshBasicMaterial, MeshPhongMaterial} from 'three';
import {advancePseudoFrenetFrame, frenetFrame, pseudoFrenetFrame} from '../../../web/app/brep/geom/curves/frenetFrame';
import * as vec from '../../../web/app/math/vec';
import {viewScaleFactor} from '../scaleHelper';
import {arrToThree} from 'math/vectorAdapters';
import {ORIGIN} from '../../../web/app/math/l3space';
import {getSceneSetup} from '../sceneSetup';
import calcFaceNormal from '../utils/calcFaceNormal';

export default class ScalableLine extends Mesh {

  constructor(tesselation, width, color, opacity, smooth, ambient) {
    super(createGeometry(tesselation, smooth), createMaterial(color, opacity, ambient));
    this.width = width;
    this.morphTargetInfluences[0] = 0;
  }

  updateMatrix() {
    let sceneSetup = getSceneSetup(this);
    if (!sceneSetup) {
      return;
    }
    let modelSize = 1;
    let modelSizePx = this.width;
    let k = viewScaleFactor(sceneSetup, ORIGIN, modelSizePx, modelSize);
    let morphDistance = (k * modelSize - modelSize) / 2;
    this.morphTargetInfluences[0] = morphDistance / morphBase;
    super.updateMatrix();
  }
  
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

function createMaterial(color, opacity, ambient) {
  let materialParams = {
    vertexColors: FaceColors,
    morphTargets: true,
    color,
  };
  if (!ambient) {
    materialParams.shininess = 0;
  }
  if (opacity !== undefined) {
    materialParams.transparent = true;
    materialParams.opacity = opacity;
  }
  return ambient ? new MeshBasicMaterial(materialParams) : new MeshPhongMaterial(materialParams);
}

function createGeometry(tessellation, smooth) {
  const width = 1;
  const geometry = new Geometry();
  const scaleTargets = [];
  const morphBase = 10;
  geometry.dynamic = true;
  let tess = tessellation;

  // let frames = [pseudoFrenetFrame(edge.curve.tangentAtPoint(new Vector().set3(tess[0])).data())];
  let frames = [pseudoFrenetFrame(vec._normalize(vec.sub(tess[1], tess[0])))];
  // let frames = [calcFrame(tess[0]) || pseudoFrenetFrame(edge.curve.tangentAtPoint(new Vector().set3(tess[0])).data())];

  for (let i = 1; i < tess.length; i++) {
    let a = tess[i - 1];
    let b = tess[i];
    let ab = vec._normalize(vec.sub(b, a));
    let prevFrame = frames[i - 1];
    let T = vec._normalize(vec.add(prevFrame[0], ab));
    // frames.push(calcFrame(b) || advancePseudoFrenetFrame(prevFrame, T));
    frames.push(advancePseudoFrenetFrame(prevFrame, T));
  }

  let axises = frames.map(([T, N, B]) => {
    let dirs = [];
    dirs[0] = N;
    dirs[1] = B;
    dirs[2] = vec.negate(dirs[0]);
    dirs[3] = vec.negate(dirs[1]);
    return dirs;
  });

  let normals = smooth ? [] : null;

  axises.forEach((dirs, i) => {
    dirs.forEach(dir => {
      geometry.vertices.push(arrToThree(vec._add(vec.mul(dir, width), tess[i])));
      scaleTargets.push(arrToThree(vec._add(vec.mul(dir, width + morphBase), tess[i])));
      if (smooth) {
        normals.push(arrToThree(dir));
      }
    });

  });

  for (let i = 0; i < tess.length - 1; i++) {
    let off = 4 * i;
    [
      [0, 4, 3],
      [3, 4, 7],
      [2, 3, 7],
      [7, 6, 2],
      [0, 1, 5],
      [5, 4, 0],
      [1, 2, 6],
      [6, 5, 1],
    ].forEach(([a, b, c]) => {
      let vertexNormales = smooth ? [normals[a + off], normals[b + off], normals[c + off]] : undefined;
      let face = new Face3(a + off, b + off, c + off, vertexNormales);
      geometry.faces.push(face);
      if (!smooth) {
        calcFaceNormal(face, geometry.vertices);
      }
    });
  }

  let startNormal = arrToThree(frames[0][0]).negate();
  geometry.faces.push(new Face3(2, 1, 0, startNormal));
  geometry.faces.push(new Face3(0, 3, 2, startNormal));

  let endNormal = arrToThree(frames[frames.length - 1][0]);
  let n = frames.length * 4 - 1;
  geometry.faces.push(new Face3(n - 2, n - 1, n, endNormal));
  geometry.faces.push(new Face3(n, n - 3, n - 2, endNormal));

  geometry.morphTargets.push({name: 'scaleTargets', vertices: scaleTargets});
  return geometry;
}

const morphBase = 10;