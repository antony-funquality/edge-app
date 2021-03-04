import path from 'path';
import * as fs from 'fs';

const DEFAULT_CONFIG_DIRPATH = './config/';

export interface GenericConfig {
  [k: string]: string | number;
}

export async function getConfig(group: string): Promise<GenericConfig> {
  // TODO Add env var to overrride base dir path.
  // TODO Error management

  const configFilePath = path.join(DEFAULT_CONFIG_DIRPATH, `${group}.json`);
  const configRawData = await fs.promises.readFile(configFilePath);
  const configObj = JSON.parse(configRawData.toString());

  // Merge env vars and default values from file.
  const matchingEnvVars = Object.fromEntries(
    Object.entries(process.env)
      .filter(([k]) => k.match(new RegExp(`^${group}_`, 'i')))
      .map(([k, v]) => [k.toLowerCase(), v])
  );

  for (const k of Object.keys(configObj)) {
    const envVarName = `${group}_${k}`;

    if (matchingEnvVars[envVarName]) {
      const envValue = <string>matchingEnvVars[envVarName];

      if (typeof configObj[k] === 'number') {
        configObj[k] = parseFloat(envValue); // Integer are just "special" floats.
      } else {
        configObj[k] = envValue;
      }
    }
  }

  return configObj;
}
