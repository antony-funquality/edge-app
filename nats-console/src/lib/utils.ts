import fs from 'fs';

export function loadJsonFile(filePath: string): any | undefined {
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
