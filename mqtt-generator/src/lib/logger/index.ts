// ----- Log levels
export enum LOG_LEVEL {
  DEBUG = 0,
  INFO,
  WARN,
  ERROR,
}

export interface LoggerBackend {
  (timestamp: Date, level: LOG_LEVEL, module: string, message: string): void;
}

const logBackends: LoggerBackend[] = [];

function log(level: LOG_LEVEL, module: string, message: string) {
  const timestamp = new Date();
  logBackends.forEach((f) => f(timestamp, level, module, message));
}

export class Logger {
  private readonly module: string;

  constructor(module: string) {
    this.module = module;
  }

  debug(message: string): void {
    log(LOG_LEVEL.DEBUG, this.module, message);
  }

  info(message: string): void {
    log(LOG_LEVEL.INFO, this.module, message);
  }

  warn(message: string): void {
    log(LOG_LEVEL.WARN, this.module, message);
  }

  error(messageOrError: string | Error): void {
    if (messageOrError instanceof Error) {
      log(LOG_LEVEL.ERROR, this.module, messageOrError.message);
    } else {
      log(LOG_LEVEL.ERROR, this.module, messageOrError);
    }
  }

  static addBackend(backend: LoggerBackend) {
    logBackends.push(backend);
  }
}
