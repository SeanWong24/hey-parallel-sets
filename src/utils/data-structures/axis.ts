import Enumerable from 'linq';
import { Datum } from './basic';
import { Segment } from './segment';
import { WrappedValue } from './wrapped-value';

export class Axis {
  get label() {
    return this._label ?? this.dimension;
  }

  get segments() {
    if ((this.maxSegmentCountLimit ?? 0) > 0) {
      const normalSegments = this._segments?.slice(0, (this.maxSegmentCountLimit as number) - 1);
      const segmentsToBeMerged = this._segments?.slice((this.maxSegmentCountLimit as number) - 1);
      const mergedSegment =
        segmentsToBeMerged?.length > 0 &&
        new Segment(
          new WrappedValue(
            Enumerable.from(segmentsToBeMerged)
              .distinct(segment => segment.value.values.toString())
              .selectMany(segment => segment.value.values)
              .toArray(),
          ),
          segmentsToBeMerged.flatMap(segment => segment.data),
          this.mergedSegmentLabel,
          segmentsToBeMerged.flatMap(segment => segment.ribbons ?? []),
        );
      const segments = [...normalSegments];
      if (mergedSegment) {
        segments.push(mergedSegment);
      }
      return segments;
    } else {
      return this._segments;
    }
  }

  constructor(
    public dimension: string,
    public fullData: Datum[],
    private _segments: Segment[],
    private _label?: string,
    public maxSegmentCountLimit?: number /** must be greater than 0 */,
    public mergedSegmentLabel?: string,
  ) {
    this._segments.forEach(segment => (segment.axis = this));
  }
}
