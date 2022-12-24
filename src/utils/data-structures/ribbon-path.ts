// import Enumerable from 'linq';
import { HeyParallelSets } from '../../components/hey-parallel-sets/hey-parallel-sets';
import { AxisSegment } from './axis-segment';
import { Datum, RatioRange } from './basic';

export interface RibbonPathOptions {
  parallelSets: HeyParallelSets;
  axisSegments: AxisSegment[];
  data: Datum[];
  ratioRangeInAxisSegment?: RatioRange;
}

export class RibbonPath implements RibbonPathOptions {
  parallelSets: HeyParallelSets;
  axisSegments: AxisSegment[];
  data: Datum[];
  ratioRangeInAxisSegment?: RatioRange;

  get valueHistory() {
    return this.axisSegments?.map(segment => segment.value);
  }

  get currentAxisSegment() {
    return this.axisSegments?.at(-1);
  }

  get previousAxisSegment() {
    return this.axisSegments?.at(-2);
  }

  get fullData() {
    return this.parallelSets?.data;
  }

  get segmentData() {
    return this.currentAxisSegment?.data ?? this.parallelSets?.data;
  }

  get ratioInAxisSegment() {
    return this.ratioRangeInAxisSegment?.end - this.ratioRangeInAxisSegment?.start;
  }

  get ratio() {
    return this.ratioInAxisSegment * (this.currentAxisSegment ? this.currentAxisSegment.ratio : 1);
  }

  constructor(options: RibbonPathOptions) {
    Object.assign(this, options);
  }

  addSegmentToEnd(segment: AxisSegment) {
    this.axisSegments.push(segment);
    return this;
  }

  addSegmentToBeginning(segment: AxisSegment) {
    this.axisSegments.unshift(segment);
    return this;
  }

  updateRatioRangeInAxisSegment(range: RatioRange) {
    this.ratioRangeInAxisSegment = range;
    return this;
  }

  clone() {
    return new RibbonPath({ parallelSets: this.parallelSets, axisSegments: [...this.axisSegments], ratioRangeInAxisSegment: this.ratioRangeInAxisSegment, data: this.data });
  }

  equal(other: RibbonPath) {
    return this.axisSegments?.every((segment, i) => other?.axisSegments?.[i] === segment);
  }
}
