import * as fs from 'fs';
import { Logger } from '../logger';
import { MessageBus } from '../messages-bus/base';

import { ServiceSettings } from './service-settings';
import {
  implementsFeatPresence,
  implementsFeatSettings,
  implementsFeatStartStop,
} from './svc-flavors';

import { initLogger } from './init/logger';
import { initMessageBus } from './init/message-bus';

import { actionAlive } from './actions/alive';
import { actionInfo } from './actions/info';
import { actionReadSettings } from './actions/read-settings';
import { actionWriteSettings } from './actions/write-settings';
import { actionStart } from './actions/start';
import { actionStop } from './actions/stop';
import { actionPresence } from './actions/presence';

/** CONSTANTS */
const FILEPATH_RUN = './run';
const FILEPATH_SERVICESETTINGS = './serviceSettings.json';

export class Service {
  serviceName: string;

  logger: Logger;

  /**
   * "false" message bus to avoid TS compile error because of the late init.
   */
  messageBus: MessageBus = new MessageBus({}, () => {});

  features = { settings: false, startStop: false, presence: false };

  /* Flavors specific values */

  settings?: ServiceSettings;

  started: boolean = true;

  /**
   * DO NOT USE directly, use static "init" method instead.
   * @param serviceName
   * @param logger
   * @param messageBus
   */
  protected constructor(serviceName: string, logger: Logger) {
    this.serviceName = serviceName;
    this.logger = logger;
  }

  protected detectFeatures() {
    this.features.presence = implementsFeatPresence(this);
    this.features.settings = implementsFeatSettings(this);
    this.features.startStop = implementsFeatStartStop(this);

    if (this.features.settings) {
      this.settings = new ServiceSettings(FILEPATH_SERVICESETTINGS);
    }

    if (this.features.startStop) {
      this.started = false;
    }
  }

  /**
   * To be called to init your service.
   * Then you can do all your specific initialization and then call "ready" on the service.
   * @param serviceName
   * @param messageBusType
   */
  public static async init(serviceName: string, messageBusType: string) {
    // Init logging system.
    const logger = await initLogger(serviceName);
    logger.info(`----- Initializing service... ----------`);

    // Init service.
    const service = new this(serviceName, logger);

    // Check enabled features.
    // Done here to be sure that all implemented fields and methods are initialized.
    service.detectFeatures();
    logger.info(`Features : ${JSON.stringify(service.features)}`);

    // Init message bus.
    service.messageBus = await initMessageBus(
      messageBusType,
      service.messageBusHandler.bind(service)
    );

    return service;
  }

  public async ready(): Promise<void> {
    let messageBusTopics = ['srv.alive', 'srv.info'];

    if (this.features.presence) {
      messageBusTopics = [...messageBusTopics, 'srv.presence'];
    }

    if (this.features.startStop) {
      messageBusTopics = [
        ...messageBusTopics,
        `${this.serviceName}.start`,
        `${this.serviceName}.stop`,
      ];
    }

    if (this.features.settings) {
      messageBusTopics = [
        ...messageBusTopics,
        `${this.serviceName}.read-settings`,
        `${this.serviceName}.write-settings`,
      ];
    }

    await this.messageBus.attach(messageBusTopics);

    if (this.features.startStop) {
      if (fs.existsSync(FILEPATH_RUN)) {
        // @ts-ignore
        await this.start();
        this.started = true;
        this.logger.info(`Service started because of run file presence.`);
      }
    }

    await this.messageBus.send('srv.presence', {
      service: this.serviceName,
      presence: true,
      started: this.started,
    });

    this.logger.info(`----- Service is ready ----------`);
  }

  // ----- Message bus management -----
  protected messageBusHandler(
    topic: string,
    message: object,
    replyPath: any
  ): void {
    console.log(`Message bus : ${topic} : ${JSON.stringify(message)}`);

    const routes: { [topic: string]: () => void } = {};

    // --- Standard endpoints.
    routes['srv.alive'] = actionAlive.bind(this, replyPath);
    routes['srv.info'] = actionInfo.bind(this, replyPath);

    // --- Settings feature.
    if (this.features.settings) {
      routes[`${this.serviceName}.read-settings`] = actionReadSettings.bind(
        this,
        replyPath
      );

      routes[`${this.serviceName}.write-settings`] = actionWriteSettings.bind(
        this,
        message,
        replyPath
      );
    }

    // --- Start stop feature.
    if (this.features.startStop) {
      routes[`${this.serviceName}.start`] = actionStart.bind(
        this,
        FILEPATH_RUN,
        replyPath
      );

      routes[`${this.serviceName}.stop`] = actionStop.bind(
        this,
        FILEPATH_RUN,
        replyPath
      );
    }

    // --- Presence.
    if (this.features.presence) {
      routes['srv.presence'] = actionPresence.bind(this, message);
    }

    // Call the route function.
    if (routes[topic]) {
      routes[topic]();
    } else {
      // Not supposed to happens, as we only subscribe for what we expect.
      this.logger.warn(`Unknown topic [${topic}] message received.`);
    }
  }
}
