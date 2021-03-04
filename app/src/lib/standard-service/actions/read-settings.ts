export function actionReadSettings(this: any, replyPath: any) {
  (async () => {
    try {
      const rawSettings = this.settings.getRawServiceSettings();

      await this.messageBus.reply(replyPath, {
        done: true,
        error: undefined,
        settings: rawSettings,
      });
    } catch (err) {
      await this.messageBus.reply(replyPath, {
        done: false,
        error: err.message,
        settings: undefined,
      });
    }
  })();
}
