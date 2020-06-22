import {Polynomial, POW_1_FN, POW_2_FN} from "../../sketcher/constr/polynomial";
import {NoIcon} from "../../sketcher/icons/NoIcon";
import {AlgNumConstraint, ConstantsDefinitions, ConstraintSchema} from "../../sketcher/constr/ANConstraints";
import {MObject} from "../model/mobject";
import {SolvableObject} from "../../sketcher/constr/solvableObject";
import {AssemblyNode} from "./assembly";
import {EndPoint} from "../../sketcher/shapes/point";
import {Circle} from "../../sketcher/shapes/circle";
import {Arc} from "../../sketcher/shapes/arc";


export const Constraints3D = {

  FaceParallel: {
    id: 'FaceParallel',
    name: 'Face Parallel',
    icon: NoIcon,

    defineAssemblyScope: ([face1, face2]) => {
      return [
        face1.assemblyNodes.normal,
        face2.assemblyNodes.normal
      ];
    },

    defineParamsScope: ([n1, n2], cb) => {
      n1.visitParams(cb);
      n2.visitParams(cb);
    },

    collectPolynomials: (polynomials, params) => {

      const [
        nx1, ny1, nz1, nx2, ny2, nz2,
      ] = params;

      polynomials.push(
        new Polynomial(1)
          .monomial()
            .term(nx1, POW_1_FN)
            .term(nx2, POW_1_FN)
          .monomial()
            .term(ny1, POW_1_FN)
            .term(ny2, POW_1_FN)
          .monomial()
            .term(nz1, POW_1_FN)
            .term(nz2, POW_1_FN)

      );

    }

  },

  FaceToFace: {
    id: 'FaceToFace',
    name: 'Face To Face',
    icon: NoIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: ['face'],
      minQuantity: 2
    },

    defineAssemblyScope: ([face1, face2]) => {
      return [
        face1.assemblyNodes.plane,
        face2.assemblyNodes.plane,
      ];
    },

    defineParamsScope: ([plane1, plane2], cb) => {
      plane1.visitParams(cb);
      plane2.visitParams(cb);
    },

    collectPolynomials: (polynomials, params) => {

      const [
        nx1, ny1, nz1, w1, nx2, ny2, nz2, w2
      ] = params;

      polynomials.push(
        new Polynomial(1)
          .monomial()
            .term(nx1, POW_1_FN)
            .term(nx2, POW_1_FN)
          .monomial()
            .term(ny1, POW_1_FN)
            .term(ny2, POW_1_FN)
          .monomial()
            .term(nz1, POW_1_FN)
            .term(nz2, POW_1_FN)

      );
      polynomials.push(
        new Polynomial()
          .monomial()
            .term(w1, POW_1_FN)
          .monomial()
            .term(w2, POW_1_FN)
      );

    }

  },

  UnitVectorConsistency: {
    id: 'UnitVectorConsistency',
    name: 'UnitVectorConsistency',
    icon: NoIcon,

    defineParamsScope: ([vec], cb) => {
      //don't change to generic way it can a plane
      cb(vec.x);
      cb(vec.y);
      cb(vec.z);
    },

    collectPolynomials: (polynomials, params) => {

      const [x, y, z] = params;

      polynomials.push(
        new Polynomial(-1)
          .monomial()
            .term(x, POW_2_FN)
          .monomial()
            .term(y, POW_2_FN)
          .monomial()
            .term(z, POW_2_FN)
      );
    }
  },

  CSysConsistency: {
    id: 'CSysConsistency',
    name: 'CSysConsistency',
    icon: NoIcon,

    defineParamsScope: ([csys], cb) => {
      cb(csys.ix);
      cb(csys.iy);
      cb(csys.iz);
      cb(csys.jx);
      cb(csys.jy);
      cb(csys.jz);
      cb(csys.kx);
      cb(csys.ky);
      cb(csys.kz);
    },

    collectPolynomials: (polynomials, params) => {

      const [
        ix,
        iy,
        iz,
        jx,
        jy,
        jz,
        kx,
        ky,
        kz] = params;

      //let's keep matrix orthogonal and unit basis
      polynomials.push(new Polynomial(0)
        .monomial()
        .term(ix, POW_1_FN)
        .term(jx, POW_1_FN)
        .monomial()
        .term(iy, POW_1_FN)
        .term(jy, POW_1_FN)
        .monomial()
        .term(iz, POW_1_FN)
        .term(jz, POW_1_FN));

      polynomials.push(new Polynomial(0)
        .monomial()
        .term(ix, POW_1_FN)
        .term(kx, POW_1_FN)
        .monomial()
        .term(iy, POW_1_FN)
        .term(ky, POW_1_FN)
        .monomial()
        .term(iz, POW_1_FN)
        .term(kz, POW_1_FN));

      polynomials.push(new Polynomial(0)
        .monomial()
        .term(jx, POW_1_FN)
        .term(kx, POW_1_FN)
        .monomial()
        .term(jy, POW_1_FN)
        .term(ky, POW_1_FN)
        .monomial()
        .term(jz, POW_1_FN)
        .term(kz, POW_1_FN));

      polynomials.push(new Polynomial(-1)
        .monomial()
        .term(ix, POW_2_FN)
        .monomial()
        .term(iy, POW_2_FN)
        .monomial()
        .term(iz, POW_2_FN));

      polynomials.push(new Polynomial(-1)
        .monomial()
        .term(jx, POW_2_FN)
        .monomial()
        .term(jy, POW_2_FN)
        .monomial()
        .term(jz, POW_2_FN));

      polynomials.push(new Polynomial(-1)
        .monomial()
        .term(kx, POW_2_FN)
        .monomial()
        .term(ky, POW_2_FN)
        .monomial()
        .term(kz, POW_2_FN));
    },
  },

  RigidBodyPlaneLink: {
    id: 'RigidBodyPlaneLink',
    name: 'RigidBodyPlaneLink',
    icon: NoIcon,

    defineParamsScope: ([csys, plane], cb) => {
      csys.visitParams(cb);
      plane.visitParams(cb);
    },

    collectPolynomials: (polynomials, params, _, objects) => {
      const [csys, plane] = objects;

      const n = plane.getNormal();
      const wStar = plane.getDepth();

      const {x: xStar, y: yStar, z: zStar} = n.multiply(wStar);

      const [ox, oy, oz, ix, iy, iz, jx, jy, jz, kx, ky, kz, x, y, z, w] = params;

      // out.x = this.mxx * x + this.mxy * y + this.mxz * z + this.tx;
      // out.y = this.myx * x + this.myy * y + this.myz * z + this.ty;
      // out.z = this.mzx * x + this.mzy * y + this.mzz * z + this.tz;

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(x, POW_1_FN)
            .term(w, POW_1_FN)
          .monomial(xStar)
            .term(ix, POW_1_FN)
          .monomial(yStar)
            .term(jx, POW_1_FN)
          .monomial(zStar)
            .term(kx, POW_1_FN)
          .monomial()
            .term(ox, POW_1_FN)
      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(y, POW_1_FN)
            .term(w, POW_1_FN)
          .monomial(xStar)
            .term(iy, POW_1_FN)
          .monomial(yStar)
            .term(jy, POW_1_FN)
          .monomial(zStar)
            .term(ky, POW_1_FN)
          .monomial()
            .term(oy, POW_1_FN)

      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(z, POW_1_FN)
            .term(w, POW_1_FN)
          .monomial(xStar)
            .term(iz, POW_1_FN)
          .monomial(yStar)
            .term(jz, POW_1_FN)
          .monomial(zStar)
            .term(kz, POW_1_FN)
          .monomial()
            .term(oz, POW_1_FN)

      );

    }
  },

  RigidBodyLink3x3: {
    id: 'RigidBodyLink3x3',
    name: 'RigidBodyLink3x3',
    icon: NoIcon,

    defineParamsScope: ([csys, vec], cb) => {
      cb(csys.ix);
      cb(csys.iy);
      cb(csys.iz);
      cb(csys.jx);
      cb(csys.jy);
      cb(csys.jz);
      cb(csys.kx);
      cb(csys.ky);
      cb(csys.kz);
      vec.visitParams(cb);
    },

    collectPolynomials: (polynomials, params, _, objects) => {
      const [csys, vec] = objects;

      const {x: nStarX, y: nStarY, z: nStarZ} = vec.getVector();

      const [ix, iy, iz, jx, jy, jz, kx, ky, kz, x, y, z] = params;

      // out.x = this.mxx * x + this.mxy * y + this.mxz * z + this.tx;
      // out.y = this.myx * x + this.myy * y + this.myz * z + this.ty;
      // out.z = this.mzx * x + this.mzy * y + this.mzz * z + this.tz;

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(x, POW_1_FN)
          .monomial(nStarX)
            .term(ix, POW_1_FN)
          .monomial(nStarY)
            .term(jx, POW_1_FN)
          .monomial(nStarZ)
            .term(kx, POW_1_FN)
      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(y, POW_1_FN)
          .monomial(nStarX)
            .term(iy, POW_1_FN)
          .monomial(nStarY)
            .term(jy, POW_1_FN)
          .monomial(nStarZ)
            .term(ky, POW_1_FN),

      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(z, POW_1_FN)
          .monomial(nStarX)
            .term(iz, POW_1_FN)
          .monomial(nStarY)
            .term(jz, POW_1_FN)
          .monomial(nStarZ)
            .term(kz, POW_1_FN)
      );

    }
  },

  RigidBodyLink4x4: {
    id: 'RigidBodyLink4x4',
    name: 'RigidBodyLink4x4',
    icon: NoIcon,

    defineParamsScope: ([csys, vec], cb) => {
      cb(csys.ox);
      cb(csys.oy);
      cb(csys.oz);
      cb(csys.ix);
      cb(csys.iy);
      cb(csys.iz);
      cb(csys.jx);
      cb(csys.jy);
      cb(csys.jz);
      cb(csys.kx);
      cb(csys.ky);
      cb(csys.kz);
      vec.visitParams(cb);
    },

    collectPolynomials: (polynomials, params, _, objects) => {
      const [csys, vec] = objects;

      const {x: xStar, y: yStar, z: zStar} = vec.getVector();

      const [ox, oy, oz, ix, iy, iz, jx, jy, jz, kx, ky, kz, x, y, z] = params;

      // out.x = this.mxx * x + this.mxy * y + this.mxz * z + this.tx;
      // out.y = this.myx * x + this.myy * y + this.myz * z + this.ty;
      // out.z = this.mzx * x + this.mzy * y + this.mzz * z + this.tz;

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(x, POW_1_FN)
          .monomial(xStar)
            .term(ix, POW_1_FN)
          .monomial(yStar)
            .term(jx, POW_1_FN)
          .monomial(zStar)
            .term(kx, POW_1_FN)
          .monomial()
            .term(ox, POW_1_FN)

      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(y, POW_1_FN)
          .monomial(xStar)
            .term(iy, POW_1_FN)
          .monomial(yStar)
            .term(jy, POW_1_FN)
          .monomial(zStar)
            .term(ky, POW_1_FN)
          .monomial()
            .term(oy, POW_1_FN)


      );

      polynomials.push(
        new Polynomial(0)
          .monomial(-1)
            .term(z, POW_1_FN)
          .monomial(xStar)
            .term(iz, POW_1_FN)
          .monomial(yStar)
            .term(jz, POW_1_FN)
          .monomial(zStar)
            .term(kz, POW_1_FN)
          .monomial()
            .term(oz, POW_1_FN)

      );

    }
  },
};


export interface AssemblyConstraintSchema extends ConstraintSchema {
  selectionMatcher?: {
    selector: string,
    types: any[],
    minQuantity: number
  };
  defineAssemblyScope: (objects: MObject[]) => AssemblyNode[],
}


export function createAssemblyConstraint(schema: AssemblyConstraintSchema,
                                         objects: MObject[],
                                         constants?: ConstantsDefinitions,
                                         internal: boolean = false) {

  return new AlgNumConstraint(schema, schema.defineAssemblyScope(objects), constants, internal);
}