import { Component, Host, h, ComponentInterface, Prop, State, Element } from '@stencil/core';
import Enumerable from 'linq';
import { Axis, AxisValueSortingFunction } from '../../utils/data-structures/axis';
import { AxisSegment } from '../../utils/data-structures/axis-segment';
import { AxisConfigDict, Datum, RatioRange } from '../../utils/data-structures/basic';
import { RibbonPath } from '../../utils/data-structures/ribbon-path';
import { RibbonTree } from '../../utils/data-structures/ribbon-tree';

@Component({
  tag: 'hey-parallel-sets',
  styleUrl: 'hey-parallel-sets.css',
  shadow: true,
})
export class HeyParallelSets implements ComponentInterface {
  private readonly AXIS_MARGIN = 0.1;

  @Element() hostElement: HTMLHeyParallelSetsElement;

  @State() dimensionAndAxisMap: Map<string, Axis>;
  @State() ribbonTree: RibbonTree;
  @State() hostElementBoundingClientRect: DOMRect;

  @Prop() data: Datum[];
  @Prop() dimensions: string[];
  @Prop() dimensionAndAxisLabelDict?: AxisConfigDict<string>;
  @Prop() dimensionAndAxisMaxSegmentCountLimitDict?: AxisConfigDict<number>;
  @Prop() dimensionAndAxisMergedSegmentLabelDict: AxisConfigDict<string>;
  @Prop() dimensionAndAxisMergedSegmentMaxRatioDict: AxisConfigDict<number>;
  @Prop() dimensionAndAxisValueSortingFunctionDict: AxisConfigDict<AxisValueSortingFunction>;
  @Prop() ribbonTension: number = 1;

  componentWillRender() {
    this.dimensionAndAxisMap = this.obtainDimensionAndAxisMap();
    this.obtainRibbonTree();
  }

  componentDidLoad() {
    const resizeObserver = new ResizeObserver(entryList => {
      for (const entry of entryList) {
        if (entry.target === this.hostElement) {
          this.hostElementBoundingClientRect = entry.target.getBoundingClientRect();
        }
      }
    });
    resizeObserver.observe(this.hostElement);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (['data', 'dimensions'].includes(propName)) {
      this.dimensionAndAxisMap = this.obtainDimensionAndAxisMap();
    }
  }

  render() {
    return (
      <Host>
        <svg id="main-svg">{this.renderVis()}</svg>
      </Host>
    );
  }

  private renderVis() {
    return this.hostElementBoundingClientRect?.width > 0 && this.hostElementBoundingClientRect?.height > 0 && [this.renderRibbons(), this.renderAxes()];
  }

  private renderAxes() {
    return (
      <g class="axes">
        {this.dimensions?.map((dimension, dimensionIndex) => {
          const axisRatio = (dimensionIndex / (this.dimensions.length - 1)) * (1 - this.AXIS_MARGIN) + this.AXIS_MARGIN / 2;
          const axis = this.dimensionAndAxisMap.get(dimension);
          const segments = axis.segments;
          const totalMarginForSegments = 0.05;
          const marginForEachSegment = totalMarginForSegments / segments.length;
          return (
            <g class="axis">
              {segments.map(segment => {
                const marginForEachSide = marginForEachSegment / 2;
                const ratioRange = this.obtainAxisSegmentRatioRangeWithAbsoluteMargins(segment.ratioRange, [marginForEachSide, marginForEachSide]);
                const segmentElement = (
                  <g class="axis-segment">
                    <rect
                      class="axis-segment-box"
                      x={this.ratioToPixel(axisRatio, this.hostElementBoundingClientRect.width)}
                      y={this.ratioToPixel(ratioRange.start, this.hostElementBoundingClientRect.height)}
                      width="15px"
                      height={this.ratioToPixel(ratioRange.end - ratioRange.start, this.hostElementBoundingClientRect.height)}
                      fill="black"
                    >
                      <title>{`${axis.label}: ${segment.label} (${this.ratioToPercentageString(segment.ratio)})`}</title>
                    </rect>
                    <line
                      class="axis-segment-line"
                      x1={this.ratioToPixel(axisRatio, this.hostElementBoundingClientRect.width)}
                      y1={this.ratioToPixel(ratioRange.start, this.hostElementBoundingClientRect.height)}
                      x2={this.ratioToPixel(axisRatio, this.hostElementBoundingClientRect.width)}
                      y2={this.ratioToPixel(ratioRange.end, this.hostElementBoundingClientRect.height)}
                      stroke="black"
                    ></line>
                  </g>
                );
                return segmentElement;
              })}
            </g>
          );
        })}
      </g>
    );
  }

  private renderRibbons() {
    return (
      <g class="ribbons">
        {Enumerable.from(this.ribbonTree?.children ?? [])
          .traverseBreadthFirst(ribbonTree => Enumerable.from(ribbonTree.children ?? []))
          .where(ribbonTree => ribbonTree.depth > 1)
          .select(ribbonTree => {
            const dimensionIndex = ribbonTree.depth - 2;
            const totalMarginForSegments = 0.05;

            const previousAxisSegment = ribbonTree.path?.previousAxisSegment;
            const marginForEachSideOfPreviousAxisSegment = totalMarginForSegments / previousAxisSegment?.axis?.segments?.length / 2;
            const previousAxisSegmentRatioRange = this.obtainAxisSegmentRatioRangeWithAbsoluteMargins(previousAxisSegment?.ratioRange, [
              marginForEachSideOfPreviousAxisSegment,
              marginForEachSideOfPreviousAxisSegment,
            ]);
            const ratioRangeInPreviousAxisSegment = ribbonTree.ratioRangeInPreviousAxisSegment;
            const ratioRangeForPreviousAxis = this.obtainAxisSegmentRatioRangeWithRelativeMargins(previousAxisSegmentRatioRange, [
              ratioRangeInPreviousAxisSegment.start,
              1 - ratioRangeInPreviousAxisSegment.end,
            ]);

            const nextAxisSegment = ribbonTree.path?.currentAxisSegment;
            const marginForEachSideOfNextAxisSegment = totalMarginForSegments / nextAxisSegment?.axis?.segments?.length / 2;
            const nextAxisSegmentRatioRange = this.obtainAxisSegmentRatioRangeWithAbsoluteMargins(nextAxisSegment?.ratioRange, [
              marginForEachSideOfNextAxisSegment,
              marginForEachSideOfNextAxisSegment,
            ]);
            const ratioRangeInNextAxisSegment = ribbonTree.ratioRangeInNextAxisSegment;
            const ratioRangeForNextAxis = this.obtainAxisSegmentRatioRangeWithRelativeMargins(nextAxisSegmentRatioRange, [
              ratioRangeInNextAxisSegment.start,
              1 - ratioRangeInNextAxisSegment.end,
            ]);

            const axisRatio = (dimensionIndex / (this.dimensions.length - 1)) * (1 - this.AXIS_MARGIN) + this.AXIS_MARGIN / 2;
            const childDimensionIndex = dimensionIndex + 1;
            const childAxisRatio = (childDimensionIndex / (this.dimensions.length - 1)) * (1 - this.AXIS_MARGIN) + this.AXIS_MARGIN / 2;
            const pathD = this.obtainRibbonPathD({
              x: this.ratioToPixel(axisRatio, this.hostElementBoundingClientRect.width),
              y1: this.ratioToPixel(ratioRangeForPreviousAxis.start, this.hostElementBoundingClientRect.height),
              y2: this.ratioToPixel(ratioRangeForPreviousAxis.end, this.hostElementBoundingClientRect.height),
              childX: this.ratioToPixel(childAxisRatio, this.hostElementBoundingClientRect.width),
              childY1: this.ratioToPixel(ratioRangeForNextAxis.start, this.hostElementBoundingClientRect.height),
              childY2: this.ratioToPixel(ratioRangeForNextAxis.end, this.hostElementBoundingClientRect.height),
            });
            return (
              <path class="ribbon" d={pathD} fill="rgb(0,0,0,0.1)">
                <title>{ribbonTree.path?.axisSegments?.map(segment => segment.label)?.join(', ') + ` (${this.ratioToPercentageString(ribbonTree.ratio)})`}</title>
              </path>
            );
          })
          .toArray()}
      </g>
    );
  }

  private obtainDimensionAndAxisMap() {
    const entries = Enumerable.from(this.dimensions ?? [])
      .select(
        dimension =>
          [
            dimension,
            new Axis({
              parallelSets: this,
              dimension,
              label: this.obtainAxisConfigDictValue(dimension, this.dimensionAndAxisLabelDict),
              maxSegmentCountLimit: this.obtainAxisConfigDictValue(dimension, this.dimensionAndAxisMaxSegmentCountLimitDict),
              mergedSegmentLabel: this.obtainAxisConfigDictValue(dimension, this.dimensionAndAxisMergedSegmentLabelDict),
              mergedSegmentMaxRatioLimit: this.obtainAxisConfigDictValue(dimension, this.dimensionAndAxisMergedSegmentMaxRatioDict),
              valueSortingFunction: this.obtainAxisConfigDictValue(dimension, this.dimensionAndAxisValueSortingFunctionDict),
            }),
          ] as [string, Axis],
      )
      .toArray();
    const dimensionAndAxisMap = new Map(entries);
    return dimensionAndAxisMap;
  }

  private obtainRibbonTree() {
    const axisSegmentAndRibbonPathMap = this.obtainAxisSegmentAndValueSetMap();
    this.ribbonTree = new RibbonTree({
      parallelSets: this,
      axisSegmentAndRibbonPathMap,
      path: new RibbonPath({ parallelSets: this, axisSegments: [], ratioRangeInAxisSegment: { start: 0, end: 1 }, data: this.data }),
    });
  }

  private obtainAxisSegmentAndValueSetMap() {
    const calculateSetRatioInSegment = (path: RibbonPath) =>
      Enumerable.from(path?.axisSegments ?? [])
        .takeExceptLast()
        .aggregate(1, (prev, segment) => prev * segment?.ratio);
    const entries = Enumerable.from(this.dimensions ?? [])
      .selectMany((dimension, dimensionIndex) => {
        const axesForPreviousDimensions = Enumerable.from(this.dimensions)
          .take(dimensionIndex)
          .select(dimension => this.dimensionAndAxisMap?.get(dimension))
          .toArray();
        const axisForCurrentDimension = this.dimensionAndAxisMap?.get(dimension);
        const entries = Enumerable.from(axisForCurrentDimension?.segments ?? []).select(segment => {
          let ribbonPaths: RibbonPath[] = [];
          if (axesForPreviousDimensions.length < 1) {
            const ribbonPath = new RibbonPath({ parallelSets: this, axisSegments: [segment], ratioRangeInAxisSegment: { start: 0, end: 1 }, data: segment?.data });
            ribbonPaths.push(ribbonPath);
          } else {
            Enumerable.from(axesForPreviousDimensions)
              .reverse()
              .forEach(axis => {
                let ratioOffset = 0;
                ribbonPaths = Enumerable.from(axis?.segments ?? [])
                  .selectMany(_segment => {
                    if (ribbonPaths?.length > 0) {
                      return Enumerable.from(ribbonPaths).select(previousRibbonPath => {
                        const ribbonPath = previousRibbonPath?.clone().addSegmentToBeginning(_segment);
                        ribbonPath.data = Enumerable.from(ribbonPath?.data ?? [])
                          .where(datum => _segment?.value?.match(datum[_segment?.axis?.dimension]))
                          .toArray();
                        ribbonPath.updateRatioRangeInAxisSegment({
                          start: ratioOffset,
                          end: (ratioOffset = ratioOffset + calculateSetRatioInSegment(ribbonPath)),
                        });
                        return ribbonPath;
                      });
                    } else {
                      const ribbonPath = new RibbonPath({
                        parallelSets: this,
                        axisSegments: [_segment, segment],
                        data: Enumerable.from(segment?.data ?? [])
                          .where(datum => _segment?.value?.match(datum[_segment?.axis?.dimension]))
                          .toArray(),
                      });
                      ribbonPath.updateRatioRangeInAxisSegment({
                        start: ratioOffset,
                        end: (ratioOffset = ratioOffset + calculateSetRatioInSegment(ribbonPath)),
                      });
                      return Enumerable.from([ribbonPath]);
                    }
                  })
                  .toArray();
              });
          }
          return [segment, ribbonPaths] as [AxisSegment, RibbonPath[]];
        });
        return entries;
      })
      .toArray();
    const axisSegmentAndValueSetMap = new Map(entries);
    return axisSegmentAndValueSetMap;
  }

  private obtainAxisConfigDictValue<T>(dimension: string, dict?: AxisConfigDict<T>) {
    return dict?.[dimension] ?? dict?.[''];
  }

  private ratioToPercentageString(ratio: number, decimalDigits: number = 2) {
    return `${(ratio * 100).toFixed(decimalDigits)}%`;
  }

  private ratioToPixel(ratio: number, fullPixels: number) {
    return fullPixels * ratio;
  }

  private obtainRibbonPathD(params: { x: number; y1: number; y2: number; childX: number; childY1: number; childY2: number }) {
    const { x, y1, y2, childX, childY1, childY2 } = params;

    const controlPointX1 = this.ribbonTension * x + (1 - this.ribbonTension) * childX;
    const controlPointX2 = this.ribbonTension * childX + (1 - this.ribbonTension) * x;
    let pathD = `M${x},${y1}`;
    pathD += `L${x},${y2}`;
    pathD += `C${controlPointX1},${y2},${controlPointX2},${childY2},${childX},${childY2}`;
    pathD += `L${childX},${childY1}`;
    pathD += `C${controlPointX2},${childY1},${controlPointX1},${y1},${x},${y1}`;
    pathD += `Z`;
    return pathD;
  }

  private obtainAxisSegmentRatioRangeWithAbsoluteMargins(ratioRange: RatioRange, marginRatios: [number, number]) {
    return {
      start: ratioRange.start + marginRatios?.[0],
      end: ratioRange.end - marginRatios?.[1],
    } as RatioRange;
  }

  private obtainAxisSegmentRatioRangeWithRelativeMargins(ratioRange: RatioRange, marginRatios: [number, number]) {
    const ratio = ratioRange.end - ratioRange.start;
    return {
      start: ratioRange.start + marginRatios?.[0] * ratio,
      end: ratioRange.end - marginRatios?.[1] * ratio,
    } as RatioRange;
  }
}
