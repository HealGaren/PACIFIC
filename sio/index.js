/**
 * Created by Odoroki on 2015-10-18.
 */

var socketIO = require('socket.io');
var mongo = require('../mongo');

var session = require('../session');
var passport = require('../passport');

exports.init = function (server) {
    var io = socketIO(server);

    io.set('authorization', function (handshake, accept) {
        session(handshake, {}, function (err) {
            if (err) return accept(err);
            if (!handshake.session.passport) return accept(null, false);
            handshake.user = handshake.session.passport.user;
            accept(null, true);
        });
    });

    var sockets = {};

    io.on("connection", function (socket) {
        var mongoId = socket.request.user;

        sockets[mongoId] = socket;

        socket.on('location', function (longi, lati) {

            var sendPeople = [];

            mongo.User.updateLocation(mongoId, longi, lati).then(function (me) {
                sendPeople = sendPeople.concat(me.friends);
                return mongo.User.getGroupsIdArray(mongoId);
            }).then(function (ids) {
                return mongo.Group.getGroupsArray(ids);
            }).then(function (groups) {
                groups.forEach(function (group) {
                    sendPeople = sendPeople.concat(group.users);
                });
                sendPeople.forEach(function (id) {
                    if (sockets[id]) sockets[id].emit('update', {
                        longi: longi,
                        lati: lati,
                        userId: mongoId
                    });
                });
            });
        });

        socket.on('say', function (msg) {

            mongo.User.getFriendsIdArray(mongoId).then(function (ids) {
                ids.forEach(function (id) {
                    if (sockets[id]) sockets[id].emit('hear', {
                        userId: mongoId,
                        msg: msg
                    });
                });
            });
        });


        socket.on('say_group', function (msg, groupId) {
            mongo.Group.appendMessages(groupId, msg, mongoId).then(function(group){
                group.users.forEach(function (id) {
                    if (sockets[id] && id != mongoId) sockets[id].emit('hear_group', groupId, {
                        userId: mongoId,
                        msg: msg
                    });
                });
            });
        });

        socket.on('disconnect', function () {
            console.log('disconnect ok');
        });
    });

    return server;
};

exports.users = {};