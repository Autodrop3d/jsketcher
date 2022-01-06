import {Contour} from "cad/sketch/sketchModel";
import {OCCContext} from "cad/craft/occPlugin";


export function sketch2wire(contour: Contour, oc: OCCContext) {
    const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
    for (let segment of contour.segments) {

        segment
    }


}