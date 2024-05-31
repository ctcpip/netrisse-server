const Player = require('../player');
const { messageTypeEnum } = require('../message-type-enum');
const { games } = require('../common');
const handleError = require('../handle-error');

module.exports = function({ socket, message }) {
  let game = games[message.gameID];

  if (!game) {
    game = { players: {}, seed: message.seed, heartbeat: Date.now() };
    games[message.gameID] = game;
  }

  socket.send(JSON.stringify({ type: messageTypeEnum.SEED, seed: game.seed }), null, handleError);

  // replace existing player if they exist; this is a new connection
  game.players[message.playerID] = new Player(message.playerID, socket);

  const playerIDs = Object.keys(game.players);

  for (const playerID of playerIDs) {
    game.players[playerID].socket.send(JSON.stringify({ type: messageTypeEnum.CONNECT, players: playerIDs }), null, handleError);
  }
};
