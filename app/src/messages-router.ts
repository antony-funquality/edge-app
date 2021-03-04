import { MessageBus } from './lib/messages-bus/base';
import messagesBuses from './lib/messages-bus';
import { getConfig } from './lib/config';
import { addPropertyIfMissing } from './lib/utils';

interface SourceDef {
  busType: string;
  topic: string;
}

interface MessagesRouterConfig {
  sources: { [name: string]: SourceDef };
  routes: string[];
}

interface MessageRoutingCallback {
  (srcName: string, message: any, replyPath: any): void;
}

class RoutableBus {
  bus?: MessageBus;

  /**
   * Incoming message routing.
   */
  topicToName: { [topic: string]: string } = {};

  /**
   * Outgoing message routing.
   */
  nameToTopic: { [name: string]: string } = {};

  messageCallback: MessageRoutingCallback = () => {};

  public static async init(
    busType: string,
    messageCallback: MessageRoutingCallback
  ): Promise<RoutableBus> {
    const newRoutableBus = new RoutableBus();

    if (busType in messagesBuses) {
      // @ts-ignore
      const BusClass = messagesBuses[busType];

      const busConfig = await getConfig(busType);
      newRoutableBus.bus = new BusClass(
        busConfig,
        newRoutableBus.routeIncomingMessage.bind(newRoutableBus)
      );

      newRoutableBus.messageCallback = messageCallback;
    } else {
      throw new Error('MessagesRouter : Unknown bus type');
    }

    return newRoutableBus;
  }

  public addIncomingRoute(topic: string, name: string) {
    this.topicToName[topic] = name;
  }

  public addOutgoingRoute(name: string, topic: string) {
    this.nameToTopic[name] = topic;
  }

  public async attach(): Promise<void> {
    if (this.bus) {
      await this.bus.attach(Object.keys(this.topicToName));
    }
  }

  private routeIncomingMessage(
    topic: string,
    message: any,
    replyPath: any
  ): void {
    const name = this.topicToName[topic];

    if (name) {
      this.messageCallback(name, message, replyPath);
    }
  }

  public async sendMessage(srcName: string, message: any, replyPath: any) {
    const topic = this.nameToTopic[srcName];

    if (this.bus && topic) {
      await this.bus.send(topic, message);
    } else {
      // TODO Error
    }
  }
}

function parseRouteString(routeStr: string): { src: string; dst: string } {
  const reRes = /^(?<s1>.+?)(?<dir>->|<-)(?<s2>.+)$/.exec(routeStr);
  let src;
  let dst;

  if (reRes && reRes.groups) {
    if (reRes.groups.dir === '->') {
      src = reRes.groups.s1;
      dst = reRes.groups.s2;
    } else if (reRes.groups.dir === '<-') {
      src = reRes.groups.s2;
      dst = reRes.groups.s1;
    } else {
      throw new Error(`Syntax error in route string [${routeStr}]`);
    }
  } else {
    throw new Error(`Syntax error in route string [${routeStr}]`);
  }

  return { src, dst };
}

export class MessagesRouter {
  private routableBusses: { [type: string]: RoutableBus } = {};

  private routes: { [srcName: string]: string[] } = {};

  private dstSendMessage: {
    [dstName: string]: (message: any, replyPath: any) => void;
  } = {};

  public static async init(
    config: MessagesRouterConfig
  ): Promise<MessagesRouter> {
    const newRouter = new MessagesRouter();

    // TODO List unused "sources".
    for (const routeStr of config.routes) {
      const { src, dst } = parseRouteString(routeStr);

      if (config.sources[src]) {
        const { busType, topic } = config.sources[src];

        await newRouter.initBusType(busType);
        newRouter.routableBusses[busType].addIncomingRoute(topic, src);
      } else {
        throw new Error(`Unknown source [${src}] for route [${routeStr}]`);
      }

      if (config.sources[dst]) {
        const { busType, topic } = config.sources[dst];

        await newRouter.initBusType(busType);
        const dstBus = newRouter.routableBusses[busType];

        dstBus.addOutgoingRoute(dst, topic);

        newRouter.dstSendMessage[dst] = dstBus.sendMessage.bind(dstBus, dst);
      } else {
        throw new Error(`Unknown source [${dst}] for route [${routeStr}]`);
      }

      addPropertyIfMissing(newRouter.routes, src, []);
      newRouter.routes[src].push(dst);
    }

    return newRouter;
  }

  private async initBusType(busType: string) {
    if (!this.routableBusses[busType]) {
      this.routableBusses[busType] = await RoutableBus.init(
        busType,
        this.routeMessage.bind(this)
      );
    }
  }

  public async start(): Promise<void> {
    const promises = Object.values(this.routableBusses).map((b) => b.attach());
    await Promise.all(promises);
  }

  private routeMessage(srcName: string, message: any, replyPath: any): void {
    console.log(`Incoming message : [${srcName}] : ${JSON.stringify(message)}`);

    const dsts = this.routes[srcName];

    if (dsts) {
      for (const dst of dsts) {
        console.log(`Routing message to [${dst}]`);
        this.dstSendMessage[dst](message, replyPath);
      }
    } else {
      console.log('Not routable message');
    }
  }
}
