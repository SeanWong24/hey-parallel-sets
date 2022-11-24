import Enumerable from 'linq';
import { Axis } from './data-structures/axis';
import { Datum, Value } from './data-structures/basic';
import { Ribbon } from './data-structures/ribbon';
import { RibbonPath } from './data-structures/ribbon-path';
import { Segment } from './data-structures/segment';
import { WrappedValue } from './data-structures/wrapped-value';
import { filterDataByRibbonPath } from './filter-data-by-ribbon-path';
import { obtainConfigDictionaryValue } from './obtain-config-dictionary-value';

type ObtainAxesOptions = {
  dimensions: string[];
  data: Datum[];
  dimensionAndAxisLabelDict?: {
    [dimension: string]: string;
  };
  dimensionAndAxisMaxSegmentCountLimitDict?: {
    [dimension: string]: number;
  };
  dimensionAndAxisMergedValueLabelDict?: {
    [dimension: string]: string;
  };
  dimensionAndAxisValueSortingFunctionDict?: {
    [dimension: string]: (a: Value, b: Value) => number;
  };
};

export function obtainDimensionAndAxisMap({
  dimensions,
  data,
  dimensionAndAxisLabelDict,
  dimensionAndAxisMaxSegmentCountLimitDict,
  dimensionAndAxisMergedValueLabelDict,
  dimensionAndAxisValueSortingFunctionDict,
}: ObtainAxesOptions) {
  const entries = Enumerable.from(dimensions)
    .select(dimension => {
      const segments = Enumerable.from(data)
        .groupBy(datum => datum[dimension])
        .select(group => new Segment(new WrappedValue(group.key()), group.toArray()))
        .toArray();
      const valueSortingFunction = obtainConfigDictionaryValue(dimension, dimensionAndAxisValueSortingFunctionDict);
      if (valueSortingFunction) {
        segments.sort((a, b) => valueSortingFunction(a.value?.values?.[0], b.value?.values?.[0]));
      }
      const axis = new Axis(dimension, data, segments, obtainConfigDictionaryValue(dimension, dimensionAndAxisLabelDict));
      return [dimension, axis] as [string, Axis];
    })
    .toArray();
  const dimensionAndAxisMap = new Map(entries);

  Enumerable.from(dimensions).forEach((dimension, dimensionIndex) => {
    const axesForPreviousDimensions = Enumerable.from(dimensions)
      .take(dimensionIndex)
      .select(dimension => dimensionAndAxisMap?.get(dimension))
      .toArray();
    const axisForCurrentDimension = dimensionAndAxisMap?.get(dimension);
    Enumerable.from(axisForCurrentDimension?.segments ?? []).forEach(segment => {
      let ribbonPaths: RibbonPath[] = [];
      Enumerable.from(axesForPreviousDimensions)
        .reverse()
        .forEach(axis => {
          ribbonPaths = Enumerable.from(axis?.segments ?? [])
            .selectMany(_segment => {
              if (ribbonPaths?.length > 0) {
                return Enumerable.from(ribbonPaths).select(ribbonPath => ribbonPath.clone().addSegmentToBeginning(_segment));
              } else {
                return Enumerable.from([new RibbonPath([_segment, segment])]);
              }
            })
            .toArray();
        });
      segment.ribbons = Enumerable.from(ribbonPaths)
        .select(
          ribbonPath =>
            new Ribbon(
              ribbonPath,
              filterDataByRibbonPath(segment.data, ribbonPath),
              Enumerable.from(ribbonPath.segments?.at(-2)?.ribbons ?? [])
                .where(ribbon => ribbon.path?.valueHistory.every((value, i) => value === ribbonPath.valueHistory?.[i]))
                .firstOrDefault(),
            ),
        )
        .where(ribbon => ribbon.data?.length > 0)
        .toArray();
    });
  });

  dimensionAndAxisMap.forEach((axis, dimension) => {
    axis.maxSegmentCountLimit = obtainConfigDictionaryValue(dimension, dimensionAndAxisMaxSegmentCountLimitDict);
    axis.mergedSegmentLabel = obtainConfigDictionaryValue(dimension, dimensionAndAxisMergedValueLabelDict);
  });
  return dimensionAndAxisMap;
}
