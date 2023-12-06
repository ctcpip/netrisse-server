module.exports = class Player {

  events = [];
  players = [];
  #latestEventID = 0;

  constructor(gameID, seed) {
    this.gameID = gameID;
    this.seed = seed;
  }

  get latestEventID() {
    return this.#latestEventID;
  }

  set latestEventID(value) {

    if (value <= this.#latestEventID) {
      throw new Error(`can't reuse event ID ${value}!  somehow got a race condition... must implement mutex`);
    }

    this.#latestEventID = value;
  }

};
