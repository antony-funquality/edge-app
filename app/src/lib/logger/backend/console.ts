import { LOG_LEVEL } from '../index';

/** CONSTANTS */
const CONSOLE_MINLEVEL = LOG_LEVEL.DEBUG;
const levelStr = ['DEBUG', ' INFO', ' WARN', 'ERROR'];

export function initBackendConsole() {
  return (
    timestamp: Date,
    level: LOG_LEVEL,
    module: string,
    message: string
  ): void => {
    if (level < CONSOLE_MINLEVEL) {
      return;
    }

    let logFunc;

    if ([LOG_LEVEL.WARN, LOG_LEVEL.ERROR].includes(level)) {
      // eslint-disable-next-line no-console
      logFunc = console.error;
    } else {
      // eslint-disable-next-line no-console
      logFunc = console.log;
    }

    const timestampStr = timestamp.toISOString();
    const logLine = `${timestampStr}|${levelStr[level]}|${module}| ${message}`;

    logFunc(logLine);
  };
}
