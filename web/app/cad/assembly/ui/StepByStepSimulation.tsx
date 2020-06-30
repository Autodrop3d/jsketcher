import React, {useContext, useState} from "react";
import {AppContext} from "../../dom/components/AppContext";
import {AssemblyProcess} from "../assemblySolver";
import {useStream} from "ui/effects";
import {MShell} from "../../model/mshell";
import CSys from "math/csys";
import {Matrix3} from "math/l3space";

export function StepByStepSimulation() {

  const ctx = useContext(AppContext);

  const [process, setProcess] = useState<AssemblyProcess>(null);
  const constraints = useStream(ctx => ctx.assemblyService.constraints$);


  function stepByStepSimulation() {
    if (process === null || process.isDone()) {
      const newProcess = new AssemblyProcess(ctx.cadRegistry, constraints);
      newProcess.queue.forEach(rb => {
        if (rb.model.root instanceof MShell) {
          rb.model.root.location$.next(new Matrix3());
        }
      });
      newProcess.step();
      setProcess(newProcess);
    } else {
      process.step();
    }
  }

  return <button onClick={stepByStepSimulation}>step</button>

}
