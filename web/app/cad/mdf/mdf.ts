import {IconDeclaration} from "cad/icons/IconDeclaration";
import {CoreContext} from "context";
import {IconType} from "react-icons";
import {OperationResult} from "../craft/craftPlugin";
import {OperationDescriptor} from "../craft/operationPlugin";
import {resolveMDFIcon} from "./mdfIconResolver";
import {OperationSchema} from "cad/craft/schema/schema";
import {
  DynamicWidgetProps,
  FieldWidgetProps,
  FormDefinition,
  isContainerWidgetProps,
  isFieldWidgetProps,
  isSubFormWidgetProps,
  UIDefinition
} from "cad/mdf/ui/uiDefinition";
import {uiDefinitionToReact} from "cad/mdf/ui/render";
import {DynamicComponents} from "cad/mdf/ui/componentRegistry";
import {ParamsPath} from "cad/craft/wizard/wizardTypes";
import _ from "lodash";

export interface MDFCommand<R> {
  id: string;
  label: string;
  info: string;
  icon: IconType | IconDeclaration;
  run: (request: R, opContext: CoreContext) => OperationResult | Promise<OperationResult>;
  paramsInfo: (params: R) => string,
  mutualExclusiveFields?: string[],
  form: FormDefinition
}


export function loadMDFCommand<R>(mdfCommand: MDFCommand<R>): OperationDescriptor<R> {
  const uiDefinition: UIDefinition = {
    type: 'group',
    content: mdfCommand.form
  }
  const {schema: derivedSchema} = deriveSchema(uiDefinition);
  return {
    id: mdfCommand.id,
    label: mdfCommand.label,
    icon: resolveMDFIcon(mdfCommand.icon),
    info: mdfCommand.info,
    paramsInfo: mdfCommand.paramsInfo,
    onParamsUpdate: (params, name, value) => {
      if (mdfCommand.mutualExclusiveFields) {
        handleMutualExclusiveFields(mdfCommand.mutualExclusiveFields, params, name, value);
      }
    },
    run: mdfCommand.run,
    // actionParams: {
    //   ...requiresFaceSelection(1)
    // },
    form: uiDefinitionToReact(uiDefinition),
    schema: derivedSchema
  }
}

function traverseUIDefinition(uiDefinition: UIDefinition, onField: (pathPrefix: ParamsPath, comp: FieldWidgetProps) => void) {
  function inorder(comp: DynamicWidgetProps, prefix: ParamsPath) {

    if (isFieldWidgetProps(comp)) {
      onField(prefix, comp);
    }

    if (isContainerWidgetProps(comp)) {
      let subPrefix = prefix;
      if (isSubFormWidgetProps(comp)) {
        subPrefix = [...prefix, comp.name];
      }
      comp.content.forEach(comp => inorder(comp, subPrefix))
    }
  }

  inorder(uiDefinition, []);
}

export function deriveSchema(uiDefinition: UIDefinition): {
  schema: OperationSchema
} {



  const schema: OperationSchema = {};

  traverseUIDefinition(uiDefinition, (prefix, field) => {
    let propsToSchema = DynamicComponents[field.type].propsToSchema;
    let fieldSchema = propsToSchema(schema, field as any);
    _.set(schema, [...prefix, field.name], fieldSchema);
  });



  return {
    schema
  };
}


export function handleMutualExclusiveFields(mutualExclusiveFields, params, name, value) {
  if (mutualExclusiveFields.includes(name)) {
    mutualExclusiveFields.forEach(param => {
      if (param !== name) {
        delete params[param];
      }
    })
  }
}