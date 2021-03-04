export function actionWriteSettings(this: any, message: any, replyPath: any) {
  (async () => {
    try {
      const settingsValues = this.settings.extractSettingsValues(message);
      await this.applyNewSettings(settingsValues);
      this.settings.writeServiceSettingsValues(settingsValues);
      this.messageBus.reply(replyPath, { done: true, error: undefined });
    } catch (err) {
      this.messageBus.reply(replyPath, { done: false, error: err.message });
    }
  })();
}
