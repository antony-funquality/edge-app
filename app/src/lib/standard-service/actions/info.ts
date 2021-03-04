import fs from 'fs';

export function actionInfo(this: any, replyPath: any) {
  const packageJsonData = JSON.parse(
    fs.readFileSync('./package.json').toString()
  );

  const serviceInfo = {
    name: packageJsonData.name,
    alias: this.serviceName,
    version: packageJsonData.version,
    description: packageJsonData.description,
    settings: this.features.settings,
    startStop: this.features.startStop,
    started: this.started,
  };

  this.messageBus
    .reply(replyPath, {
      service: this.serviceName,
      info: serviceInfo,
    })
    .catch(this.logger.error.bind(this.logger));
}
