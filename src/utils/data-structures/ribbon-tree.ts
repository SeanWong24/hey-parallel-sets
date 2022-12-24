import Enumerable from 'linq';
import { HeyParallelSets } from '../../components/hey-parallel-sets/hey-parallel-sets';
import { AxisSegment } from './axis-segment';
import { RatioRange, WithDomElement } from './basic';
import { RibbonPath } from './ribbon-path';

export interface RibbonTreeOptions {
  parallelSets: HeyParallelSets;
  axisSegmentAndRibbonPathMap: Map<AxisSegment, RibbonPath[]>;
  path: RibbonPath;
  parent?: RibbonTree;
  depth?: number;
  ratioOffsetInPreviousAxisSegment?: number;
}

export class RibbonTree implements RibbonTreeOptions, WithDomElement<SVGPathElement> {
  depth: number = 0;
  parallelSets: HeyParallelSets;
  axisSegmentAndRibbonPathMap: Map<AxisSegment, RibbonPath[]>;
  path: RibbonPath;
  ratioOffsetInPreviousAxisSegment: number = 0;
  parent?: RibbonTree;
  children?: RibbonTree[];
  domElement?: SVGPathElement;

  get data() {
    return this.path?.data;
  }

  get ratio() {
    return this.path?.ratio;
  }

  get ratioInNextAxisSegment() {
    return this.path?.ratioInAxisSegment;
  }

  get ratioRangeInNextAxisSegment() {
    return this.path?.ratioRangeInAxisSegment;
  }

  get ratioInParentRibbon() {
    return this.data?.length / this.parent?.data?.length;
  }

  get ratioInPreviousAxisSegment() {
    return this.ratioInParentRibbon * this.parent?.ratioInNextAxisSegment;
  }

  get ratioRangeInPreviousAxisSegment() {
    return { start: this.ratioOffsetInPreviousAxisSegment, end: this.ratioOffsetInPreviousAxisSegment + this.ratioInPreviousAxisSegment } as RatioRange;
  }

  constructor(options: RibbonTreeOptions) {
    Object.assign(this, options);
    const dimensions = this.parallelSets?.dimensions;
    const dimensionAndAxisMap = this.parallelSets?.dimensionAndAxisMap;
    const depth = this.path?.axisSegments?.length + 1;
    const dimensionIndex = depth - 1;
    if (dimensionIndex < dimensions?.length) {
      const dimension = dimensions?.[dimensionIndex];
      const axis = dimensionAndAxisMap?.get(dimension);
      let ratioOffset = this.ratioRangeInNextAxisSegment?.start;
      this.children = Enumerable.from(axis?.segments ?? [])
        .select(segment => {
          const ribbonPaths = this.axisSegmentAndRibbonPathMap?.get(segment);
          const ribbonPath = Enumerable.from(ribbonPaths ?? [])
            .where(ribbonPath => this.path?.axisSegments?.every((seg, i) => seg === ribbonPath?.axisSegments?.[i]) && ribbonPath.currentAxisSegment === segment)
            .firstOrDefault();
          const ribbonTree = new RibbonTree({
            parallelSets: this.parallelSets,
            axisSegmentAndRibbonPathMap: this.axisSegmentAndRibbonPathMap,
            path: ribbonPath,
            parent: this,
            depth,
            ratioOffsetInPreviousAxisSegment: ratioOffset,
          });
          ratioOffset += ribbonTree.ratioInPreviousAxisSegment;
          return ribbonTree;
        })
        .where(ribbonTree => ribbonTree.data?.length > 0)
        .toArray();
    }
  }
}
