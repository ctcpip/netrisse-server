const { games } = require('../common');
const sendMessage = require('../send-message');

module.exports = function(socket, rawData, message) {
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
};
