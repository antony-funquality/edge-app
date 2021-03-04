import { MqttClient, connect } from 'mqtt';
import { MessageBus, MessageBusConfig, MessageReceiveCallback } from '../base';

export class MessageBusMqtt extends MessageBus {
  private readonly url: string;

  private client?: MqttClient;

  constructor(
    config: MessageBusConfig,
    messageReceiveCallback: MessageReceiveCallback
  ) {
    super(config, messageReceiveCallback);

    // TODO Validate config structure.
    this.url = <string>config.url;
  }

  async attach(subscriptions: string[]): Promise<void> {
    function subscribeCallback(err?: Error) {
      if (err) {
        // TODO Debug logging
      } else {
        // TODO Debug logging
      }
    }

    this.client = connect(this.url);

    this.client.on('connect', () => {
      for (const topic of subscriptions) {
        // @ts-ignore : "this.client" could not be undefined if the event is fired.
        this.client.subscribe(topic, subscribeCallback);
      }
    });

    this.client.on('message', (msgTopic: string, message: object) => {
      if (Buffer.isBuffer(message)) {
        const objMessage = JSON.parse(message.toString());

        const replyPath = undefined;
        this.messageReceiveCallback(msgTopic, objMessage, replyPath);
      } else {
        // TODO but what?
      }
    });

    this.client.on('connect', () => {
      // TODO Debug logging
    });

    this.client.on('reconnect', () => {
      // TODO Debug logging
    });

    this.client.on('error', () => {
      // TODO Debug logging
    });

    this.client.on('close', () => {
      // TODO Debug logging
    });
  }

  detach(): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      return new Promise((resolve) => {
        // @ts-ignore
        this.client.end(undefined, undefined, () => {
          resolve();
        });

        this.client = undefined;
      });
    }

    return Promise.resolve();
  }

  async send(
    topic: string,
    message: object,
    waitReply: number | undefined = undefined
  ): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      if (waitReply) {
        // TODO
      } else {
        this.client.publish(topic, JSON.stringify(message));
      }
    } else {
      throw new Error(`"attach" needs to be called before sending messages.`);
    }
  }

  async reply(replyPath: any, message: object): Promise<void> {
    // async kept for standardization.

    if (this.client) {
      if (replyPath) {
        this.client.publish(replyPath, JSON.stringify(message));
      } else {
        // TODO Log error
      }
    } else {
      throw new Error(`"attach" needs to be called before sending messages.`);
    }
  }
}
