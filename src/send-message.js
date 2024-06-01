const handleError = require('./handle-error');
const WebSocket = require('ws');
const { games } = require('./common');

module.exports = function(gameID, fromPlayerID, rawData) {
  const game = games[gameID];
  game.heartbeat = Date.now();

  const allPromises = [];

  for (const toPlayerID of Object.keys(game.players)) {
    // send to clients other than the sender
    if (fromPlayerID !== toPlayerID) {
      const p = game.players[toPlayerID];
      if (p.socket.readyState === WebSocket.OPEN) {
        allPromises.push(
          new Promise((resolve, reject) => {
            p.socket.send(rawData, err => {
              if (err) {
                handleError(err);
                return reject(err);
              }
              else {
                return resolve;
              }
            });
          }));
      }
    }
  }
  return Promise.allSettled(allPromises);
};
