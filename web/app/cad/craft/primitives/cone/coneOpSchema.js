import booleanOptionSchema from '../booleanOptionSchema';

export default {
  datum: {
    type: 'datum',
    optional: true,
    defaultValue: {type: 'selection'}
  },
  radius: {
    type: 'number',
    defaultValue: 100,
    min: 0
  },
  frustum: {
    type: 'number',
    defaultValue: 0,
    min: 0
  },
  height: {
    type: 'number',
    defaultValue: 250,
    min: 0
  },
  boolean: booleanOptionSchema
}