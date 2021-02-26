import { getConfig } from './lib/config';
import { Logger } from './lib/logger';
import { initBackendConsole } from './lib/logger/backend/console';
import { initBackendFluent } from './lib/logger/backend/fluent';
import messagesBuses from './lib/messages-bus';

// Entry point of the application
async function main() {
  // Init minimal logger.
  Logger.addBackend(initBackendConsole());
  const logger = new Logger('index');

  // Load all configurations.
  const generalConfig = await getConfig('general');
  const fluentConfig = await getConfig('fluent');
  const natsConfig = await getConfig('nats');

  // Enable fluent logging.
  Logger.addBackend(
    initBackendFluent(
      <string>fluentConfig.host,
      <number>fluentConfig.port,
      <string>generalConfig.servicename
    )
  );

  logger.info(`----- Starting... -------`);

  const nats = new messagesBuses.nats(
    natsConfig,
    (topic, message, replyPath) => {
      console.log(topic, message, replyPath);
    }
  );

  await nats.attach(['srv.*']);
  await nats.send('srv.presence', { name: generalConfig.servicename });

  //
  // await nats.connect();
  // logger.info(`Nats link ready.`);
  //
  // // TODO Init logic.
  // logger.info(`Logic is ready.`);
  //
  // await router();
  // logger.info(`Accepting NATS request.`);
  //
  // logger.info(`----- All started -------`);
}

main().catch((err) => {
  console.error(`GENERAL FAILURE : ${err.stack}`);
});
