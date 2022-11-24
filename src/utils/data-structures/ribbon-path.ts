import { Segment } from './segment';

export class RibbonPath {
  get valueHistory() {
    return this.segments?.map(segment => segment.value);
  }

  constructor(public segments: Segment[]) {}

  addSegmentToEnd(segment: Segment) {
    this.segments.push(segment);
    return this;
  }

  addSegmentToBeginning(segment: Segment) {
    this.segments.unshift(segment);
    return this;
  }

  clone() {
    return new RibbonPath([...this.segments]);
  }
}
