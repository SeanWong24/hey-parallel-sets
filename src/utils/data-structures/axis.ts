import Enumerable from 'linq';
import { HeyParallelSets } from '../../components/hey-parallel-sets/hey-parallel-sets';
import { AxisSegment } from './axis-segment';
import { Value } from './basic';
import { WrappedValue } from './wrapped-value';

export type AxisValueSortingFunction = (a: Value, b: Value) => number;

export interface AxisOptions {
  parallelSets: HeyParallelSets;
  dimension: string;
  label?: string;
  maxSegmentCountLimit?: number;
  mergedSegmentLabel?: string;
  mergedSegmentMaxRatioLimit?: number;
  valueSortingFunction?: AxisValueSortingFunction;
}

export class Axis implements AxisOptions {
  parallelSets: HeyParallelSets;
  dimension: string;
  maxSegmentCountLimit?: number;
  mergedSegmentLabel?: string;
  mergedSegmentMaxRatioLimit?: number;
  valueSortingFunction?: AxisValueSortingFunction;
  mergedSegmentAdjustmentRatio: number = 0;

  private _label?: string;
  get label() {
    return this._label ?? this.dimension;
  }
  set label(label: string) {
    this._label = label;
  }

  private _segments: AxisSegment[];
  private _adjustedSegments: AxisSegment[];
  get segments() {
    return this._adjustedSegments;
  }
  set segments(segments: AxisSegment[]) {
    this._segments = segments;
    if (+this.maxSegmentCountLimit > 0) {
      const normalSegments = this._segments?.slice(0, (this.maxSegmentCountLimit as number) - 1);
      const segmentsToBeMerged = this._segments?.slice((this.maxSegmentCountLimit as number) - 1);
      const mergedSegment =
        segmentsToBeMerged?.length > 0 &&
        new AxisSegment({
          axis: this,
          value: new WrappedValue(
            Enumerable.from(segmentsToBeMerged)
              .distinct(segment => segment.value.values.toString())
              .selectMany(segment => segment.value.values)
              .toArray(),
          ),
          data: segmentsToBeMerged.flatMap(segment => segment.data),
          merged: true,
          label: this.mergedSegmentLabel,
        });
      const adjustedSegments = [...normalSegments];
      if (mergedSegment) {
        adjustedSegments.push(mergedSegment);
        const mergedSegmentRatio = mergedSegment.ratio;
        if (mergedSegmentRatio > this.mergedSegmentMaxRatioLimit) {
          this.mergedSegmentAdjustmentRatio = mergedSegmentRatio - this.mergedSegmentMaxRatioLimit;
        }
      }
      this._adjustedSegments = adjustedSegments;
    } else {
      this._adjustedSegments = this._segments;
    }
  }

  get data() {
    return this.parallelSets?.data;
  }

  get mergedSegmentRatio() {
    return this.segments?.find(segnemt => segnemt.merged)?.ratio ?? 0;
  }

  constructor(options: AxisOptions) {
    Object.assign(this, options);
    this.generateSegments();
  }

  private generateSegments() {
    const segments = Enumerable.from(this.data ?? [])
      .groupBy(datum => datum[this.dimension])
      .select(group => new AxisSegment({ axis: this, value: new WrappedValue(group.key()), data: group.toArray() }))
      .toArray();
    if (this.valueSortingFunction) {
      segments.sort((a, b) => this.valueSortingFunction(a.value?.values?.[0], b.value?.values?.[0]));
    }
    this.segments = segments;
  }
}
