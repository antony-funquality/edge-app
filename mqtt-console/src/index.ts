/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
import * as readline from 'readline';
import mqtt from 'mqtt';
import { getConfig } from './lib/config';

const shellPrefix = '> ';
let currentLine = '';

function shellMessage(message: string) {
  process.stdout.write(`\r${message}\n`);
  process.stdout.write(shellPrefix + currentLine);
}

function initShell(cmdCallback: {
  (cmd: string, topic: string, data: object): void;
}) {
  process.stdin.on('data', (chunk) => {
    if (chunk[0] === 3) {
      shellMessage('CTRL-C');
      process.exit(1);
    } else if (chunk[0] === 127) {
      currentLine = currentLine.substr(0, currentLine.length - 1);

      readline.clearLine(process.stdout, 0, () => {
        process.stdout.write(`\r${shellPrefix}${currentLine}`);
      });
    } else if (chunk[0] === 13) {
      const command = currentLine;
      currentLine = '';
      shellMessage(`command : ${command}`);

      try {
        const reRes = /^(\w+) (.+?) (.+)$/.exec(command);

        if (reRes && reRes.length >= 3) {
          const cmd = reRes[1];
          const topic = reRes[2];
          const data = JSON.parse(reRes[3]);

          if (['pub', 'req'].includes(cmd)) {
            cmdCallback(cmd, topic, data);
          } else {
            shellMessage(`error : unknown command`);
          }
        } else {
          shellMessage(`error : bad syntax`);
        }
      } catch (err) {
        shellMessage(`error : ${err.message}`);
      }
    } else {
      currentLine += chunk.toString();

      readline.clearLine(process.stdout, 0, () => {
        process.stdout.write(`\r${shellPrefix}${currentLine}`);
      });
    }
  });

  process.stdin.setRawMode(true);
}

async function main() {
  const mqttConfig = await getConfig('mqtt');

  let client = mqtt.connect(mqttConfig.url);
  client.on('connect', mqtt_connect);
  client.on('reconnect', mqtt_reconnect);
  client.on('error', mqtt_error);
  client.on('message', mqtt_messsageReceived);
  client.on('close', mqtt_close);

  function mqtt_connect() {
    shellMessage('MQTT : connect');
    client.subscribe('#', mqtt_subscribe);
  }

  function mqtt_subscribe(err?: Error) {
    if (err) {
      shellMessage(`MQTT : error : ${err.message}`);
      return;
    }

    shellMessage('MQTT : subscribed');
  }

  function mqtt_reconnect(err?: Error) {
    if (err) {
      shellMessage(`MQTT : error : ${err.message}`);
      return;
    }

    client = mqtt.connect(mqttConfig.url);
  }

  function mqtt_error(err: Error) {
    shellMessage(`MQTT : error : ${err.message}`);
  }

  function mqtt_messsageReceived(topic: string, message: object) {
    shellMessage(`message : ${topic} : ${JSON.stringify(message)}`);
  }

  function mqtt_close() {
    shellMessage('MQTT : close');
  }

  // ----- Shell.
  initShell((cmd: string, topic: string, data: object) => {
    if (cmd === 'pub') {
      client.publish(topic, JSON.stringify(data));
    } else if (cmd === 'req') {
      // TODO
      shellMessage('Not implemented');
    }
  });

  shellMessage('-----[ MQTT SHELL ]-----');
}

main().catch((err) => {
  console.error(`GENERAL FAILURE : ${err.stack}`);
});
