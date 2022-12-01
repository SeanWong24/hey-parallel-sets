import { Axis } from './axis';
import { Datum } from './basic';
import { WrappedValue } from './wrapped-value';

export interface AxisSegmentOptions {
  axis: Axis;
  value: WrappedValue;
  data: Datum[];
  merged?: boolean;
  label?: string;
}

export class AxisSegment implements AxisSegmentOptions {
  axis: Axis;
  value: WrappedValue;
  data: Datum[];
  merged: boolean = false;

  private _label?: string;
  get label() {
    return this._label ?? this.value?.label;
  }
  set label(label: string) {
    this._label = label;
  }

  get fullData() {
    return this.axis?.data;
  }

  get ratio() {
    return this.data?.length / (this.fullData?.length ?? 0);
  }

  get mergedSegmentAdjustmentRatio() {
    return this.axis?.mergedSegmentAdjustmentRatio ?? 0;
  }

  get adjustedRatio() {
    return this.merged ? this.ratio - this.mergedSegmentAdjustmentRatio : this.ratio + this.mergedSegmentAdjustmentRatio * (this.ratio / (1 - this.axis.mergedSegmentRatio));
  }

  constructor(options: AxisSegmentOptions) {
    Object.assign(this, options);
  }
}
