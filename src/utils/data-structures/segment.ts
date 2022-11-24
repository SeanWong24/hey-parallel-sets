import { Axis } from './axis';
import { Datum } from './basic';
import { Ribbon } from './ribbon';
import { WrappedValue } from './wrapped-value';

export class Segment {
  get label() {
    return this._label ?? this.value?.label;
  }

  get fullData() {
    return this.axis?.fullData;
  }

  get ratio() {
    return this.data?.length / (this.fullData?.length ?? 0);
  }

  axis?: Axis;

  constructor(public value: WrappedValue, public data: Datum[], private _label?: string, public ribbons?: Ribbon[]) {}
}
