import { Logger } from '../../logger';
import { initBackendConsole } from '../../logger/backend/console';
import { getConfig } from '../../config';
import { initBackendFluent } from '../../logger/backend/fluent';

export async function initLogger(serviceName: string): Promise<Logger> {
  // Init minimal logger.
  Logger.addBackend(initBackendConsole());
  const newLogger = new Logger(serviceName);

  // Enable fluent logging.
  const fluentConfig = await getConfig('fluent');

  Logger.addBackend(
    initBackendFluent(
      <string>fluentConfig.host,
      <number>fluentConfig.port,
      serviceName
    )
  );

  return newLogger;
}
