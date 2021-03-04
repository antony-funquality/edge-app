export function actionAlive(this: any, replyPath: any) {
  this.messageBus.reply(replyPath, {
    service: this.serviceName,
    alive: true,
  });
}
