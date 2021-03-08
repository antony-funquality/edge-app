import fluent from 'fluent-logger';
import { LOG_LEVEL } from '../index';

/** CONSTANTS */
const FLUENT_MINLEVEL = LOG_LEVEL.INFO;
const levelStr = ['debug', 'info', 'warn', 'error'];

export function initBackendFluent(
  fluentHost: string,
  fluentPort: number,
  serviceName: string
) {
  fluent.configure(serviceName, {
    host: fluentHost,
    port: fluentPort,
    timeout: 3.0,
    reconnectInterval: 60 * 1000, // 1 minute
  });

  fluent.on('error', (err: Error) => {
    console.error(`logger-backend-fluent: error: ${err.message}`);
  });

  fluent.on('connect', () => {
    console.log(`logger-backend-fluent: connected`);
  });

  return (
    timestamp: Date,
    level: LOG_LEVEL,
    module: string,
    message: string
  ): void => {
    if (level < FLUENT_MINLEVEL) {
      return;
    }

    fluent.emit(`${module}.${levelStr[level]}`, { record: message }, timestamp);
  };
}
