import 'dotenv/config';
import path from 'path';
import express from './express';
import GameServer from './game-server';

const httpPort = +process.env.HTTP_PORT!;
const wsPort = +process.env.WS_PORT!;

const app = express();

app.use(express.static(path.resolve(__dirname, '../frontend')));

app.listen(httpPort, () => {
  console.log(`HTTP Server is listening on port ${httpPort}`);
});

const gameServer = new GameServer(wsPort, () => {
  console.log(`WebSocket server is listening on port ${wsPort}`);
});

process.on('SIGINT', async () => {
  await gameServer.close();
});
