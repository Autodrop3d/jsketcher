import verb from 'verb-nurbs'
import BrepCurve from '../../brep/geom/curves/brepCurve';
import NurbsCurve from '../../brep/geom/curves/nurbsCurve';
import {Point} from '../../brep/geom/point'
import {LUT} from '../../math/bezier-cubic'
import {distanceAB, isCCW, makeAngle0_360} from '../../math/math'
import {normalizeCurveEnds} from '../../brep/geom/impl/nurbs-ext';

const RESOLUTION = 20;

class SketchPrimitive {
  constructor(id) {
    this.id = id;
    this.inverted = false;
  }

  invert() {
    this.inverted = !this.inverted;
  }

  tessellate(resolution) {
    const tessellation = this.tessellateImpl(resolution);
    if (this.inverted) {
      tessellation.reverse();
    }
    return tessellation;
  }

  isCurve() {
    return this.constructor.name !== 'Segment';
  }

  toNurbs(plane) {
    let verbNurbs = this.toVerbNurbs(plane, to3DTrFunc(plane));
    if (this.inverted) {
      verbNurbs = verbNurbs.reverse();
    }
    let data = verbNurbs.asNurbs();
    normalizeCurveEnds(data);
    verbNurbs = new verb.geom.NurbsCurve(data);

    return new BrepCurve(new NurbsCurve(verbNurbs));
  }

  toVerbNurbs(plane, _3dtr) {
    throw 'not implemented'
  }

  tessellateImpl() {
    throw 'not implemented'
  }
}

export class Segment extends SketchPrimitive {
  constructor(id, a, b) {
    super(id);
    this.a = a;
    this.b = b;
  }

  tessellateImpl(resolution) {
    return [this.a, this.b];
  }

  toVerbNurbs(plane, _3dtr) {
    return new verb.geom.Line(_3dtr(this.a).data(), _3dtr(this.b).data());
  }
}

export class Arc extends SketchPrimitive {
  constructor(id, a, b, c) {
    super(id);
    this.a = a;
    this.b = b;
    this.c = c;
  }

  tessellateImpl(resolution) {
    return Arc.tessellateArc(this.a, this.b, this.c, resolution);
  }

  static tessellateArc(ao, bo, c, resolution) {
    var a = ao.minus(c);
    var b = bo.minus(c);
    var points = [ao];
    var abAngle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    if (abAngle > Math.PI * 2) abAngle = Math.PI / 2 - abAngle;
    if (abAngle < 0) abAngle = Math.PI * 2 + abAngle;

    var r = a.length();
    resolution = 1;
    //var step = Math.acos(1 - ((resolution * resolution) / (2 * r * r)));
    var step = resolution / (2 * Math.PI);
    var k = Math.round(abAngle / step);
    var angle = Math.atan2(a.y, a.x) + step;

    for (var i = 0; i < k - 1; ++i) {
      points.push(new Point(c.x + r*Math.cos(angle), c.y + r*Math.sin(angle)));
      angle += step;
    }
    points.push(bo);
    return points;
  }

  toVerbNurbs(plane, _3dtr) {
    const basis = plane.basis();
    const startAngle = makeAngle0_360(Math.atan2(this.a.y - this.c.y, this.a.x - this.c.x));
    const endAngle = makeAngle0_360(Math.atan2(this.b.y - this.c.y, this.b.x - this.c.x));

    let angle = endAngle - startAngle;
    if (angle < 0) {
      angle = Math.PI * 2 + angle;
    }
    function pointAtAngle(angle) {
      const dx = basis[0].multiply(Math.cos(angle));
      const dy = basis[1].multiply(Math.sin(angle));
      return dx.plus(dy);
    }
    const xAxis = pointAtAngle(startAngle);
    const yAxis = pointAtAngle(startAngle + Math.PI * 0.5);

    let arc = new verb.geom.Arc(_3dtr(this.c).data(), xAxis.data(), yAxis.data(), distanceAB(this.c, this.a), 0, Math.abs(angle));
    return arc;
  }
}

export class BezierCurve extends SketchPrimitive {
  constructor(id, a, b, cp1, cp2) {
    super(id);
    this.a = a;
    this.b = b;
    this.cp1 = cp1;
    this.cp2 = cp2;
  }

  tessellateImpl(resolution) {
    return LUT(this.a, this.b, this.cp1, this.cp2, 10);
  }
}

export class EllipticalArc extends SketchPrimitive {
  constructor(id, ep1, ep2, a, b, r) {
    super(id);
    this.ep1 = ep1;
    this.ep2 = ep2;
    this.a = a;
    this.b = b;
    this.r = r;
  }

  tessellateImpl(resolution) {
    return EllipticalArc.tessEllipticalArc(this.ep1, this.ep2, this.a, this.b, this.r, resolution);
  }

  static tessEllipticalArc(ep1, ep2, ao, bo, radiusY, resolution) {
    const axisX = ep2.minus(ep1);
    const radiusX = axisX.length() * 0.5;
    axisX._normalize();
    const c = ep1.plus(axisX.multiply(radiusX));
    const a = ao.minus(c);
    const b = bo.minus(c);
    const points = [ao];
    const rotation = Math.atan2(axisX.y, axisX.x);
    let abAngle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    if (abAngle > Math.PI * 2) abAngle = Math.PI / 2 - abAngle;
    if (abAngle < 0) abAngle = Math.PI * 2 + abAngle;

    const sq = (a) => a * a;

    resolution = 1;

    const step = resolution / (2 * Math.PI);
    const k = Math.round(abAngle / step);
    let angle = Math.atan2(a.y, a.x) + step - rotation;

    for (let i = 0; i < k - 1; ++i) {
      const r = Math.sqrt(1/( sq(Math.cos(angle)/radiusX) + sq(Math.sin(angle)/radiusY)));
      points.push(new Point(c.x + r*Math.cos(angle + rotation), c.y + r*Math.sin(angle + rotation)));
      angle += step;
    }
    points.push(bo);
    return points;
  }

}

export class Circle extends SketchPrimitive {
  constructor(id, c, r) {
    super(id);
    this.c = c;
    this.r = r;
  }

  tessellateImpl(resolution) {
    return Circle.tessCircle(this.c, this.r, resolution);
  }

  static tessCircle(c, r, resolution) {
    var points = [];
    resolution = 1;
    //var step = Math.acos(1 - ((resolution * resolution) / (2 * r * r)));
    var step = resolution / (2 * Math.PI);
    var k = Math.round((2 * Math.PI) / step);

    for (var i = 0, angle = 0; i < k; ++i, angle += step) {
      points.push(new Point(c.x + r*Math.cos(angle), c.y + r*Math.sin(angle)));
    }
    points.push(points[0]); // close it
    return points;
  }


  toVerbNurbs(plane, _3dtr) {
    const basis = plane.basis();
    return new verb.geom.Circle(_3dtr(this.c).data(), basis[0].data(), basis[1].data(), this.r);
  }
}

export class Ellipse extends SketchPrimitive {
  constructor(id, ep1, ep2, r) {
    super(id);
    this.ep1 = ep1;
    this.ep2 = ep2;
    this.r = r;
  }

  tessellateImpl(resolution) {
    return EllipticalArc.tessEllipticalArc(this.ep1, this.ep2, this.ep1, this.ep1, this.r, resolution);
  }
}

export class Contour {

  constructor() {
    this.segments = [];
  }

  add(obj) {
    this.segments.push(obj);
  }

  tessellateOnSurface(surface) {
    const cc = new CompositeCurve();
    const tr = to3DTrFunc(surface);

    let prev = null;
    let firstPoint = null;
    for (let segIdx = 0; segIdx < this.segments.length; ++segIdx) {
      let segment = this.segments[segIdx];
      let tessellation = segment.tessellate(RESOLUTION);

      tessellation = tessellation.map(p => tr(p));

      const n = tessellation.length;
      prev = prev == null ? tessellation[0] : prev;
      tessellation[0] = prev; // this magic is to keep identity of same vectors
      if (firstPoint == null) firstPoint = tessellation[0];

      if (segIdx == this.segments.length - 1) {
        tessellation[n - 1] = firstPoint;
      }

      cc.add(segment.toNurbs(surface), prev, segment);
      prev = tessellation[n - 1];

      //It might be an optimization for segments
      // for (let i = 1; i < n; ++i) {
      //   const curr = tessellation[i];
      //   cc.add(new Line.fromSegment(prev, curr), prev, segment);
      //   prev = curr;
      // }
    }
    return cc;
  }

  transferOnSurface(surface) {
    const cc = [];

    let prev = null;
    let firstPoint = null;
    for (let segIdx = 0; segIdx < this.segments.length; ++segIdx) {
      let segment = this.segments[segIdx];
      cc.push(segment.toNurbs(surface));
    }
    return cc;
  }

  tessellate(resolution) {
    const tessellation = [];
    for (let segment of this.segments) {
      const segmentTessellation = segment.tessellate(resolution);
      //skip last one cuz it's guaranteed to be closed
      for (let i = 0; i < segmentTessellation.length - 1; ++i) {
        tessellation.push(segmentTessellation[i]);
      }
    }
    return tessellation;
  }

  isCCW() {
    return isCCW(this.tessellate(10));
  }

  reverse() {
    this.segments.reverse();
    this.segments.forEach(s => s.invert());
  }
}

function to3DTrFunc(surface) {
  const _3dTransformation = surface.get3DTransformation();
  return function (v) {
    return _3dTransformation.apply(v);
  }
}

class CompositeCurve {

  constructor() {
    this.curves = [];
    this.points = [];
    this.groups = [];
  }

  add(curve, point, group) {
    this.curves.push(curve);
    this.points.push(point);
    this.groups.push(group);
  }
}

