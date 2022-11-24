import { Datum } from './basic';
import { RibbonPath } from './ribbon-path';

export class Ribbon {
  get segmentData() {
    return this.path?.segments?.at(-1)?.data;
  }

  get fullData() {
    return this.path?.segments?.at(-1)?.fullData;
  }

  get ratioForSegment() {
    return this.data?.length / (this.segmentData?.length ?? 0);
  }

  get ratioForAll() {
    return this.data?.length / (this.fullData?.length ?? 0);
  }

  private _parent?: Ribbon;
  get parent() {
    return this._parent;
  }
  set parent(value: Ribbon | undefined) {
    this._parent = value;
    value?.children.push(this);
  }

  children: Ribbon[] = [];

  constructor(public path: RibbonPath, public data: Datum[], parent?: Ribbon) {
    this.parent = parent;
  }
}
