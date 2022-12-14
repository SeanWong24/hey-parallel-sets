import { Axis } from './axis';
import { Datum, RatioRange, WithDomElement } from './basic';
import { WrappedValue } from './wrapped-value';

export interface AxisSegmentOptions {
  axis: Axis;
  value: WrappedValue;
  data: Datum[];
  merged?: boolean;
  label?: string;
}

export class AxisSegment implements AxisSegmentOptions, WithDomElement<SVGGElement> {
  axis: Axis;
  value: WrappedValue;
  ratioOffset: number = 0;
  data: Datum[];
  merged: boolean = false;
  domElement?: SVGGElement;

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

  get ratioRange() {
    return { start: this.ratioOffset, end: this.ratioOffset + this.adjustedRatio } as RatioRange;
  }

  constructor(options: AxisSegmentOptions) {
    Object.assign(this, options);
  }
}
