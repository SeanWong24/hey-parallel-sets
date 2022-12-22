export type Value = string | number;
export type Datum = { [dimension: string]: Value };
export type AxisConfigDict<T> = { [dimension: string]: T };
export type RatioRange = { start: number; end: number };
