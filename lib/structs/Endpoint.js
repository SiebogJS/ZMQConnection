'use strict';

/**
 * Requirements
 * */
var zmq = require('zmq'),
    ip = require('ip'),
    q = require('q'),
    EndpointTypes = require('../enums/EndpointTypeEnum'),
    EndpointEvents = require('../enums/EndpointEventEnum'),
    ConnectionStates = require('../enums/ConnectionStateEnum'),
    util = require(__dirname + '/../util/util'),
    Connection = require(__dirname + '/Connection'),
    Binding = require(__dirname + '/Binding'),
    logger = require(__dirname + '/../util/logger');

/**
 * Header frame delimiter is used.
 * */
const headerDelimiter = '//%..hfd..%//';
var endpointCnt = 0;

/**
 * Exports
 * */
module.exports.create = function (type, address, addressAlias, topics) {

    var endpoint =  new Endpoint(type, address, addressAlias, topics);

    endpoint._createSocket();

    return endpoint;
};


/**
 * @constructor
 * @param {EndpointTypes} type.
 * @param {string} addressAlias address alias used for easier management of addresses.
 * @param {string} address host endpoint address.
 * @param {string[]} topics endpoint accepts messages with a given topics.
 * */
function Endpoint(type, address, addressAlias, topics){

    this.type = type;
    this.id = undefined;
    this._zmqSocket = undefined;
    this.alias =  addressAlias;
    this.address = address || ip.address();
    this.bindings = [];
    this.connectedTo = [];
    this.connections = [];
    this.topics = topics || [];
}

Endpoint.prototype.setType = function (connectionType) {
    this.type = connectionType;
};

Endpoint.prototype.getType = function () {
    return this.type;
};

Endpoint.prototype._setIdentity = function (id) {
    this._zmqSocket.identity = id;
    this.id = id;
};

Endpoint.prototype.getIdentity = function () {
    return this._zmqSocket.identity;
};

Endpoint.prototype.setAlias = function (alias) {
    this.alias = alias;
};

    Endpoint.prototype.getAlias = function () {
    return this.alias;
};

Endpoint.prototype.setAddress = function (address) {
    this.address = address;
};

Endpoint.prototype.getAddress = function () {
    return this.address;
};

Endpoint.prototype.getTopics = function () {
    return this.topics;
};

Endpoint.prototype.subscribe = function (topics) {

    if(Array.isArray(topics)){

        for(var i = 0; i < topics.length; i++){

            this.topics.push(topics[i]);
            this._zmqSocket.subscribe(topics[i]);
        }
    }else{
        this.topics.push(topics);
        this._zmqSocket.subscribe(topics);
    }
};

Endpoint.prototype.unsubscribe = function (topic) {

    for(var i = 0; i < this.topics.length; i++) {

        if(topic === this.topics[i]){

            this.topics.slice(i, 1);
            this._zmqSocket.unsubscribe(topic);
        }
    }
};

Endpoint.prototype.on = function (event, callback) {

    var self = this;
    var deferred;
    var cb;

    if (!callback || typeof callback !== 'function') {

        deferred = q.defer();
        cb = deferred.resolve;

    }else {
        cb = callback;
    }

    if(event === EndpointEvents.MESSAGE){

        self._zmqSocket.on(event, function () {

            var args = Array.apply(null, arguments);

            for(var i = 0; i < args.length; i++){

                if(args[i].toString() === headerDelimiter) {
                    args.splice(0, i + 1);
                    break;
                }
            }

            for(var i = 0; i < self.connectedTo.length; i++){

                if(args[0] === self.connectedTo[i].id){

                    self.connectedTo[i].incCount();
                    self.connectedTo[i].setHeartbeatFails(0);
                    self.connectedTo[i].setState(ConnectionStates.CONNECTED);
                }
            }

            cb.apply(null, [self].concat(args));
        });

    }else {

        self._zmqSocket.on(event, function(){

            var args = Array.apply(null, arguments);
            cb.apply(null, [self].concat(args));

        });
    }

    if(deferred)
        return deferred.promise;
};

Endpoint.prototype._monitor = function (interval, numOfEvents) {
    this._zmqSocket.monitor(interval, numOfEvents);
};

Endpoint.prototype._unmonitor = function () {
    this._zmqSocket.unmonitor();
};

Endpoint.prototype.send = function (msg, id, topic) {

    if(this.type === EndpointTypes.PULLER ||
        this.type === EndpointTypes.SUBSCRIBER) {

        throw Error("Can't send a message with endpoint type: " + this.type);
    }
    this._zmqSocket.send(prepareToSend(id, this._zmqSocket.identity, this.type, msg, topic));
};

Endpoint.prototype._close = function () {
    this._zmqSocket.close();
};

Endpoint.prototype._createSocket = function () {

    this._zmqSocket = zmq.socket(this.type);
    this._zmqSocket.identity = this._createIdentity(this.type, this.address, endpointCnt++);
    this.id  = this._zmqSocket.identity;

    for(var i = 0; i < this.topics.length; i++){
        this._zmqSocket.subscribe(this.topics[i]);
    }
};

/**
 * Async bind.
 * @param {NetworkProtocol} protocol (if not provided default is TCP).
 * @param {int} port.
 * @param {string} portAlias.
 * @param {Function} callback this function is called if error occurs.
 * @return {Promise} or undefined if callback is provided.
 * */
Endpoint.prototype.bind = function (protocol, port, portAlias, callback) {

    var self = this;
    protocol = protocol || 'tcp';
    var deferred;
    var cb;

    if (!callback || typeof callback !== 'function'){

        var deferred = q.defer();
        cb = deferred.resolve;
    }else {
        cb = callback;
    }

    if(!port){

        util.getRandPort(function (err, port) {

            if(!err) {
                return cb(err);
            }

            __bind__(protocol, self.address, port, portAlias);
        });

    }else{
        __bind__(protocol, self.address, port, portAlias);
    }
    
    
    function __bind__(protocol, address, port, portAlias) {

        self._zmqSocket.bind(protocol + '://'+ address + ':' + port, function (err) {

            if(err){
                return  cb(err);
            }

            self.bindings.push(Binding(protocol, port, portAlias));
            logger.info('Binding connection type: ' + self.type + ', to port: ' + port);
            cb(err);
        });
    }

    if(deferred) {
        return deferred.promise;
    }

};

/**
 * Sync bind.
 * @param {NetworkProtocol} protocol (if not provided default is TCP).
 * @throws {Error}
 * */
Endpoint.prototype.bindSync = function (protocol, port, portAlias) {

    var self = this;
    protocol = protocol || 'tcp';

    if (!port) {

        util.getRandPort(function (err, port) {

            if(!err) {

                self._zmqSocket.bindSync(protocol + '://'+ self.address+ ':' + port);
                logger.info('Binding connection type: ' + self.type + ', to port: ' + port);
                self.bindings.push(Binding(protocol, port, portAlias));

            } else
                throw Error(err);
        });

    }else {
        self._zmqSocket.bindSync(protocol + '://'+ self.address+ ':' + port);
        logger.info('Binding connection type: ' + self.type + ', to port: ' + port);
        self.bindings.push(Binding(protocol, port, portAlias));
    }
};


/**
 * Connects to address:port.
 * @param {NetworkProtocol} protocol (if not provided default is TCP).
 * @param {string} address IP address.
 * @param {int} port.
 * @throws{Error} if the address isn't valid.
 * */
Endpoint.prototype.connect = function (protocol, address, port, addressAlias, portAlias) {

    var self = this;

    protocol = protocol || 'tcp';
    
    self._zmqSocket.connect(protocol + '://' + address + ':' + port);
    self.connectedTo.push(Connection(protocol, address, addressAlias, port, portAlias));

};

Endpoint.disconnect = function (fullAddress, connObject) {

    var self = this;

    if(fullAddress){

        self._zmqSocket.disconnect(fullAddress);
        return;
    }

    if (connObject.address || connObject.alias){

        var address = connObject.address || connObject.alias;

        if (connObject.port || connObject.portAlias){

            var port = connObject.port || connObject.portAlias;

            for(var i = 0; i < self.connectedTo.length; i++){

                if((self.connectedTo[i].port == port || self.connectedTo[i].portAlias == port) &&
                    (self.connectedTo[i].address == address || self.connectedTo[i].alias == address)){

                    self._zmqSocket.disconnect(self.connectedTo[i].fullAddress);
                }
            }
        }
    }
};


Endpoint.prototype.getEndpointState = function () {

    return {
        id: this.id,
        type: this.type,
        alias: this.alias,
        address: this.address,
        topics: this.topics,
        bindings: this.bindings
    }
};

Endpoint.prototype.typeMap = {

    'pub': '0',
    'sub': '1',
    'push': '2',
    'pull': '3',
    'req': '4',
    'rep': '5',
    'dealer': '6',
    'router': '7'
};

Endpoint.prototype.invTypeMap = {

    '0': 'pub',
    '1': 'sub',
    '2': 'push',
    '3': 'pull',
    '4': 'dealer',
    '5': 'router',
    '6': 'req',
    '7': 'rep'
};

Endpoint.prototype._createIdentity = function (type, address, cnt) {

    return this.typeMap[type] + ':'+ address + ':' + cnt;
};

function prepareToSend(rcvId, sndId , type, msg, topic) {

    var arr = ['', headerDelimiter, sndId];

    if(Array.isArray(msg))
        arr = arr.concat(msg);
    else
        arr.push(msg);

    logger.info('sending...');

    if (type === EndpointTypes.ROUTER){
        return [rcvId].concat(arr);
    }

    if (type === EndpointTypes.PUBLISHER)
        return [topic].concat(arr);

    return arr;
}
