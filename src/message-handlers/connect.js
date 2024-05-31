const Player = require('../player');
const { messageTypeEnum } = require('../message-type-enum');
const { games } = require('../common');
const handleError = require('../handle-error');

module.exports = function(socket, rawData, message) {
  let game = games.find(g => g.gameID === message.gameID);

  if (!game) {
    game = { gameID: message.gameID, players: [], seed: message.seed };
    games.push(game);
  }

  socket.send(JSON.stringify({ type: messageTypeEnum.SEED, seed: game.seed }), null, handleError);

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
    p.socket.send(JSON.stringify({ type: messageTypeEnum.CONNECT, players: playerIDs }), null, handleError);
  }
};
