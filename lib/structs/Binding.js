'use strict';

/**
 * Exports
 * */
module.exports = function (protocol, port, portAlias) {
    return new Binding(protocol, port, portAlias);
};


/**
 * @constructor
 * */
function Binding(protocol, port, portAlias){

    this.protocol = protocol;
    this.port = port;
    this.portAlias = portAlias;
    //this.fullAddress = protocol + '://' + address + ':' + port;
}

Binding.getPort = function () {
    return this.port;
};

Binding.setPort = function (port) {
    this.port = port;
};

Binding.getPortAlias = function () {
    return this.portAlias;
};

Binding.setPortAlias = function (portAlias) {
    this.portAlias = portAlias;
};



