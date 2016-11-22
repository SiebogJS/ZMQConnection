
'use strict';


/**
 * Requirements
 * */
var util = require('util'),
    Endpoint = require('./Endpoint'),
    ConnectionStates = require('../enums/ConnectionStateEnum')
;

/**
 * Exports
 * */
module.exports= function connection(protocol, address, addressAlias, port, portAlias) {
    return new Connection(protocol, address, addressAlias, port, portAlias);
};

/**
 * @constructor
 * */
function Connection(protocol, address, addressAlias, port, portAlias){

    this.protocol = protocol;
    this.address = address;
    this.id = undefined;
    this.alias = addressAlias;
    this.port = port;
    this.portAlias = portAlias;
    this._state = ConnectionStates.IDLE;
    this._heartbeatFails = 0;
    this._count = 0;
    this.fullAddress = protocol + '://' + address + ':' + port;
}

Connection.prototype.setState = function (state) {
    this._state = state;
};

Connection.prototype.getState = function () {
    return this._state;
};

Connection.prototype.setHeartbeatFails = function (value) {
    this._heartbeatFails = value;
};

Connection.prototype.incHeartBeatFails = function () {
    this._heartbeatFails++;
};

Connection.prototype.getHeartBeatFails = function () {
    return this._heartbeatFails;
};

Connection.prototype.setCount = function (value) {
    this._count = value;
};

Connection.prototype.incCount = function () {
    this._count++;
};

Connection.prototype.getCount = function () {
    return this._count;
};
