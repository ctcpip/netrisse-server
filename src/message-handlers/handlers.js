const { messageTypeEnum } = require('../message-type-enum');
const connect = require('./connect');
const quit = require('./quit');

const messageHandlers = {};
messageHandlers[messageTypeEnum.CONNECT] = connect;
messageHandlers[messageTypeEnum.QUIT] = quit;

module.exports = messageHandlers;
