'use strict';

/**
 * Enumeration of endpoint events.
 * @enum {string}
 */
module.exports = {

    CONNECTED: 'connect',
    CONNECT_DELAYED: 'connect_delay',
    CONNECT_RETRIED: 'connect_retry',
    LISTENING: 'listen',
    BIND_FAILED: 'bind_error',
    ACCEPTED: 'accept',
    ACCEPT_ERROR: 'accept_error',
    CLOSED: 'close',
    CLOSE_FAILED: 'close_error',
    DISCONNECTED: 'disconnect',
    MESSAGE: 'message'
};
