import React from "react";
import {OperationSchema} from "cad/craft/schema/schema";
import {FieldBasicProps, fieldToSchemaGeneric} from "cad/mdf/ui/field";
import {Types} from "cad/craft/schema/types";
import {EntityKind} from "cad/model/entities";
import {SectionWidgetProps} from "cad/mdf/ui/SectionWidget";
import {DynamicComponentWidget} from "cad/mdf/ui/DynamicComponentWidget";
import {VectorResolver} from "cad/craft/schema/resolvers/vectorResolver";

export interface VectorWidgetProps extends FieldBasicProps {

  type: 'vector';

}

const ENTITY_CAPTURE = [EntityKind.EDGE, EntityKind.SKETCH_OBJECT, EntityKind.DATUM_AXIS, EntityKind.FACE];

export const VectorWidgetDefinition = ({name, label}: VectorWidgetProps) => ({

  type: 'section',

  title: label || name,

  collapsible: true,

  initialCollapse: false,

  content: [
    {
      name: name,
      type: 'sub-form',
      resolve: VectorResolver,
      content: [
        {
          name: "vectorEntity",
          label: 'vector',
          type: "selection",
          capture: ENTITY_CAPTURE,
          multi: false,
          optional: true
        },
        {
          name: "flip",
          label: 'flip',
          type: "checkbox",
          defaultValue: false
        }
      ]
    },
  ]
} as SectionWidgetProps);


