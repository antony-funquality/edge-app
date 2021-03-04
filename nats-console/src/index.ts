import { connect } from 'nats';
import * as readline from 'readline';
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
  const natsConfig = await getConfig('nats');

  const natsClient = await connect({
    url: <string>natsConfig.url,
    json: true,
    noEcho: true,
    reconnect: true,
  });

  natsClient.on('connect', () => {
    shellMessage('NATS : connect');
  });

  natsClient.on('disconnect', () => {
    shellMessage('NATS : disconnect');
  });

  natsClient.on('reconnect', () => {
    shellMessage('NATS : reconnect');
  });

  natsClient.subscribe('>', (message: any, replyPath: any, topic: any) => {
    shellMessage(`message : ${topic} : ${JSON.stringify(message)}`);
  });

  // ----- Shell.
  initShell((cmd: string, topic: string, data: object) => {
    if (cmd === 'pub') {
      natsClient.publish(topic, data);
    } else if (cmd === 'req') {
      natsClient.request(topic, data, (msg: object) => {
        shellMessage(`reply : ${JSON.stringify(msg)}`);
      });
    }
  });

  shellMessage('-----[ NATS SHELL ]-----');
}

main().catch((err) => {
  console.error(`GENERAL FAILURE : ${err.stack}`);
});
