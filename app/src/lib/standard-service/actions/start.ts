import * as fs from 'fs';

export function actionStart(this: any, runFilePath: string, replyPath: any) {
  (async () => {
    try {
      if (!this.started) {
        await this.start();
        this.started = true;
        await fs.promises.writeFile(runFilePath, '');
      }

      this.messageBus.reply(replyPath, { done: true, error: undefined });
    } catch (err) {
      this.messageBus.reply(replyPath, { done: false, error: err.message });
    }
  })();
}
