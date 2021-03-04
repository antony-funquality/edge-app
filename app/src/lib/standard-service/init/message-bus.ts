import { MessageBus } from '../../messages-bus/base';
import messagesBuses from '../../messages-bus';
import { getConfig } from '../../config';

export async function initMessageBus(
  messageBusType: string,
  messagesHandler: (topic: string, message: object, replyPath: any) => void
): Promise<MessageBus> {
  if (messagesBuses[messageBusType]) {
    const messageBusConfig = await getConfig(messageBusType);

    const messageBus = new messagesBuses[messageBusType](
      messageBusConfig,
      messagesHandler
    );

    return messageBus;
  }
  throw new Error(
    `[Service:init] Unknown message bus type [${messageBusType}].`
  );
}
