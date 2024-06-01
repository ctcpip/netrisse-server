const { messageTypeEnum } = require('netrisse-lib');
const connect = require('./connect');
const quit = require('./quit');

const messageHandlers = {};
messageHandlers[messageTypeEnum.CONNECT] = connect;
messageHandlers[messageTypeEnum.QUIT] = quit;

module.exports = messageHandlers;
