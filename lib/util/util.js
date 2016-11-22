'use strict';

/**
 * Requirements
 * */
var net = require('net'),
    q = require('q');

module.exports.getRandPort = function (callback) {
    
    var server = net.createServer();
    server.unref();

    if (!callback || typeof callback !== 'function'){

        var deferred = q.defer();

        server.on('error', deferred.reject);

        server.listen(0, function () {
            var port = server.address().port;

            server.close(function () {
                deferred.resolve(port);
            });
        });

        return deferred.promise;
    }

    server.on('error', callback);

    server.listen(0, function () {
        var port = server.address().port;

        server.close(function () {
            callback(undefined, port);
        });
    });

};