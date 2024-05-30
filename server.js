const express = require('express');
const helmet = require('helmet');
const WebSocket = require('ws');
const Player = require('./player');

const games = [];

const app = express();

const port = 4752;

app.use(helmet());

const wsServer = new WebSocket.Server({ clientTracking: false, noServer: true });

const messageTypeEnum = Object.freeze({
  CONNECT: 0,
  DIRECTION: 1,
  HOLD: 2,
  PAUSE: 3,
  QUIT: 4,
  SEED: 5,
});

// maybe the multiplayer games start out paused until someone unpauses it
// need to implement spools so that no messages are missed from clients who haven't connected yet

wsServer.on('connection', socket => {
  socket.on('message', rawData => {
    const message = JSON.parse(rawData);

    console.log(message);

    switch (message.type) {
      case messageTypeEnum.CONNECT:
      {
        let game = games.find(g => g.gameID === message.gameID);

        if (!game) {
          game = { gameID: message.gameID, players: [], seed: message.seed };
          games.push(game);
        }

        socket.send(JSON.stringify({ type: messageTypeEnum.SEED, seed: game.seed }));

        for (let i = 0; i < game.players.length; i++) {
          if (game.players[i].playerID === message.playerID) {
            // remove existing player, this is a new connection
            game.players.splice(i, 1);
            break;
          }
        }

        game.players.push(new Player(message.playerID, socket));

        break;
      }

      case messageTypeEnum.DIRECTION:
      case messageTypeEnum.HOLD:
      case messageTypeEnum.PAUSE:
      case messageTypeEnum.QUIT:

      {
        const game = games.find(g => g.gameID === message.gameID);

        // send to clients other than the sender
        for (const p of game.players) {
          if (message.playerID !== p.playerID && p.socket.readyState === WebSocket.OPEN) {
            p.socket.send(rawData);
          }
        }

        break;
      }

      default:
        throw new Error(`unsupported message type: ${message.type}`);
    }
  });
});

const server = app.listen(port, () => {
  if (process.send) { process.send('ready'); }

  console.log(`netrisse server is listening on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, websocket => {
    wsServer.emit('connection', websocket, request);
  });
});

process.on('SIGINT', shutdown);

process.on('SIGTERM', shutdown);

function shutdown() {
  wsServer.close();
  server.close();

  for (const g of games) {
    for (const p of g.players) {
      p.socket.close();
    }
  }
}
