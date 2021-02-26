export interface MessageBusConfig {
  [k: string]: string | number;
}

export interface MessageReceiveCallback {
  (topic: string, message: any, replyPath: any): void;
}

export class MessageBus {
  protected messageReceiveCallback: MessageReceiveCallback;

  constructor(
    config: MessageBusConfig,
    messageReceiveCallback: MessageReceiveCallback
  ) {
    this.messageReceiveCallback = messageReceiveCallback;
  }

  attach(subscriptions: string[]): Promise<void> {
    throw new Error('Not implemented [MessageBus:attach]');
  }

  detach(): Promise<void> {
    throw new Error('Not implemented [MessageBus:detach]');
  }

  send(topic: string, message: any): Promise<void> {
    throw new Error('Not implemented [MessageBus:send]');
  }

  reply(replyPath: any, message: any): Promise<void> {
    throw new Error('Not implemented [MessageBus:reply]');
  }
}
