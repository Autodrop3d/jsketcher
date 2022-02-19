import React from "react";
import {OperationSchema} from "cad/craft/schema/schema";
import {FieldBasicProps, fieldToSchemaGeneric} from "cad/mdf/ui/field";
import {Types} from "cad/craft/schema/types";
import {EntityKind} from "cad/model/entities";
import {SectionWidgetProps} from "cad/mdf/ui/SectionWidget";
import {DynamicComponentWidget} from "cad/mdf/ui/DynamicComponentWidget";
import {AxisResolver} from "cad/craft/schema/resolvers/axisResolver";

export interface BooleanWidgetProps extends FieldBasicProps {

  type: 'boolean';

}

const ENTITY_CAPTURE = [EntityKind.SHELL];

const BOOLEAN_OPTIONS = ['NONE', 'UNION', 'SUBTRACT', 'INTERSECT'];

export const BooleanWidgetDefinition = (props: BooleanWidgetProps) => ({

  type: 'section',

  title: props.label,

  collapsible: true,

  initialCollapse: false,

  content: [
    {
      type: 'sub-form',
      name: props.name,
      optional: props.optional,
      content: [
        {
          name: "kind",
          label: 'kind',
          type: "choice",
          optional: true,
          defaultValue: 'NONE',
          values: BOOLEAN_OPTIONS
        },
        {
          name: "targets",
          label: 'target',
          type: "selection",
          capture: ENTITY_CAPTURE,
          multi: true,
          optional: true,
        }

      ]
    },

  ]
} as SectionWidgetProps);
