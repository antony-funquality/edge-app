import * as fs from 'fs';

export function actionStop(this: any, runFilePath: string, replyPath: any) {
  (async () => {
    try {
      if (this.started) {
        await this.stop();
        this.started = false;
        await fs.promises.unlink(runFilePath);
      }

      this.messageBus.reply(replyPath, { done: true, error: undefined });
    } catch (err) {
      this.messageBus.reply(replyPath, { done: false, error: err.message });
    }
  })();
}
