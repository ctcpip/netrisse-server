const express = require('express');
const helmet = require('helmet');
const WebSocket = require('ws');
const Player = require('./player');

const games = [];
const app = express();
const port = 4752;

let shuttingDown = false;

app.use(helmet());

const wsServer = new WebSocket.Server({ clientTracking: false, noServer: true });

const messageTypeEnum = Object.freeze({
  CONNECT: 0,
  DIRECTION: 1,
  HOLD: 2,
  JUNK: 3,
  PAUSE: 4,
  QUIT: 5,
  SEED: 6,
  UNPAUSE: 7,
});

const statusCodeEnum = Object.freeze({
  PLAYER_QUIT: 4333
});

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
      // some other problem...
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

// 1 spool per game, monotonically increasing game moves
// move has: move id, player id, move

(async() => {
  while (!shuttingDown) { // eslint-disable-line no-unmodified-loop-condition
    // pop the spoolz
    await pause(100); // eslint-disable-line no-await-in-loop
  }
})();

function shutdown() {

  shuttingDown = true;

  wsServer.close();
  server.close();

  for (const g of games) {
    for (const p of g.players) {
      p.socket.close();
    }
  }

}

/**
 * Pause thread for an amount of time
 * @param {number} ms milliseconds to pause
 * @returns {promise}
 * @instance
 * @example
 * await pause(1 * 1000); // pause for 1 second
*/
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function genericErrorHandler(e) {
  if (e) {
    console.error(e);
  }
}

function sendMessage(gameID, playerID, rawData) {

  const game = games.find(g => g.gameID === gameID);

  // send to clients other than the sender
  for (const p of game.players) {
    if (playerID !== p.playerID && p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(rawData, null, genericErrorHandler);
    }
  }

}

function handleMessage(socket, rawData) { // eslint-disable-line complexity

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

      socket.send(JSON.stringify({ type: messageTypeEnum.SEED, seed: game.seed }), null, genericErrorHandler);

      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i].playerID === message.playerID) {
          // remove existing player, this is a new connection
          game.players.splice(i, 1);
          break;
        }
      }

      game.players.push(new Player(message.playerID, socket));

      const playerIDs = game.players.map(p => p.playerID);

      for (const p of game.players) {
        p.socket.send(JSON.stringify({ type: messageTypeEnum.CONNECT, players: playerIDs }), null, genericErrorHandler);
      }

      break;
    }

    case messageTypeEnum.DIRECTION:
    case messageTypeEnum.HOLD:
    case messageTypeEnum.PAUSE:
    case messageTypeEnum.UNPAUSE:// eslint-disable-line padding-line-between-statements
    {
      sendMessage(message.gameID, message.playerID, rawData);
      break;
    }

    case messageTypeEnum.QUIT:
    {

      const game = games.find(g => g.gameID === message.gameID);

      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i].playerID === message.playerID) {
          // remove player
          game.players.splice(i, 1);
          break;
        }
      }

      // tell other players they left
      sendMessage(message.gameID, message.playerID, rawData);
      break;
    }

    default:
      throw new Error(`unsupported message type: ${message.type}`);
  }
}
