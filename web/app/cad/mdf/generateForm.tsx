import React from 'react';
import { ComboBoxOption } from 'ui/components/controls/ComboBoxControl';
import Entity from '../craft/wizard/components/form/Entity';
import { CheckboxField, NumberField, ComboBoxField, TextField } from '../craft/wizard/components/form/Fields';
import { Group } from '../craft/wizard/components/form/Form';
import {OperationSchema, SchemaField} from "cad/craft/schema/schema";


export function generateForm(schema: OperationSchema) {

  return function MDForm() {
    return <Group>
      {Object.keys(schema).map(key => {

        const fieldDef: SchemaField = schema[key];
        const label = fieldDef.label || key;

        if (fieldDef.type === 'number') {
          return <NumberField name={key} defaultValue={fieldDef.defaultValue} label={label} />
        } else if (fieldDef.type === 'string') {
          if (fieldDef.enum) {
            return <ComboBoxField name={key} label={label}>
              {fieldDef.enum.map(opt => <ComboBoxOption key={opt.value} value={opt.value}>
                {opt.label}
              </ComboBoxOption>)}
            </ComboBoxField>
          } else {
            return <TextField name={key} label={label} />;
          }
        } else if (['face', 'edge', 'sketchObject', 'datumAxis'].includes(fieldDef.type)) {
          return <Entity name={key} label={label} />;
        } else if (fieldDef.type === 'boolean') {
          return <CheckboxField name={key} label={label} />;
        } else {
          return "I don't know";
        }

      })}
    </Group>;
  };
}