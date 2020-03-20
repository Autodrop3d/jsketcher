import React, {useCallback, useContext, useEffect, useState} from 'react';
import NumberControl from "ui/components/controls/NumberControl";
import Stack from "ui/components/Stack";
import ButtonGroup from "ui/components/controls/ButtonGroup";
import Button from "ui/components/controls/Button";
import {useStream} from "ui/effects";
import CheckboxControl from "ui/components/controls/CheckboxControl";
import Window from "ui/components/Window";
import Field from "ui/components/controls/Field";
import Label from "../../../../modules/ui/components/controls/Label";
import {SketcherAppContext} from "./SketcherApp";
import {EMPTY_OBJECT} from "../../../../modules/gems/objects";
import identity from 'lodash';

export function ConstraintEditor() {

  const req = useStream(ctx => ctx.ui.$constraintEditRequest);

  const [values, setValues] = useState(null);

  useEffect(() => {
    setValues(req && {...req.constraint.constants})
    return () => {
      if (req) {
        viewer.unHighlight(req.constraint.objects);
        viewer.refresh();
      }
    }
  }, [req]);

  const {viewer} = useContext(SketcherAppContext);

  const setValue = (name, value) => {
    setValues({...value, [name]: value});
  };

  if (!req || !values) {
    return null;
  }

  const {constraint, onCancel, onApply} = req;

  const highlight = () => {
    viewer.highlight(constraint.objects, true);
    viewer.refresh();
  };

  const unHighlight = () => {
    viewer.unHighlightAll();
    viewer.refresh();
  };


  const apply = () => {
    Object.keys(constraint.schema.constants).map(name => {
      const val = values[name];
      if (val !== undefined) {
        constraint.updateConstant(name, val + '');
      }
    });
    onApply();
  };

  return <Window initWidth={250} initLeft={5} initTop={5} title={constraint.schema.name} onClose={onCancel}
                 onMouseEnter={highlight}
                 onMouseLeave={unHighlight}>

    <Stack>

      {constraint.constantKeys
        .filter(key => !constraint.schema.constants[key].readOnly)
        .sort().map(name => {
          const def = constraint.schema.constants[name];
          const presentation = def.presentation || EMPTY_OBJECT;
          const onChange = value => setValue(name, (presentation.transformIn||identity)(value));

          const val = (presentation.transformOut||identity)(values[name]);
          const type = presentation.type || def.type;
          return <Field key={presentation.label||name}>
            <Label>{name}</Label>
            {
              (() => {
                if (type === 'number') {
                  return <NumberControl value={val} onChange={onChange}/>
                } else if (type === 'boolean') {
                  return <CheckboxControl value={val} onChange={onChange}/>
                } else {
                  return <span>{val}</span>;
                }
              })()
            }
          </Field>
        })}


      <ButtonGroup>
        <Button onClick={onCancel}>CANCEL</Button>
        <Button type='accent' onClick={apply}>APPLY</Button>
      </ButtonGroup>

    </Stack>

  </Window>;

}

export function editConstraint(rqStream, constraint, onApply) {
  rqStream.next({
    constraint,
    onCancel: () => rqStream.next(null),
    onApply: () => {
      rqStream.next(null);
      onApply();
    }
  });
}