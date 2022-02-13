import React from 'react';
import {ContainerBasicProps, ContainerWidget} from "cad/mdf/ui/ContainerWidget";
import {Group, SubForm} from "cad/craft/wizard/components/form/Form";
import {ParamsPathSegment} from "cad/craft/wizard/wizardTypes";

export interface SubFormWidgetProps extends ContainerBasicProps {

  type: 'sub-form',

  name: ParamsPathSegment

}

export function SubFormWidget({name, content}: SubFormWidgetProps) {

  return <Group>
    <SubForm name={name}>
      <ContainerWidget content={content} />
    </SubForm>
  </Group>;
}




