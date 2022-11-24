import Enumerable from 'linq';
import { Datum } from './data-structures/basic';
import { RibbonPath } from './data-structures/ribbon-path';

export function filterDataByRibbonPath(data: Datum[], ribbonPath: RibbonPath) {
  return Enumerable.from(data)
    .where(datum => Enumerable.from(ribbonPath?.segments ?? []).all(segment => segment.value?.match(datum[segment.axis?.dimension || ''])))
    .toArray();
}
