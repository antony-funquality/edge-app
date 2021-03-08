/* eslint-disable no-use-before-define */
import { getMqttClient } from './mqtt';

function* initGenerator() {
  let index = 0;

  while (true) {
    yield index;
    index += 1;
  }
}

async function main() {
  const generator = initGenerator()
  const client = await getMqttClient();

  setInterval(() => {
    client.publish('data', JSON.stringify({ i: generator.next().value }));
  }, 1000);
}

main().catch((err) => {
  console.error(`GENERAL FAILURE : ${err.stack}`);
});
