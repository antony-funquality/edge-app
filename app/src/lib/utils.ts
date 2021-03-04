import fs from 'fs';

/**
 * Read JSON data file.
 * @param filePath
 * @throws If the data cannot be parsed from JSON.
 */
export function loadJsonFile(filePath: string): any {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);

    try {
      return JSON.parse(data.toString());
    } catch (err) {
      throw new Error(`Cannot parse JSON data in [${filePath}]`);
    }
  }

  return undefined;
}

/**
 * Check if a property exists on "obj" and set it as "value" if not.
 * @param obj The object will be updated.
 * @param prop
 * @param value
 */
export function addPropertyIfMissing(
  obj: any,
  prop: string | number,
  value: any
) {
  if (!(prop in obj)) {
    // eslint-disable-next-line no-param-reassign
    obj[prop] = value;
  }
}
