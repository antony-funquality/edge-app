import EventEmitter from 'events';
import fs from 'fs';
import { Logger } from '../logger';
import { initBackendConsole } from '../logger/backend/console';
import { getConfig } from '../config';
import { initBackendFluent } from '../logger/backend/fluent';
import messagesBuses from '../messages-bus';
import { MessageBus } from '../messages-bus/base';
import { loadJsonFile } from '../utils';

/** CONSTANTS */
const FILEPATH_RUN = './run';
const FILEPATH_SERVICESETTINGS = './serviceSettings.json';

export interface ServiceInfo {
  started: boolean;
}

export interface ServiceSettings {
  [key: string]: { value: any };
}

export interface DoneCallback {
  (done: boolean, error: Error | undefined): void;
}

export class StandardService extends EventEmitter {
  private readonly serviceName: string = '';

  private readonly endPoints: string[];

  private serviceInfo: ServiceInfo = { started: false };

  private messageBus: MessageBus = new MessageBus({}, () => {}); // To avoid TS errors.

  private logger: Logger;

  /**
   * DO NOT USE DIRECTLY
   * Use static "init" method instead.
   * @param serviceName
   * @param logger
   * @param endPoints
   */
  constructor(serviceName: string, logger: Logger, endPoints: string[]) {
    super();
    this.serviceName = serviceName;
    this.logger = logger;
    this.endPoints = endPoints;
  }

  static async init(serviceName: string, endPoints: string[]) {
    // Init minimal logger.
    Logger.addBackend(initBackendConsole());
    const logger = new Logger(serviceName);

    const module = new StandardService(serviceName, logger, endPoints);

    // Load all configurations.
    const messageBusType = 'nats';
    const fluentConfig = await getConfig('fluent');
    const messageBusConfig = await getConfig(messageBusType);

    // Enable fluent logging.
    Logger.addBackend(
      initBackendFluent(
        <string>fluentConfig.host,
        <number>fluentConfig.port,
        serviceName
      )
    );

    logger.info(`----- Service is starting... ----------`);

    module.messageBus = new messagesBuses[messageBusType](
      messageBusConfig,
      module.messageBusHandler.bind(module)
    );

    return module;
  }

  set started(val: boolean) {
    this.serviceInfo.started = val;
  }

  get started() {
    return this.serviceInfo.started;
  }

  async ready(): Promise<void> {
    await this.messageBus.attach([
      'srv.alive',
      'srv.info',
      ...this.endPoints.map((ep) => `${this.serviceName}.${ep}`),
    ]);

    await this.messageBus.send('srv.presence', {
      service: this.serviceName,
      presence: true,
    });

    this.logger.info(`----- Service is ready ----------`);
  }

  private getRawServiceSettings() {
    return loadJsonFile(FILEPATH_SERVICESETTINGS); // May throw error.
  }

  private extractSettingsValues(rawSettings: ServiceSettings) {
    return Object.fromEntries(
      Object.entries(rawSettings).map(([k, v]) => [k, v.value])
    );
  }

  private writeServiceSettingsValues(values: ServiceSettings) {
    const all: ServiceSettings = loadJsonFile(FILEPATH_SERVICESETTINGS); // May throw error.

    Object.entries(values).forEach(([k, v]) => {
      if (k in all) {
        all[k].value = v;
      }
    });

    fs.writeFileSync(FILEPATH_SERVICESETTINGS, JSON.stringify(all, null, 2));
  }

  public getServiceSettings() {
    const rawSettings: ServiceSettings = this.getRawServiceSettings(); // May throw error.
    return this.extractSettingsValues(rawSettings);
  }

  // ----- Messages routing.
  private messageBusHandler(topic: string, message: any, replyPath: any) {
    console.log(topic, message, replyPath);

    const topicParts = topic.split('.');
    const mainRoute = topicParts.shift();

    if (mainRoute === 'srv') {
      this.routingSrv(topicParts, message, replyPath);
    } else if (mainRoute === this.serviceName) {
      this.routingSelf(topicParts, message, replyPath);
    }
  }

  private routingSrv(topicParts: string[], message: any, replyPath: any) {
    const action = topicParts.shift();

    if (action === 'alive') {
      this.methodAlive(replyPath);
    } else if (action === 'info') {
      this.methodInfo(replyPath);
    }
  }

  private routingSelf(topicParts: string[], message: any, replyPath: any) {
    const action = topicParts.shift();

    if (action === 'start') {
      this.methodStart(replyPath);
    } else if (action === 'stop') {
      this.methodStop(replyPath);
    } else if (action === 'read-settings') {
      this.methodReadSettings(replyPath);
    } else if (action === 'write-settings') {
      this.methodWriteSettings(message, replyPath);
    } else {
      this.methodEndPoints(topicParts, message, replyPath);
    }
  }

  private methodAlive(replyPath: any) {
    this.messageBus.reply(replyPath, {
      service: this.serviceName,
      alive: true,
    });
  }

  private methodInfo(replyPath: any) {
    const packageJsonData = JSON.parse(
      fs.readFileSync('./package.json').toString()
    );

    const serviceInfo = {
      name: packageJsonData.name,
      alias: this.serviceName,
      version: packageJsonData.version,
      description: packageJsonData.description,
      settings: true,
      startStop: true,
      started: this.serviceInfo.started,
    };

    this.messageBus.reply(replyPath, {
      service: this.serviceName,
      info: serviceInfo,
    });
  }

  private methodStart(replyPath: any) {
    if (this.serviceInfo.started) {
      this.messageBus.reply(replyPath, {
        done: true,
      });
    } else {
      const replyCallback = (done: boolean, error: Error | undefined) => {
        (async () => {
          if (done) {
            await fs.promises.writeFile(FILEPATH_RUN, '');
          }

          await this.messageBus.reply(replyPath, {
            done,
            error,
          });
        })();
      };

      this.emit('start', replyCallback);
    }
  }

  private methodStop(replyPath: any) {
    if (!this.serviceInfo.started) {
      this.messageBus.reply(replyPath, {
        done: true,
      });
    } else {
      const replyCallback = (done: boolean, error: Error | undefined) => {
        (async () => {
          if (done) {
            await fs.promises.unlink(FILEPATH_RUN);
          }

          await this.messageBus.reply(replyPath, {
            done,
            error,
          });
        })();
      };

      this.emit('stop', replyCallback);
    }
  }

  private methodReadSettings(replyPath: any) {
    (async () => {
      try {
        const rawSettings = this.getRawServiceSettings();

        await this.messageBus.reply(replyPath, {
          done: true,
          error: undefined,
          settings: rawSettings,
        });
      } catch (err) {
        await this.messageBus.reply(replyPath, {
          done: false,
          error: err.message,
          settings: undefined,
        });
      }
    })();
  }

  private methodWriteSettings(message: any, replyPath: any) {
    const settingsValues = this.extractSettingsValues(message);

    const replyCallback = (done: boolean, error: Error | undefined) => {
      (async () => {
        if (done) {
          this.writeServiceSettingsValues(settingsValues);
        }

        await this.messageBus.reply(replyPath, {
          done,
          error,
        });
      })();
    };

    this.emit('new-settings', settingsValues, replyCallback);
  }

  private methodEndPoints(topicParts: string[], message: any, replyPath: any) {
    if (replyPath) {
      const replyCallback = (done: boolean, error: Error | undefined) => {
        (async () => {
          await this.messageBus.reply(replyPath, {
            done,
            error,
          });
        })();
      };

      this.emit(topicParts.join('.'), message, replyCallback);
    } else {
      this.emit(topicParts.join('.'), message);
    }
  }
}
