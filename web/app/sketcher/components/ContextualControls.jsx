import React, {useContext} from 'react';
import ls from './ContextualControls.less';
import {matchAvailableActions} from "../actions";
import {useStream} from "../../../../modules/ui/effects";
import {SketcherAppContext} from "./SketcherApp";
import {MatchIndex, matchSelection} from "../selectionMatcher";
import {ConstraintButton} from "./ConstraintExplorer";

export function ContextualControls() {

  const selection = useStream(ctx => ctx.viewer.streams.selection);
  const ___ = useStream(ctx => ctx.viewer.parametricManager.$constraints);

  const ctx = useContext(SketcherAppContext);

  if (selection.length === 0) {
    return null;
  }

  const obj = selection.length === 1 ? selection[0] : null;

  const availableActions = matchAvailableActions(selection);

  const nonInternalConstraints = obj && Array.from(obj.constraints).filter(c => !c.internal);

  return <div className={ls.root}>

    {
      selection.map(s => <div onDoubleClick={debugEgg(s)} className={ls.item}>{s.simpleClassName}: {s.id}</div>)
    }

    <div className={ls.hr}>AVAILABLE ACTIONS:</div>

    <div style={{
      display: 'flex',
      maxWidth: 200,
      flexWrap: 'wrap',
    }}>
      {
        availableActions.map(a => <button
          style={{
            margin: 3
          }}
          onClick={() => a.invoke(ctx, matchSelection(a.selectionMatcher, new MatchIndex(selection), false))}
          title={a.description}>{a.shortName}</button>)
      }
    </div>
    {
      nonInternalConstraints && nonInternalConstraints.length !== 0 && <>
        <div className={ls.hr}>PARTICIPATES IN CONSTRAINTS:</div>
        {nonInternalConstraints.map(c => <ConstraintButton constraint={c} key={c.id} style={{borderColor: 'white'}}/>)}
      </>
    }

  </div>;

}

function debugEgg(obj) {
  return e => {
    obj.visitParams(p => console.log(p.toString()));
  }
}