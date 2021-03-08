/* eslint-disable no-use-before-define */
import mqtt from 'mqtt';
import { getConfig } from './lib/config';

export async function getMqttClient(): Promise<mqtt.MqttClient> {
  const mqttConfig = await getConfig('mqtt');

  return new Promise((resolve) => {
    let client = mqtt.connect(mqttConfig.url);
    client.on('connect', mqttConnect);
    client.on('reconnect', mqttReconnect);
    client.on('error', mqttError);
    client.on('message', mqttMesssageReceived);
    client.on('close', mqttClose);

    function mqttConnect() {
      console.log('MQTT : connect');
      client.subscribe('#', mqttSubscribe);
    }

    function mqttSubscribe(err?: Error) {
      if (err) {
        console.log(`MQTT : error : ${err.message}`);
        return;
      }

      console.log('MQTT : subscribed');

      resolve(client);
    }

    function mqttReconnect(err?: Error) {
      if (err) {
        console.log(`MQTT : error : ${err.message}`);
        return;
      }

      client = mqtt.connect(mqttConfig.url);
    }

    function mqttError(err: Error) {
      console.log(`MQTT : error : ${err.message}`);
    }

    function mqttMesssageReceived(topic: string, message: object) {
      console.log(`message : ${topic} : ${JSON.stringify(message)}`);
    }

    function mqttClose() {
      console.log('MQTT : close');
    }
  });
}
