import { Client, connect } from 'nats';
import { MessageBus, MessageBusConfig, MessageReceiveCallback } from '../base';
import { Logger } from '../../logger';

export class MessageBusNats extends MessageBus {
  private readonly url: string;

  private client?: Client;

  private logger: Logger;

  constructor(
    config: MessageBusConfig,
    messageReceiveCallback: MessageReceiveCallback
  ) {
    super(config, messageReceiveCallback);

    // TODO Validate config structure.
    this.url = <string>config.url;

    this.logger = new Logger('nats');
  }

  async attach(subscriptions: string[]): Promise<void> {
    this.client = connect({
      url: this.url,
      json: true,
      noEcho: true,
      reconnect: true,
      maxReconnectAttempts: -1,
    });

    this.client.on('connect', () => {
      this.logger.debug('connected');
    });

    this.client.on('disconnect', () => {
      this.logger.debug('disconnect');
    });

    this.client.on('reconnect', () => {
      this.logger.debug('reconnect');
    });

    for (const topic of subscriptions) {
      this.client.subscribe(
        topic,
        (message: object, replyPath: any, msgTopic: string) => {
          this.messageReceiveCallback(msgTopic, message, replyPath);
        }
      );
    }
  }

  async detach(): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
  }

  async send(
    topic: string,
    message: object,
    waitReplyFor: number | undefined = undefined
  ): Promise<void | any> {
    if (this.client) {
      if (waitReplyFor) {
        // TODO Test this part correctly.
        return new Promise((resolve, reject) => {
          // @ts-ignore
          this.client.request(
            topic,
            message,
            { timeout: waitReplyFor },
            (payload: any) => {
              if (payload instanceof Error) {
                reject(payload);
              } else {
                resolve(payload);
              }
            }
          );
        });
      }

      this.client.publish(topic, message);
      return Promise.resolve();
    }

    throw new Error(`"attach" needs to be called before sending messages.`);
  }

  async reply(replyPath: any, message: object): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      if (replyPath) {
        this.client.publish(replyPath, message);
      } else {
        // TODO Log error
      }
    } else {
      throw new Error(`"attach" needs to be called before sending messages.`);
    }
  }
}
