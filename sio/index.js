/**
 * Created by Odoroki on 2015-10-18.
 */

var socketIO = require('socket.io');
var mongo = require('../mongo');

var session = require('../session');
var passport = require('../passport');

var Room = require('./room');
var sockets = require('./sockets');

var tempUsers = [];
var reconnect = {};

exports.init = function (server) {
    var io = socketIO(server);


    io.set('authorization', function (handshake, accept) {
        session(handshake, {}, function (err) {
            if (err) return accept(err);
            if (!handshake.session.passport) return accept(null, false);
            passport.deserializeUserFunc(handshake.session.passport.user, (err, user)=>{
                if(err) return accept(err);
                handshake.user = user;
                accept(null, true);
            });
        });
    });


    io.on("connection", function (socket) {
        var user = socket.request.user;
        var mongoId = user._id;
        sockets[mongoId] = socket;

        var sendUser = user.toObject();
        sendUser.friends.forEach((p)=>{
            p.isOnline = (sockets[p._id] != undefined);
        });

        socket.emit('init', {
            user: sendUser
        });

        socket.on('buy', (key, ack)=>{
            mongo.User.buy(mongoId, key)
                .then(user=>{
                    ack();
                });
        });

        socket.on('match', (ack)=>{
            tempUsers.push({user:user.toObject(), ack:ack});
            if (tempUsers.length >= 2) {
                var userAndAckA = tempUsers.pop();
                var userAndAckB = tempUsers.pop();
                var room = new Room(userAndAckA, userAndAckB);
                reconnect[userAndAckA.user._id] = room.reconnectA;
                reconnect[userAndAckB.user._id] = room.reconnectB;
            }
        });

        socket.on('vs', (id, ack)=>{
            mongo.User.findById(id).exec().then((other)=> {
                sockets[id].on('vs accept', (accept, ackOther)=> {
                    if (accept) {
                        var room = new Room(
                            {user: user.toObject(), ack: ack},
                            {user: other.toObject(), ack: ackOther}
                        );

                        reconnect[user._id] = room.reconnectA;
                        reconnect[other._id] = room.reconnectB;
                    }
                    else {

                    }
                    sockets[id].removeAllListeners('vs accept');
                });
                sockets[id].emit('vs', user.nickname);
            });
        });

        socket.on('connect again', (ack)=>{
            console.log('reconnect');
            if(reconnect[mongoId]) reconnect[mongoId](ack);
        });

        socket.on('disconnect', ()=>{
            console.log('disconnect');
            sockets[mongoId] = undefined;
        });

    });

    return server;
};