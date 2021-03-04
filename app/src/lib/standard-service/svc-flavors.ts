// ----- Feature : start and stop
export interface SrvFeatStartStop {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function implementsFeatStartStop(srv: object) {
  return 'start' in srv && 'stop' in srv;
}

// ----- Feature : settings
export interface SrvFeatSettings {
  applyNewSettings(settingsValues: {
    [key: string]: number | string;
  }): Promise<void>;
}

export function implementsFeatSettings(srv: object) {
  return 'applyNewSettings' in srv;
}

// ----- Feature : presence
export interface SrvFeatPresence {
  presence(
    serviceName: string,
    presence: boolean,
    started: boolean
  ): Promise<void>;
}

export function implementsFeatPresence(srv: object) {
  return 'presence' in srv;
}
