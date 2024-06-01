const express = require('express');
const helmet = require('helmet');
const WebSocket = require('ws');
const { Message, messageTypeEnum } = require('netrisse-lib');
const { games } = require('./common');
const handleError = require('./handle-error');
const sendMessage = require('./send-message');
const messageHandlers = require('./message-handlers/handlers');

const arrMessageTypes = Object.freeze(Object.values(messageTypeEnum));

const app = express();
const port = 4752;

app.use(helmet());

const wsServer = new WebSocket.Server({ clientTracking: false, noServer: true });

const statusCodeEnum = Object.freeze({ PLAYER_QUIT: 4333 });

// maybe the multiplayer games start out paused until someone unpauses it
// need to implement spools so that no messages are missed from clients who haven't connected yet

wsServer.on('connection', socket => {
  socket.on('message', rawData => {
    handleMessage(socket, rawData);
  });

  socket.on('close', (code, rawData) => {
    try {
      if (code === statusCodeEnum.PLAYER_QUIT) {
        handleMessage(socket, rawData);
      }
    }
    catch (error) {
      handleError(error);
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

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const purgeIntervalID = setInterval(function purgeStaleGames() {
  // every five minutes, remove stale games

  for (const gameID of Object.keys(games)) {
    const game = games[gameID];
    const diff = Date.now() - game.heartbeat;

    if (diff >= FIVE_MINUTES_MS) {
      // console.log(`deleting stale game ${gameID}`);

      // send game over
      // make sure we wait for it to complete sending, so we don't call socket.close() before the message can be received
      sendMessage(gameID, null, new Message(messageTypeEnum.GAME_OVER).serialize()).then(() => {
        for (const playerID of Object.keys(game.players)) {
          game.players[playerID].socket.close();
        }

        delete games[gameID];
      });
    }
  }
}, FIVE_MINUTES_MS);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  clearInterval(purgeIntervalID);
  wsServer.close();
  server.close();

  for (const g of Object.values(games)) {
    for (const p of Object.values(g.players)) {
      p.socket.close();
    }
  }
}

function handleMessage(socket, rawData) {
  const message = JSON.parse(rawData);

  // console.log(message);

  if (!arrMessageTypes.includes(message.type)) {
    throw new Error(`unsupported message type: ${message.type}`);
  }

  const handler = messageHandlers[message.type];

  // if we have a specific handler for the message type, then call it.
  // otherwise the default is just to pass the message along
  if (handler) {
    handler({ socket, rawData, message });
  }
  else {
    sendMessage(message.gameID, message.playerID, rawData);
  }
}
