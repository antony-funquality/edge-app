export function actionPresence(this: any, message: any) {
  if (message.service && message.presence && message.started) {
    this.presence(message.service, message.presence, message.started);
  } else {
    this.logger.warn(
      `Ill formatted "presence" message [${JSON.stringify(message)}].`
    );
  }
}
