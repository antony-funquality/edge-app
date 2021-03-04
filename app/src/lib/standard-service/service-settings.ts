import fs from 'fs';
import { loadJsonFile } from '../utils';

interface SettingsEntry {
  [key: string]: { value: number | string };
}

export class ServiceSettings {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private getRawServiceSettings() {
    return loadJsonFile(this.filePath); // May throw error.
  }

  public extractSettingsValues(rawSettings: ServiceSettings) {
    return Object.fromEntries(
      Object.entries(rawSettings).map(([k, v]) => [k, v.value])
    );
  }

  private writeServiceSettingsValues(values: ServiceSettings) {
    const all: SettingsEntry = loadJsonFile(this.filePath); // May throw error.

    Object.entries(values).forEach(([k, v]) => {
      if (k in all) {
        all[k].value = v;
      }
    });

    fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2));
  }

  public getServiceSettings() {
    const rawSettings: ServiceSettings = this.getRawServiceSettings(); // May throw error.
    return this.extractSettingsValues(rawSettings);
  }
}
