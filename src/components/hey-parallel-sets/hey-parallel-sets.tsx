// import Enumerable from 'linq';
import { Component, Host, h, ComponentInterface, Prop, forceUpdate, Element } from '@stencil/core';
import data from '../../utils/data';
import { Axis } from '../../utils/data-structures/axis';
import { Datum } from '../../utils/data-structures/basic';
import { obtainDimensionAndAxisMap } from '../../utils/obtain-dimension-and-axis-map';

@Component({
  tag: 'hey-parallel-sets',
  styleUrl: 'hey-parallel-sets.css',
  shadow: true,
})
export class HeyParallelSets implements ComponentInterface {
  private _mainSvgElement: SVGElement;
  private get mainSvgElement() {
    return this._mainSvgElement;
  }
  private set mainSvgElement(value: SVGElement) {
    if (this._mainSvgElement !== value) {
      forceUpdate(this.hostElement);
    }
    this._mainSvgElement = value;
  }

  @Element() hostElement: HTMLHeyParallelSetsElement;

  @Prop() data: Datum[] = data;
  @Prop() dimensions: string[] = ['Class', 'Age', 'Sex', 'Survived'];

  render() {
    return (
      <Host>
        <svg id="main-svg" ref={el => (this.mainSvgElement = el)}>
          {this.mainSvgElement && this.renderVis()}
        </svg>
      </Host>
    );
  }

  private renderVis() {
    const dimensionAndAxisMap = obtainDimensionAndAxisMap({ dimensions: this.dimensions, data: this.data });
    return [this.renderAxes(dimensionAndAxisMap)];
  }

  private renderAxes(dimensionAndAxisMap: Map<string, Axis>) {
    return (
      <g class="axes">
        {this.dimensions.map((dimension, dimensionIndex) => {
          const axisPositionRatio = (dimensionIndex / this.dimensions.length) * 0.9 + 0.05;
          const axis = dimensionAndAxisMap.get(dimension);
          const segments = axis.segments;
          const margin = 0.05;
          const marginForEachSegment = margin / segments.length;
          let previousRatio = 0;
          return (
            <g class="axis">
              {segments.map(segment => {
                const marginForEachSide = marginForEachSegment / 2;
                const line = (
                  <line
                    class="segment"
                    x1={this.ratioToPercentageString(previousRatio + marginForEachSide)}
                    y1={this.ratioToPercentageString(axisPositionRatio)}
                    x2={this.ratioToPercentageString(previousRatio + segment.ratio - marginForEachSide)}
                    y2={this.ratioToPercentageString(axisPositionRatio)}
                    stroke="black"
                    stroke-width={10}
                  >
                    <title>{`${axis.label}: ${segment.label}`}</title>
                  </line>
                );
                previousRatio += segment.ratio;
                return line;
              })}
            </g>
          );
        })}
      </g>
    );
  }

  private ratioToPercentageString(ratio: number) {
    return `${ratio * 100}%`;
  }
}
