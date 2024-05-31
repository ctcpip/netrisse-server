const handleError = require('./handle-error');
const WebSocket = require('ws');
const { games } = require('./common');

module.exports = function(gameID, playerID, rawData) {
  const game = games.find(g => g.gameID === gameID);

  // send to clients other than the sender
  for (const p of game.players) {
    if (playerID !== p.playerID && p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(rawData, null, handleError);
    }
  }
};
