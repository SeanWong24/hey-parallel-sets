import { Component, Host, h, ComponentInterface, Prop, State, Element } from '@stencil/core';
import Enumerable from 'linq';
import { Axis, AxisValueSortingFunction } from '../../utils/data-structures/axis';
import { AxisConfigDict, Datum, RatioRange } from '../../utils/data-structures/basic';

@Component({
  tag: 'hey-parallel-sets',
  styleUrl: 'hey-parallel-sets.css',
  shadow: true,
})
export class HeyParallelSets implements ComponentInterface {
  private readonly AXIS_MARGIN = 0.1;

  @Element() hostElement: HTMLHeyParallelSetsElement;

  @State() dimensionAndAxisMap: Map<string, Axis>;
  @State() hostElementBoundingClientRect: DOMRect;

  @Prop() data: Datum[];
  @Prop() dimensions: string[];
  @Prop() dimensionAndAxisLabelDict?: AxisConfigDict<string>;
  @Prop() dimensionAndAxisMaxSegmentCountLimitDict?: AxisConfigDict<number>;
  @Prop() dimensionAndAxisMergedSegmentLabelDict: AxisConfigDict<string>;
  @Prop() dimensionAndAxisMergedSegmentMaxRatioDict: AxisConfigDict<number>;
  @Prop() dimensionAndAxisValueSortingFunctionDict: AxisConfigDict<AxisValueSortingFunction>;

  componentWillRender() {
    this.dimensionAndAxisMap = this.obtainDimensionAndAxisMap();
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
    return this.hostElementBoundingClientRect?.width > 0 && this.hostElementBoundingClientRect?.height > 0 && [this.renderAxes()];
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
                const ratioRange = this.obtainAxisSegmentRatioRangeWithMargin(segment.ratioRange, marginForEachSide);
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
                      <title>{`${axis.label}: ${segment.label} (${segment.ratio.toFixed(2)}%)`}</title>
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

  private obtainAxisConfigDictValue<T>(dimension: string, dict?: AxisConfigDict<T>) {
    return dict?.[dimension] ?? dict?.[''];
  }

  private ratioToPixel(ratio: number, fullPixels: number) {
    return fullPixels * ratio;
  }
  
  private obtainAxisSegmentRatioRangeWithMargin(ratioRange: RatioRange, marginRatio: number) {
    return {
      start: ratioRange.start + marginRatio,
      end: ratioRange.end - marginRatio,
    } as RatioRange;
  }
}
