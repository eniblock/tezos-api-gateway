/**
 * Generate randomly an integer from the range of 0 to max
 *
 * @param {number} max   - the value that could not be generated equally or greater
 */
export function generateRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
