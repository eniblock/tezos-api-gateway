/**
 * @description             - Parse an object and replace a nested object with its immediate children
 *
 * @param   {Object} obj    - The object to parse
 * @param   {string} keys    - The keys to remove and replace
 * @return  {Object}
 */

export function deleteObjectSubLevel(obj: any, keys: string[]): any {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) continue;
    if (
      typeof obj[prop] === 'object' &&
      !Array.isArray(obj[prop]) &&
      obj[prop] !== null
    ) {
      obj[prop] = { ...deleteObjectSubLevel(obj[prop], keys) };
    }
    if (keys.includes(prop)) {
      obj = { ...obj[prop], ...obj };
      delete obj[prop];
    }
  }
  return obj;
}
