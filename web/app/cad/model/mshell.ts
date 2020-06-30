import {MObject, MObjectIdGenerator} from './mobject';
import {MBrepFace} from './mface';
import {MEdge} from './medge';
import {MVertex} from './mvertex';
import CSys from 'math/csys';
import {Matrix3} from "math/l3space";
import {state, StateStream} from "lstream";
import {AssemblyCSysNode} from "../assembly/nodes/assemblyCSysNode";
import {AssemblyOrientationNode} from "../assembly/nodes/assemblyOrientationNode";
import {AssemblyVectorNode} from "../assembly/nodes/assemblyVectorNode";
import {AssemblyTranslationNode} from "../assembly/nodes/assemblyTranslationNode";
import {AssemblyLocationNode} from "../assembly/nodes/assemblyLocationNode";

export class MShell extends MObject {

  static TYPE = 'shell';

  csys: CSys;

  shell;
  faces = [];
  edges = [];
  vertices = [];

  location$: StateStream<Matrix3> = state(new Matrix3());

  assemblyNodes: {
    location: AssemblyLocationNode,
    orientation: AssemblyOrientationNode,
    translation: AssemblyTranslationNode,
  };

  constructor() {
    super(MShell.TYPE, MObjectIdGenerator.next(MShell.TYPE, 'S'));
    // @ts-ignore
    this.assemblyNodes = {
      location: new AssemblyLocationNode(this, () => new Matrix3() ),
      orientation: new AssemblyOrientationNode( this, () => new Matrix3() )
    };

  }

  traverse(callback: (obj: MObject) => void): void {
    callback(this);
    this.faces.forEach(i => i.traverse(callback));
    this.edges.forEach(i => i.traverse(callback));
    this.vertices.forEach(i => i.traverse(callback));
  }

  get parent() {
    return null;
  }
}

export class MBrepShell extends MShell {

  brepShell: any;
  csys: CSys;
  brepRegistry: Map<string, MObject>;

  constructor(shell, csys) {
    super();
    this.brepShell = shell;
    this.csys = csys || CSys.ORIGIN;
    this.brepRegistry = new Map();
    
    let faceCounter = 0;
    let edgeCounter = 0;
    let vertexCounter = 0;

    for (let brepFace of this.brepShell.faces) {
      const mFace = new MBrepFace(brepFace.data.id || (this.id + '/F:' + faceCounter++), this, brepFace);
      this.faces.push(mFace);
      this.brepRegistry.set(brepFace, mFace);
    }

    for (let brepEdge of this.brepShell.edges) {
      const mEdge = new MEdge(this.id + '/E:' + edgeCounter++, this, brepEdge);
      this.edges.push(mEdge);
      this.brepRegistry.set(brepEdge, mEdge);
    }

    for (let brepVertex of this.brepShell.vertices) {
      const mVertex = new MVertex(this.id + '/V:' + vertexCounter++, this, brepVertex);
      this.vertices.push(mVertex);
      this.brepRegistry.set(brepVertex, mVertex);
    }
  }

}
