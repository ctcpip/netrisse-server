const { games } = require('../common');
const sendMessage = require('../send-message');

module.exports = function({ rawData, message }) {
  const game = games[message.gameID];

  if (Object.keys(game.players).length === 1) {
    // last player is quitting, remove the game
    delete games[message.gameID];
  }
  else {
    // remove player from the game
    delete game.players[message.playerID];

    // tell other players they left
    sendMessage(message.gameID, message.playerID, rawData);
  }
};
