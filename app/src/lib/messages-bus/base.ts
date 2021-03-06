export interface MessageBusConfig {
  [k: string]: string | number;
}

export interface MessageReceiveCallback {
  (topic: string, message: object, replyPath: any): void;
}

export class MessageBus {
  protected messageReceiveCallback: MessageReceiveCallback;

  constructor(
    config: MessageBusConfig,
    messageReceiveCallback: MessageReceiveCallback
  ) {
    this.messageReceiveCallback = messageReceiveCallback;
  }

  // eslint-disable-next-line class-methods-use-this
  attach(subscriptions: string[]): Promise<void> {
    throw new Error('Not implemented [MessageBus:attach]');
  }

  // eslint-disable-next-line class-methods-use-this
  detach(): Promise<void> {
    throw new Error('Not implemented [MessageBus:detach]');
  }

  // eslint-disable-next-line class-methods-use-this
  send(
    topic: string,
    message: object,
    waitReplyFor: number | undefined = undefined
  ): Promise<void> {
    throw new Error('Not implemented [MessageBus:send]');
  }

  // eslint-disable-next-line class-methods-use-this
  reply(replyPath: any, message: object): Promise<void> {
    throw new Error('Not implemented [MessageBus:reply]');
  }
}
