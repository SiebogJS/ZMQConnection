'use strict';


var EventEmitter = require('events').EventEmitter,
    util = require('util');


/**
 * Creates an Console object.
 * Console object encapsulates node's console and
 * adds a layer over it for formatted printing.
 * @constructor
 * @this{Logger}
 * @extends {EventEmitter}
 * */
function Logger(){
    EventEmitter.call(this);
}

util.inherits(Logger, EventEmitter);


/**
 * Takes any number of parameters
 * */
Logger.prototype.log = function() {

    var msg = '[' + getDateTime() + ']: ' + parseArgs.apply(null, arguments);

    console.log(msg);
};

/**
 * Takes any number of parameters
 * */
Logger.prototype.info = function() {

    var msg = '[INFO]['+ getDateTime() +']: ' + parseArgs.apply(null, arguments);

    console.log(msg);
};

/**
 * Takes any number of parameters
 * */
Logger.prototype.warn = function() {

    var msg = '[WARN]['+ getDateTime() +']: ' + parseArgs.apply(null, arguments);

    console.log(msg);
};

/**
 * Takes any number of parameters
 * */
Logger.prototype.err = function() {

    var msg = '[Error]['+ getDateTime() +']: ' + parseArgs.apply(null, arguments);

    console.log(msg);
};

function parseArgs(){

    var args =  Array.prototype.slice.call(arguments);

    for(var i = 0; i < args.length; i++){

        if(typeof args[i] === 'object'){
            args[i] = JSON.stringify(args[i]);
        }
    }
    
    var argsString = args.join(' ');

    return argsString;
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return month + ":" + day + ":" + year + ":" + hour + ":" + min + ":" + sec;

}

/**
 * Exports
 * */
module.exports = (function() {
    return new Logger();
}());
