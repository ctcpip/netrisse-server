const messageTypeEnum = Object.freeze({
  CONNECT: 0,
  DIRECTION: 1,
  HOLD: 2,
  JUNK: 3,
  PAUSE: 4,
  QUIT: 5,
  SEED: 6,
  UNPAUSE: 7,
});

const arrMessageTypes = Object.freeze(Object.values(messageTypeEnum));

module.exports = {
  arrMessageTypes,
  messageTypeEnum,
};
