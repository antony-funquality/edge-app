import { Service } from './lib/standard-service';
import {
  SrvFeatPresence,
  SrvFeatSettings,
  SrvFeatStartStop,
} from './lib/standard-service/svc-flavors';
import { MessagesRouter } from './messages-router';

class MyService extends Service
  implements SrvFeatSettings, SrvFeatStartStop, SrvFeatPresence {
  applyNewSettings(): Promise<void> {
    return Promise.resolve(undefined);
  }

  start(): Promise<void> {
    return Promise.resolve(undefined);
  }

  stop(): Promise<void> {
    return Promise.resolve(undefined);
  }

  presence(
    serviceName: string,
    presence: boolean,
    started: boolean
  ): Promise<void> {
    console.log('presence', serviceName, { presence, started });
    return Promise.resolve(undefined);
  }

  superMethod() {
    console.log("I'm a super method");
  }

  async testNatsRequest() {
    await this.messageBus.send('test', {}, 2000);
  }
}

async function main() {
  const myService = <MyService>await MyService.init('edge-app', 'nats');

  myService.superMethod();

  await myService.ready();

  // await myService.testNatsRequest();

  // ----- Init messages router.
  // TODO Refactor with an array.
  // TODO Validate that there is no "doublons".
  const routerConfig = {
    sources: {
      src1: { busType: 'mqtt', topic: 'data' },
      src2: { busType: 'nats', topic: 'to-external' },
      dst1: { busType: 'nats', topic: 'mqtt-data' },
      dst2: { busType: 'mqtt', topic: 'data-from-app' },
      dst3: { busType: 'mqtt', topic: 'data-from-app-again' },
    },
    routes: ['src1->dst1', 'src2->dst2', 'src2->dst3'],
  };

  const messagesRouter = await MessagesRouter.init(routerConfig);
  await messagesRouter.start();
}

main().catch((err) => {
  console.error(`GENERAL FAILURE : ${err.stack}`);
});
