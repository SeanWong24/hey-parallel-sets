import { Value } from './basic';

export class WrappedValue {
  get label() {
    return this._label ?? this.values?.toString();
  }

  values: Value[];

  constructor(value: Value, _label?: string);
  constructor(values: Value[], _label?: string);
  constructor(valueOrValues: Value | Value[], private _label?: string) {
    if (Array.isArray(valueOrValues)) {
      this.values = valueOrValues;
    } else {
      this.values = [valueOrValues];
    }
  }

  match(value: Value) {
    return this.values.includes(value);
  }

  toString() {
    return `[${this.values?.toString()}]`;
  }
}
