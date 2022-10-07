module.exports = class Player {

  eventSpool = [];

  constructor(playerID, socket) {
    this.playerID = playerID;
    this.socket = socket;
  }

};
