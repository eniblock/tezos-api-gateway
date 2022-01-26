/**
 * @description             - Parse an object and replace a nested object with its immediate children
 *
 * @param   {Object} obj    - The object to parse
 * @param   {string} key    - The key to remove and replace
 * @return  {Object}
 */

export function deleteObjectSubLevel(obj: any, key: string): any {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) continue;
    if (
      typeof obj[prop] === 'object' &&
      !Array.isArray(obj[prop]) &&
      obj[prop] !== null
    ) {
      obj[prop] = { ...deleteObjectSubLevel(obj[prop], key) };
    }
    if (prop === key) {
      obj = { ...obj[prop], ...obj };
      delete obj[prop];
    }
  }
  return obj;
}
