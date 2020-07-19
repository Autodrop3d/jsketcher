import Vector from "math/vector";
import { FaceTouchAlignConstraint } from "../constraints/faceTouchAlign";
import { Plane } from './../../../brep/geom/impl/plane';
import { AssemblyDOF, ModificationResponse } from "./assemblyDOF";
import { ConflictDOF } from './conflictDOF';
import {EdgeAlignConstraint} from "../constraints/edgeAlign";
import {Matrix3} from "math/matrix";

export class PPEEDOF implements AssemblyDOF {

  plane1: Plane;
  plane2: Plane;
  description = 'plane to plane twice';

  constructor(plane1: Plane, plane2: Plane) {
    this.plane1 = plane1;
    this.plane2 = plane2;
  }

  rotate(axis: Vector, angle: number, location: Matrix3, strict: boolean): ModificationResponse {
    return ModificationResponse.REJECTED;
  }

  translate(dir: Vector, location: Matrix3, strict: boolean): ModificationResponse {
    return ModificationResponse.REJECTED;
  }


  applyTouchAlign(constr: FaceTouchAlignConstraint): AssemblyDOF {
    return new ConflictDOF(constr, 'plane touch/align constraint cannot be applied when object is at ' + this.description + ' relationship');
  }

  applyEdgeAlign(constr: EdgeAlignConstraint): AssemblyDOF {
    return this;
  }

}