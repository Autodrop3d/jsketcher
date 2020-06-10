import {MObject} from './mobject';
import Vector from 'math/vector';
import {BasisForPlane} from '../../math/l3space';
import {MSketchObject} from './msketchObject';
import {EMPTY_ARRAY} from 'gems/iterables';
import CSys from '../../math/csys';
import {MSketchLoop} from './mloop';
import {ProductionInfo} from './productionInfo';
import {MBrepShell, MShell} from "./mshell";

export class MFace extends MObject {

  static TYPE = 'face';
  shell: MShell;
  surface: any;
  sketchObjects: MSketchObject[];
  sketchLoops: MSketchLoop[];
  sketch: any;
  brepFace: any;

  private _csys: any;
  private w: number;
  private _basis: [Vector, Vector, Vector];
  private _sketchToWorldTransformation: any;
  private _worldToSketchTransformation: any;
  private _productionInfo: any;

  constructor(id, shell, surface, csys?) {
    super(MFace.TYPE, id);
    this.shell = shell;
    this.surface = surface;
    this.sketchObjects = [];
    this.sketchLoops = [];
    this._csys = csys
  }

  normal() {
    return this.csys.z;
  }

  depth() {
    this.evalCSys();
    return this.w;
  }

  basis() {
    if (!this._basis) {
      this._basis = [this.csys.x, this.csys.y, this.csys.z];
    }
    return this._basis;
  }

  get csys() {
    this.evalCSys();
    return this._csys;
  }

  get isPlaneBased() {
    return this.surface.simpleSurface && this.surface.simpleSurface.isPlane;
  }
  
  evalCSys() {
    if (!this._csys) {
      if (this.isPlaneBased) {
        let alignCsys = (this.shell && this.shell.csys) || CSys.ORIGIN;
        let [x, y, z] = BasisForPlane(this.surface.simpleSurface.normal, alignCsys.y, alignCsys.z);
        let proj = z.dot(alignCsys.origin);
        proj -= this.surface.simpleSurface.w;
        let origin  = alignCsys.origin.minus(z.multiply(proj));
        this._csys = new CSys(origin, x, y, z);
      } else {
        let origin = this.surface.southWestPoint();
        let z = this.surface.normalUV(0, 0);
        let derivatives = this.surface.impl.eval(0, 0, 1);
        let x = new Vector().set3(derivatives[1][0])._normalize();
        let y = new Vector().set3(derivatives[0][1])._normalize();

        if (this.surface.inverted) {
          const t = x;
          x = y;
          y = t;
        }
        this._csys = new CSys(origin, x, y, z);
      }
      this.w = this.csys.w();
    }
  }
  
  get defaultSketchId() {
    return this.id;
  }

  setSketch(sketch) {
    
    if (!this.isPlaneBased) {
      return;
    }
    
    this.sketch = sketch;
    this.sketchObjects = [];

    if (!sketch) {
      return;
    }
    
    const addSketchObjects = sketchObjects => {
      let isConstruction = sketchObjects === sketch.constructionSegments;
      for (let sketchObject of sketchObjects) {
        let mSketchObject = new MSketchObject(this, sketchObject);
        mSketchObject.construction = isConstruction;
        this.sketchObjects.push(mSketchObject);
      }
    };
    addSketchObjects(sketch.constructionSegments);
    addSketchObjects(sketch.connections);
    addSketchObjects(sketch.loops);

    
    const index = new Map();
    this.sketchObjects.forEach(o => index.set(o.sketchPrimitive, o));
    
    this.sketchLoops = sketch.fetchContours().map((contour, i) => {
      let loopSketchObjects = contour.segments.map(s => index.get(s));
      return new MSketchLoop(this.id + '/L:' + i, this, loopSketchObjects, contour);
    });
    
  }

  findSketchObjectById(sketchObjectId) {
    for (let o of this.sketchObjects) {
      if (o.id === sketchObjectId) {
        return o;
      }
    }
  }

  getBounds() {
    return EMPTY_ARRAY;
  }

  get sketchToWorldTransformation() {
    if (!this._sketchToWorldTransformation) {
      this._sketchToWorldTransformation = this.csys.outTransformation;
    }
    return this._sketchToWorldTransformation;
  }
  
  get worldToSketchTransformation() {
    if (!this._worldToSketchTransformation) {
      this._worldToSketchTransformation = this.csys.inTransformation;
    }
    return this._worldToSketchTransformation;
  }
  
  get productionInfo() {
    if (this._productionInfo === undefined) {
      this._productionInfo = !this.brepFace.data.productionInfo ? null :
        ProductionInfo.fromRawData(this.brepFace.data.productionInfo);
    }
    return this._productionInfo;
  }

  traverse(callback: (obj: MObject) => void) {
    callback(this);
    this.sketchObjects.forEach(i => i.traverse(callback));
    this.sketchLoops.forEach(i => i.traverse(callback));
  }

}

export class MBrepFace extends MFace {

  constructor(id, shell, brepFace) {
    super(id, shell, brepFace.surface);
    this.id = id;
    this.brepFace = brepFace;
  }

  get edges() {
    let out = [];
    for (let he of this.brepFace.edges) {
      let edge = (this.shell as MBrepShell).brepRegistry.get(he.edge);
      if (edge) {
        out.push(edge);
      }
    }
    return out;
  }
  
  getBounds() {
    const bounds = [];
    for (let loop of this.brepFace.loops) {
      bounds.push(loop.asPolygon().map(p => new Vector().setV(p)));
    }
    return bounds;
  }
}
