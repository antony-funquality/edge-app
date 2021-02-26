import { Client, connect } from 'nats';
import { MessageBus, MessageBusConfig, MessageReceiveCallback } from '../base';

export class MessageBusNats extends MessageBus {
  private readonly url: string;

  private client?: Client;

  constructor(
    config: MessageBusConfig,
    messageReceiveCallback: MessageReceiveCallback
  ) {
    super(config, messageReceiveCallback);

    // TODO Validate config structure.
    this.url = <string>config.url;
  }

  async attach(subscriptions: string[]): Promise<void> {
    this.client = await connect({
      url: this.url,
      json: true,
      noEcho: true,
      reconnect: true,

      // maxReconnectAttempts: -1,
      // reconnectTimeWait: 1000,
    });

    this.client.on('connect', () => {
      // TODO Debug logging.
    });

    this.client.on('disconnect', () => {
      // TODO Debug logging.
    });

    this.client.on('reconnect', () => {
      // TODO Debug logging.
    });

    for (const topic of subscriptions) {
      const sub = this.client.subscribe(
        topic,
        (a: any, b: any, c: any, d: any, e: any) => {
          console.log(a, b, c);
          // this.messageReceiveCallback(msg.subject, msg.data, msg.reply);
        }
      );
    }
  }

  async detach(): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      await this.client.close();
    }
  }

  async send(
    topic: string,
    message: any,
    waitReply: number | undefined = undefined
  ): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      if (waitReply) {
        // TODO
      } else {
        this.client.publish(topic, message);
      }
    } else {
      throw new Error(`"attach" needs to be called before sending messages.`);
    }
  }

  async reply(replyPath: any, message: any): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      this.client.publish(replyPath, message);
    } else {
      throw new Error(`"attach" needs to be called before sending messages.`);
    }
  }
}
