import { MessageBusNats } from './connectors/nats';
import { MessageBusMqtt } from './connectors/mqtt';

interface BusTypes {
  [key: string]: any;
}

const messageBuses: BusTypes = {
  nats: MessageBusNats,
  mqtt: MessageBusMqtt,
};

export default messageBuses;
