import {NumberTypeSchema} from "cad/craft/schema/types/numberType";
import {EntityTypeSchema} from "cad/craft/schema/types/entityType";
import {ArrayTypeSchema} from "cad/craft/schema/types/arrayType";
import {ObjectTypeSchema} from "cad/craft/schema/types/objectType";
import {StringTypeSchema} from "cad/craft/schema/types/stringType";
import {BooleanTypeSchema} from "cad/craft/schema/types/booleanType";
import {Types} from "cad/craft/schema/types";

export type Coercable = any;

export type PrimitiveSchemaField =
  | EntityTypeSchema
  | NumberTypeSchema
  | StringTypeSchema
  | BooleanTypeSchema
  | ArrayTypeSchema;

export type SchemaField = PrimitiveSchemaField | ObjectTypeSchema;

export type OperationSchema = {
  [key: string]: SchemaField;
};

export type OperationFlattenSchema = {
  [key: string]: PrimitiveSchemaField;
};

export interface BaseSchemaField {
  defaultValue: OperationParamValue,
  optional: boolean,
  label?: string,
}

export type OperationParamPrimitive = number|boolean|string;

export type OperationParamValue = OperationParamPrimitive|OperationParamPrimitive[]|OperationParams;

export type OperationParams = {
  [key: string]: OperationParamValue;
}

export type MaterializedOperationParams = {
  [key: string]: any;
}

export type OperationParamsError = {
  path: string[],
  message: string
};

export type OperationParamsErrorReporter = ((msg: string) => void) & {
  dot: (pathPart: string|number) => OperationParamsErrorReporter
};

export function schemaIterator(schema: OperationSchema,
                               callback: (path: string[], flattenedPath: string, field: PrimitiveSchemaField) => void) {

  function inorder(schema: OperationSchema, parentPath: string[]) {

    Object.keys(schema).forEach(key => {
      const path = [...parentPath, key]
      const flattenedPath = path.join('/');
      const schemaField = schema[key];


      if (schemaField.type === 'object') {
        inorder(schemaField.schema, path);
      } else {
        callback(path, flattenedPath, schemaField as PrimitiveSchemaField);
      }
    })

  }
  inorder(schema, []);
}

export function unwrapMetadata(fieldMd: SchemaField) {
  if (fieldMd.type === Types.array) {
    return unwrapMetadata(fieldMd.items);
  }
  return fieldMd;
}