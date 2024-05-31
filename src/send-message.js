const handleError = require('./handle-error');
const WebSocket = require('ws');
const { games } = require('./common');

module.exports = function(gameID, playerID, rawData) {
  const game = games[gameID];
  game.heartbeat = Date.now();

  for (const iPlayerID of Object.keys(game.players)) {
    const p = game.players[iPlayerID];

    // send to clients other than the sender
    if (playerID !== p.playerID && p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(rawData, null, handleError);
    }
  }
};
