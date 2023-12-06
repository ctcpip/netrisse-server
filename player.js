module.exports = class Player {

  lastEventReceived = 0;

  constructor(playerID, socket) {
    this.playerID = playerID;
    this.socket = socket;
  }

};
