/**
 * Convert the string to number
 *
 * @param {number} defaultValue    - the default value which will be returned when the value is undefined or not a number
 * @param {string} value           - the value that need to be converted
 *
 * @return {number} the convert value
 */
export function parseInt(defaultValue: number, value?: string) {
  if (!value) return defaultValue;

  const result = Number.parseInt(value, 10);

  return Number.isNaN(result) ? defaultValue : result;
}
