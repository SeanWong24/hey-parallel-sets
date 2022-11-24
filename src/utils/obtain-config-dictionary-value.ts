export function obtainConfigDictionaryValue<T>(dimension: string, dictionary?: { [dimension: string]: T }) {
  return dictionary?.[dimension] ?? dictionary?.[''];
}
