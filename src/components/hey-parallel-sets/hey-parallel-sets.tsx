import { Component, Host, h, ComponentInterface, Prop, State } from '@stencil/core';
import Enumerable from 'linq';
import { Axis, AxisValueSortingFunction } from '../../utils/data-structures/axis';
import { AxisConfigDict, Datum } from '../../utils/data-structures/basic';

@Component({
  tag: 'hey-parallel-sets',
  styleUrl: 'hey-parallel-sets.css',
  shadow: true,
})
export class HeyParallelSets implements ComponentInterface {
  @State() dimensionAndAxisMap: Map<string, Axis>;

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
    return [this.renderAxes()];
  }

  private renderAxes() {
    return (
      <g class="axes">
        {this.dimensions?.map((dimension, dimensionIndex) => {
          const axisMargin = 0.1;
          const axisRatio = (dimensionIndex / (this.dimensions.length - 1)) * (1 - axisMargin) + axisMargin / 2;
          const axis = this.dimensionAndAxisMap.get(dimension);
          const segments = axis.segments;
          const totalMarginForSegments = 0.05;
          const marginForEachSegment = totalMarginForSegments / segments.length;
          let previousSegmentRatio = 0;
          return (
            <g class="axis">
              {segments.map(segment => {
                const marginForEachSide = marginForEachSegment / 2;
                const segmentElement = (
                  <g class="axis-segment">
                    <rect
                      class="axis-segment-box"
                      x={this.ratioToPercentageString(axisRatio)}
                      y={this.ratioToPercentageString(previousSegmentRatio + marginForEachSide)}
                      width="15px"
                      height={this.ratioToPercentageString(segment.adjustedRatio - marginForEachSegment)}
                      fill="black"
                    >
                      <title>{`${axis.label}: ${segment.label} (${segment.ratio.toFixed(2)}%)`}</title>
                    </rect>
                    <line
                      class="axis-segment-line"
                      x1={this.ratioToPercentageString(axisRatio)}
                      y1={this.ratioToPercentageString(previousSegmentRatio + marginForEachSide)}
                      x2={this.ratioToPercentageString(axisRatio)}
                      y2={this.ratioToPercentageString(previousSegmentRatio + segment.adjustedRatio - marginForEachSide)}
                      stroke="black"
                    ></line>
                  </g>
                );
                previousSegmentRatio += segment.adjustedRatio;
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

  private ratioToPercentageString(ratio: number) {
    return `${ratio * 100}%`;
  }
}
