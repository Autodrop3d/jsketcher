import {addModification, stepOverriding} from './craftHistoryUtils';
import {state, stream} from 'lstream';
import {MShell} from '../model/mshell';
import {MDatum} from '../model/mdatum';
import materializeParams from './materializeParams';
import CadError from '../../utils/errors';
import {MObjectIdGenerator} from '../model/mobject';

export function activate({streams, services}) {

  streams.craft = {
    modifications: state({
      history: [],
      pointer: -1
    }),
    models: state([]),
    update: stream()
  };

  let preRun = null;

  function modifyWithPreRun(request, modificationsUpdater, onAccepted) {
    preRun = {
      request
    };
    try {
      preRun.result = runRequest(request);
      if (onAccepted) {
        onAccepted();
      }
      modificationsUpdater(request);
    } finally {
      preRun = null;
    }
  }
  
  function modify(request, onAccepted) {
    modifyWithPreRun(request, 
        request => streams.craft.modifications.update(modifications => addModification(modifications, request)), onAccepted);
  }

  function modifyInHistoryAndStep(request, onAccepted) {
    modifyWithPreRun(request,
      request => streams.craft.modifications.update(modifications => stepOverriding(modifications, request)), onAccepted);
  }

  function reset(modifications) {
    streams.craft.modifications.next({
      history: modifications,
      pointer: modifications.length - 1
    });
  }

  function rebuild() {
    const mods = streams.craft.modifications.value;
    reset([]);
    streams.craft.modifications.next(mods);
  }
  
  function runRequest(request) {
    let op = services.operation.get(request.type);
    if (!op) {
      throw(`unknown operation ${request.type}`);
    }

    let params = {};
    let errors = [];
    materializeParams(services, request.params, op.schema, params, errors);
    if (errors.length) {
      throw new CadError({
        kind: CadError.KIND.INVALID_PARAMS,
        userMessage: errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      });
    }
    
    return op.run(params, services);
  }
  
  function runOrGetPreRunResults(request) {
    if (preRun !== null && preRun.request === request) {
      return preRun.result;
    } else {
      return runRequest(request);
    }
  }
  
  services.craft = {
    modify, modifyInHistoryAndStep, reset, runRequest, rebuild,
    historyTravel: historyTravel(streams.craft.modifications)
  };

  streams.craft.modifications.pairwise().attach(([prev, curr]) => {
    let models;
    let beginIndex;
    if (isAdditiveChange(prev, curr)) {
      beginIndex = prev.pointer + 1;
    } else {
      MObjectIdGenerator.reset();
      beginIndex = 0;
      streams.craft.models.next([]);
    }
    
    models = new Set(streams.craft.models.value);
    let {history, pointer} = curr;
    for (let i = beginIndex; i <= pointer; i++) {
      let request = history[i];
      try {
        let {consumed, created} = runOrGetPreRunResults(request);
        consumed.forEach(m => models.delete(m));
        created.forEach(m => models.add(m));
        streams.craft.models.next(Array.from(models).sort(m => m.id));
      } catch(e) {
        console.error(e);
        //TODO: need to find a way to propagate the error to the wizard.
        setTimeout(() => streams.craft.modifications.next({
          ...curr,
          pointer: i-1
        }));
        break;
      } 
    }
  })
}

function isAdditiveChange({history:oldHistory, pointer:oldPointer}, {history, pointer}) {
  if (pointer < oldPointer) {
    return false;
  }

  for (let i = 0; i <= oldPointer; i++) {
    let modCurr = history[i];
    let modPrev = oldHistory[i];
    if (modCurr !== modPrev) {
      return false;
    }
  }
  return true;
}

function historyTravel(modifications$) {
  
  return {
    setPointer: function(pointer, hints) {
      let mod = modifications$.value;
      if (pointer >= mod.history.length || pointer < -1) {
        return;
      }
      modifications$.update(({history}) => ({history, pointer, hints}));
    },
    begin: function(hints) {
      this.setPointer(-1, hints);
    },
    end: function(hints) {
      this.setPointer(modifications$.value.history.length - 1, hints);
    },
    forward: function(hints) {
      this.setPointer(modifications$.value.pointer + 1, hints);
    },
    backward: function (hints) {
      this.setPointer(modifications$.value.pointer - 1, hints);
    },
  }

} 

