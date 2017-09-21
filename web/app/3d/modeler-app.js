import {Bus} from '../ui/toolkit'
import {Viewer} from './viewer'
import {UI} from './ui/ctrl'
import TabSwitcher from './ui/tab-switcher'
import ControlBar from './ui/control-bar'
import {InputManager} from './ui/input-manager'
import {ActionManager} from './actions/actions'
import * as AllActions from './actions/all-actions'
import Vector from '../math/vector'
import {Matrix3, AXIS, ORIGIN, IDENTITY_BASIS} from '../math/l3space'
import {Craft} from './craft/craft'
import {ReadSketch}  from './craft/sketch/sketch-reader'
import * as workbench  from './craft/mesh/workbench'
import * as cad_utils from './cad-utils'
import * as math from '../math/math'
import {IO} from '../sketcher/io'
import {AddDebugSupport} from './debug'
import {init as initSample} from './sample'
import '../../css/app3d.less'

import * as BREPBuilder from '../brep/brep-builder'
import * as BREPPrimitives from '../brep/brep-primitives'
import * as BREPBool from '../brep/operations/boolean'
import {BREPValidator} from '../brep/brep-validator'
import {BREPSceneSolid} from './scene/brep-scene-object'
import TPI from './tpi'
import {NurbsCurve} from "../brep/geom/impl/nurbs";
// import {createSphere, rayMarchOntoCanvas, sdfIntersection, sdfSolid, sdfSubtract, sdfTransform, sdfUnion} from "../hds/sdf";

function App() {
  this.id = this.processHints();
  this.bus = new Bus();
  this.actionManager = new ActionManager(this);
  this.inputManager = new InputManager(this);
  this.state = this.createState();
  this.viewer = new Viewer(this.bus, document.getElementById('viewer-container'));
  this.actionManager.registerActions(AllActions);
  this.tabSwitcher = new TabSwitcher($('#tab-switcher'), $('#view-3d'));
  this.controlBar = new ControlBar(this, $('#control-bar'));
  this.TPI = TPI;

  this.craft = new Craft(this);
  this.ui = new UI(this);

  AddDebugSupport(this);

  if (this.id.startsWith('$scratch$')) {
    setTimeout(() => this.scratchCode(), 0);
  } else {
    this.load();
  }

  this._refreshSketches();
  this.viewer.render();

  var viewer = this.viewer;
  var app = this;
  function storage_handler(evt) {
    var prefix = "TCAD.projects."+app.id+".sketch.";
    if (evt.key.indexOf(prefix) < 0) return;
    var sketchFaceId = evt.key.substring(prefix.length);
    var sketchFace = app.findFace(sketchFaceId);
    if (sketchFace != null) {
      app.refreshSketchOnFace(sketchFace);
      app.bus.notify('refreshSketch');
      app.viewer.render();
    }
  }
  window.addEventListener('storage', storage_handler, false);

  this.bus.subscribe("craft", function() {
    var historyEditMode = app.craft.historyPointer != app.craft.history.length;
    if (!historyEditMode) {
      app.viewer.selectionMgr.clear();
    }
    app._refreshSketches();
  });
}

App.prototype.addShellOnScene = function(shell, skin) {
  const sceneSolid = new BREPSceneSolid(shell, undefined, skin);
  this.viewer.workGroup.add(sceneSolid.cadGroup);
  this.viewer.render();
  return sceneSolid;
};

App.prototype.scratchCode = function() {
  const app = this;

  const box1 = app.TPI.brep.primitives.box(500, 500, 500);
  const box2 = app.TPI.brep.primitives.box(250, 250, 750, new Matrix3().translate(25, 25, 0));

  const box3 = app.TPI.brep.primitives.box(150, 600, 350, new Matrix3().translate(25, 25, -250));
  // let result = app.TPI.brep.bool.union(box1, box2);
  // let result = app.TPI.brep.bool.subtract(box1, box2);
  // result = app.TPI.brep.bool.subtract(result, box3);
  // app.addShellOnScene(box1);
  // app.addShellOnScene(result);


  let curve1 = new NurbsCurve(new verb.geom.NurbsCurve({"degree":6,"controlPoints":[[150,149.99999999999997,-249.99999999999994,1],[108.33333333333051,150.00000000000907,-250.00000000001975,1],[66.6666666666712,149.99999999998562,-249.99999999996987,1],[24.99999999999545,150.00000000001364,-250.00000000002711,1],[-16.66666666666362,149.99999999999145,-249.9999999999837,1],[-58.33333333333436,150.0000000000029,-250.00000000000531,1],[-99.99999999999997,150,-250,1]],"knots":[0,0,0,0,0,0,0,1,1,1,1,1,1,1]}));
  let curve2 = new NurbsCurve(new verb.geom.NurbsCurve({"degree":9,"controlPoints":[[100,-250,-250,1],[99.9999999999927,-194.44444444444687,-250.00000000000028,1],[100.00000000002228,-138.8888888888811,-249.99999999999838,1],[99.99999999995923,-83.33333333334777,-250.00000000000287,1],[100.00000000005268,-27.77777777775936,-249.99999999999744,1],[99.9999999999493,27.777777777760704,-250.0000000000008,1],[100.00000000003591,83.33333333334477,-250.00000000000063,1],[99.99999999998269,138.88888888888374,-249.99999999999966,1],[100.00000000000443,194.44444444444562,-249.99999999999986,1],[100,250,-250,1]],"knots":[0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1]}));

  __DEBUG__.AddCurve(curve1);
  __DEBUG__.AddCurve(curve2);


  // let curves =  surface.intersectSurface(box1.faces[0].surface);
  // const curve = box1.faces[0].outerLoop.halfEdges[0].edge.curve;
  let points = curve1.intersectCurve(curve2);
  for (let p of points) {
    __DEBUG__.AddPoint(p.p0);
  }



  app.viewer.render();
};


App.prototype.raytracing = function() {
  let box = createBox(800, 800, 800);
  this.viewer.workGroup.add(box.toThreeMesh());

  let win = $('<div><canvas width="1000" height="1000" /></div>')
    .css({
     'position': 'absolute',
     'width': '800px',
     'height': '800px',
     'left': '20px',
     'top': '20px',
     'z-order': 999999
  });
  win.appendTo($('body'));
  const canvas = win.find('canvas')[0];
  console.log(canvas);
  const ctx = canvas.getContext('2d');

  // ctx.fillStyle = 'green';
  // ctx.fillRect(10, 10, 100, 100);
  
  let sphere = createSphere(new Vector(), 600);
  let sphere2 = sdfTransform(sphere, new Matrix3().translate(-150, 300, 0));
  let solid = sdfSolid(box);
  let solid2 = sdfTransform(sphere, new Matrix3().translate(-150, 300, 0));
  let result = sdfSubtract(sphere, sphere2);
  let solid3 = sdfSubtract(solid, solid2);
  
  let width = this.viewer.container.clientWidth;
  let height = this.viewer.container.clientHeight;
  rayMarchOntoCanvas(solid3, this.viewer.camera, width, height, canvas, 2000, 10);
  this.viewer.render();
}

App.prototype.processHints = function() {
  let id = window.location.hash.substring(1);
  if (!id) {
    id = window.location.search.substring(1);
  }
  if (!id) {
    id = "DEFAULT";
  }
  if (id == "sample" ) {
    initSample();
  }
  return id;
};

App.prototype.lookAtSolid = function(solidId) {
  this.viewer.lookAt(this.findSolidById(solidId).mesh);
};

App.prototype.createState = function() {
  const state = {};
  this.bus.defineObservable(state, 'showSketches', true);
  return state;
};

App.prototype.findAllSolidsOnScene = function() {
  return this.viewer.workGroup.children
    .filter(function(obj) {return obj.__tcad_solid !== undefined} )
    .map(function(obj) {return obj.__tcad_solid} )
};

App.prototype.findFace = function(faceId) {
  var solids = this.craft.solids;
  for (var i = 0; i < solids.length; i++) {
    var solid = solids[i];
    for (var j = 0; j < solid.sceneFaces.length; j++) {
      var face = solid.sceneFaces[j];
      if (face.id == faceId) {
        return face;
      }
    }
  }
  return null;
};

App.prototype.findSolidByCadId = function(cadId) {
  var solids = this.craft.solids;
  for (var i = 0; i < solids.length; i++) {
    var solid = solids[i];
    if (solid.tCadId == cadId) {
      return solid;
    }
  }
  return null;
};

App.prototype.findSolidById = function(solidId) {
  var solids = this.craft.solids;
  for (var i = 0; i < solids.length; i++) {
    var solid = solids[i];
    if (solid.id == solidId) {
      return solid;
    }
  }
  return null;
};

App.prototype.indexEntities = function() {
  var out = {solids : {}, faces : {}};
  var solids = this.craft.solids;
  for (var i = 0; i < solids.length; i++) {
    var solid = solids[i];
    out.solids[solid.tCadId] = solid;
    for (var j = 0; j < solid.sceneFaces.length; j++) {
      var face = solid.sceneFaces[j];
      out.faces[face.id] = face;
    }
  }
  return out;
};

App.STORAGE_PREFIX = "TCAD.projects.";

App.prototype.faceStorageKey = function(polyFaceId) {
  return App.STORAGE_PREFIX + this.id + ".sketch." + polyFaceId;
};

App.prototype.projectStorageKey = function(polyFaceId) {
  return App.STORAGE_PREFIX + this.id;
};


App.prototype.editFace = function() {
  if (this.viewer.selectionMgr.selection.length == 0) {
    return;
  }
  const polyFace = this.viewer.selectionMgr.selection[0];
  this.sketchFace(polyFace);
};

App.prototype.sketchFace = function(sceneFace) {
  var faceStorageKey = this.faceStorageKey(sceneFace.id);

  var savedFace = localStorage.getItem(faceStorageKey);
  var data;
  if (savedFace == null) {
    data = {};
  } else {
    data = JSON.parse(savedFace);
  }
  data.boundary = {lines : [], arcs : [], circles : []};
  function sameSketchObject(a, b) {
    if (a.sketchConnectionObject === undefined || b.sketchConnectionObject === undefined) {
      return false;
    }
    return a.sketchConnectionObject.id === b.sketchConnectionObject.id;
  }

  var paths = sceneFace.getBounds();

  //sceneFace.polygon.collectPaths(paths);
  var _3dTransformation = new Matrix3().setBasis(sceneFace.basis());
  var _2dTr = _3dTransformation.invert();

  function addSegment(a, b) {
    data.boundary.lines.push({
      a : {x : a.x, y: a.y},
      b : {x : b.x, y: b.y}
    });
  }
  
  function addArc(arc) {
    function addArcAsSegments(arc) {
      for (var i = 1; i < arc.length; i++) {
        addSegment(arc[i - 1], arc[i]);
      }
    }
    if (arc.length < 5) {
      addArcAsSegments(arc);
      return;
    }
    var a = arc[1], b = arc[arc.length - 2];

    var mid = (arc.length / 2) >> 0;
    var c = math.circleFromPoints(a, arc[mid], b);
    if (c == null) {
      addArcAsSegments(arc);
      return;
    }

    var dist = math.distanceAB;
    
    var rad = dist(a, c);

    if (Math.abs(rad - dist(b, c)) > math.TOLERANCE) {
      addArcAsSegments(arc);
      return;
    }

    var firstPoint = arc[0];
    var lastPoint = arc[arc.length - 1];
    if (Math.abs(rad - dist(firstPoint, c)) < math.TOLERANCE) {
      a = firstPoint;      
    } else {
      addSegment(firstPoint, a);
    }

    if (Math.abs(rad - dist(lastPoint, c)) < math.TOLERANCE) {
      b = lastPoint;
    } else {
      addSegment(b, lastPoint);
    }

    if (!cad_utils.isCCW([a, arc[mid], b])) {
      var t = a;
      a = b;
      b = t;
    }
    data.boundary.arcs.push({
      a : {x : a.x, y: a.y},
      b : {x : b.x, y: b.y},
      c : {x : c.x, y : c.y}
    });
  }
  function addCircle(circle) {
    var n = circle.length;
    //var c = math.circleFromPoints(circle[0], circle[((n / 3) >> 0) % n], circle[((2 * n / 3) >> 0) % n]);
    var c = math.circleFromPoints(circle[0], circle[1], circle[2]);
    if (c === null) return;
    var r = math.distanceAB(circle[0], c);
    data.boundary.circles.push({
      c : {x : c.x, y: c.y},
      r : r
    });
  }
  function isCircle(path) {
    for (var i = 0; i < path.length; i++) {
      var p = path[i];
      if (p.sketchConnectionObject === undefined
        || p.sketchConnectionObject._class !== 'TCAD.TWO.Circle'
        || p.sketchConnectionObject.id !== path[0].sketchConnectionObject.id) {
        return false;
      }
    }
    return true;
  }

  function trPath (path) {
    var out = [];
    for (var i = 0; i < path.length; i++) {
      out.push(_2dTr.apply(path[i]));
    }
    return out;
  }

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (path.length < 3) continue;
    var shift = 0;
    if (isCircle(path)) {
      addCircle(trPath(path));
      continue;
    }
    cad_utils.iteratePath(path, 0, function(a, b, ai, bi) {
      shift = bi;
      return sameSketchObject(a, b);
    });
    var currSko = null;
    var arc = null;
    cad_utils.iteratePath(path, shift+1, function(a, b, ai, bi, iterNumber, path) {
      var isArc = a.sketchConnectionObject !== undefined &&
        (a.sketchConnectionObject._class == 'TCAD.TWO.Arc' || a.sketchConnectionObject._class == 'TCAD.TWO.Circle'); //if circle gets splitted
      var a2d = _2dTr.apply(a);
      if (isArc) {
        if (currSko !== a.sketchConnectionObject.id) {
          currSko = a.sketchConnectionObject.id;
          if (arc != null) {
            arc.push(a2d);
            addArc(arc);
          }
          arc = [];
        }
        arc.push(a2d);
        if (iterNumber === path.length - 1) {
          arc.push(_2dTr.apply(b));
          addArc(arc);
        }
      } else {
        if (arc != null) {
          arc.push(a2d);
          addArc(arc);
          arc = null;
        }
        currSko = null;
        addSegment(a2d, _2dTr.apply(b));
      }
      return true;
    });
  }

  localStorage.setItem(faceStorageKey, JSON.stringify(data));
  var sketchURL = faceStorageKey.substring(App.STORAGE_PREFIX.length);
  this.tabSwitcher.showSketch(sketchURL, sceneFace.id);
};

App.prototype.extrude = function() {

  if (this.viewer.selectionMgr.selection.length == 0) {
    return;
  }
  var polyFace = this.viewer.selectionMgr.selection[0];
  var height = prompt("Height", "50");
  if (!height) return;

  var app = this;
  var solids = [polyFace.solid];
  this.craft.modify({
    type: 'EXTRUDE',
    solids : solids,
    face : polyFace,
    height : height
  });
};

App.prototype.cut = function() {

  if (this.viewer.selectionMgr.selection.length == 0) {
    return;
  }
  var polyFace = this.viewer.selectionMgr.selection[0];
  var depth = prompt("Depth", "50");
  if (!depth) return;

  var app = this;
  var solids = [polyFace.solid];
  this.craft.modify({
    type: 'CUT',
    solids : solids,
    face : polyFace,
    depth : depth
  });
};

App.prototype.refreshSketches = function() {
  this._refreshSketches();
  this.bus.notify('refreshSketch');
  this.viewer.render();
};

App.prototype._refreshSketches = function() {
  var allSolids = this.craft.solids;
  for (var oi = 0; oi < allSolids.length; ++oi) {
    var obj = allSolids[oi];
    for (var i = 0; i < obj.sceneFaces.length; i++) {
      var sketchFace = obj.sceneFaces[i];
      this.refreshSketchOnFace(sketchFace);
    }
  }
};

App.prototype.findSketches = function(solid) {
  return solid.sceneFaces.filter(f => this.faceStorageKey(f.id) in localStorage).map(f => f.id);
};

App.prototype.refreshSketchOnFace = function(sketchFace) {
  var faceStorageKey = this.faceStorageKey(sketchFace.id);
  var savedFace = localStorage.getItem(faceStorageKey);
  if (savedFace != null) {
    var geom = ReadSketch(JSON.parse(savedFace), sketchFace.id, true);
    sketchFace.syncSketches(geom);
  }
};

App.prototype.save = function() {
  var data = {};
  data.history = this.craft.history;
  localStorage.setItem(this.projectStorageKey(), JSON.stringify(data));
};

App.prototype.load = function() {
  var project = localStorage.getItem(this.projectStorageKey());
  if (!!project) {
    var data = JSON.parse(project);
    if (!!data.history) {
      this.craft.loadHistory(data.history);
    }
  }
};

App.prototype.stlExport = function() {
  var allPolygons = cad_utils.arrFlatten1L(this.craft.solids.map(function (s) {
    return s.csg.toPolygons()
  }));
  var stl = CSG.fromPolygons(allPolygons).toStlString();
  IO.exportTextData(stl.data[0], this.id + ".stl");
};

App.prototype.showInfo = function() {
  alert('men at work');
};

export default App;