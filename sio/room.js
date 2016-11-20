/**
 * Created by 최예찬 on 2016-11-03.
 */

"use strict";

var sockets = require('./sockets');

var mongo = require('../mongo');


const RED = 0;
const BLUE = 1;

const 새우 = 10;
const 꽃게 = 11;
const 복어 = 12;
const 문어 = 13;
const 범고래 = 14;
const 해파리 = 15;
const 가재 = 16;

const 노말 = 20;
const 해변 = 21;
const 소용돌이 = 22;

const EVENT_MOVE = 30;
const EVENT_ATTACK = 31;
const EVENT_SWOP = 32;
const EVENT_REBIRTH = 33;


var ON_MORE = 40;
var ON_REBIRTH = 41;


class Player {

    constructor(user, color) {
        this.user = user;
        this.id = user._id;
        this.color = color;
    }

    get socket() {
        return sockets[this.id];
    }
}

class Room {
    constructor(userAndAckA, userAndAckB) {
        this.players = [
            new Player(userAndAckA.user, BLUE),
            new Player(userAndAckB.user, RED)
        ];
        this.initGame();

        userAndAckA.ack();
        userAndAckB.ack();

        this.reconnectA = (ack)=> {
            this.reconnect(this.players[0], this.players[1], ack);
        };

        this.reconnectB = (ack)=> {
            this.reconnect(this.players[1], this.players[0], ack);
        };

        this.readyCount = 0;
    }

    reconnect(player, other, ack) {
        ack({
            player: player,
            other: other,
            unitArray: this.unitArray,
            mapArray: this.mapArray
        });

        this.readyCount++;
        if (this.readyCount >= 2) {
            this.players.forEach(p=> {
                this.bindGameToSocket(p);
            });
            this.startTurn();
        }
    }

    initGame() {
        this.unitArray = [
            [[꽃게, RED], [복어, RED], [문어, RED], [범고래, RED], [문어, RED], [해파리, RED], [가재, RED]],
            [[새우, RED], [새우, RED], [새우, RED], [새우, RED], [새우, RED], [새우, RED], [새우, RED]],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [[새우, BLUE], [새우, BLUE], [새우, BLUE], [새우, BLUE], [새우, BLUE], [새우, BLUE], [새우, BLUE]],
            [[꽃게, BLUE], [복어, BLUE], [문어, BLUE], [범고래, BLUE], [문어, BLUE], [해파리, BLUE], [가재, BLUE]]
        ];
        this.mapArray = [
            [해변, 노말, 노말, 노말, 노말, 노말, 해변],
            [해변, 노말, 노말, 노말, 노말, 노말, 해변],
            [해변, 노말, 노말, 노말, 노말, 노말, 해변],
            [해변, 노말, 노말, 노말, 소용돌이, 노말, 해변],
            [해변, 노말, 노말, 노말, 노말, 노말, 해변],
            [해변, 노말, 노말, 노말, 노말, 노말, 해변],
            [해변, 노말, 노말, 노말, 노말, 노말, 해변]
        ];

        this.randomList = [];
        for (var x = 0; x < 7; x++) {
            for (var y = 0; y < 7; y++) {
                if (this.mapArray[y][x] == 소용돌이) continue;
                this.randomList.push({x: x, y: y});
            }
        }

        this.turn = 0;

        this.onlyMove = null;
        this.rebirthPos = null;
    }


    startTurn() {
        this.turn = 1;
        this.players.forEach(p=> {
            console.log('start');
            p.socket.emit('turn start', this.turn % 2 == p.color);
        });
    }

    nextTurn(data) {
        console.log(this.turn)
        if (this.turn >= 30 && (this.turn - 30) % 3 == 0) {
            data.block = this.makeBlock();
        }
        if (this.onlyMove != null) this.onlyMove = null;
        if (this.rebirthPos != null) {
            console.log('rebirth pos delete.');
            this.rebirthPos = null;
        }
        this.turn++;
        data.turn = this.turn;
        this.checkEnd(data, ()=> {
            this.players.forEach(p=> {
                p.socket.emit('turn', data, this.turn % 2 == p.color);
            });
        });

    }

    moreTurn(data) {
        this.onlyMove = data.to;
        data.extra = ON_MORE;

        data.turn = this.turn;
        this.checkEnd(data, ()=> {
            this.players.forEach(p=> {
                p.socket.emit('turn', data, this.turn % 2 == p.color);
            });
        });
    }

    rebirthTurn(data) {
        console.log('rebirth pos save.');
        this.rebirthPos = data.to;
        data.extra = ON_REBIRTH;

        data.turn = this.turn;
        this.checkEnd(data, ()=> {
            this.players.forEach(p=> {
                p.socket.emit('turn', data, this.turn % 2 == p.color);
            });
        });
    }

    checkEnd(data, func) {

        if (data.gameEnd) {
            this.players.forEach(p=> {
                p.socket.removeAllListeners();
                var isWin = false;
                var money = -10;
                if ((this.turn - 1) % 2 == p.color) {
                    isWin = true;
                    money = 10;
                }
                mongo.User.addWinOrLose(p.id, isWin)
                    .then(user=> {
                        return mongo.User.addMoney(p.id, money);
                    })
                    .then(user=> {
                        func();
                    });
            });
        }
        else func();

    }

    bindGameToSocket(player) {

        player.socket.on('message', (type)=>{
            this.players.forEach(p=> {
                p.socket.emit('message', type, player.color);
            });
        });

        player.socket.on('move', (from, to)=> {
            if (this.turn % 2 != player.color) {
                console.log('not your turn');
                return;
            }
            if (this.onlyMove != null) {
                if (this.onlyMove.x != from.x || this.onlyMove.y != from.y) {
                    console.log('onlymode');
                    return;
                }
            }

            var emitObj = {from: from, to: to, event: EVENT_MOVE};
            var fromUnit = this.unitArray[from.y][from.x];
            var toUnit = this.unitArray[to.y][to.x];
            var toMap = this.mapArray[to.y][to.x];

            if (fromUnit == null) {
                console.log(from);
                console.log(this.unitArray);
                console.log('null fromunit');
                return;
            }
            if (fromUnit[1] != player.color) {
                console.log('fromunit not yours');
                return;
            }
            if (!this.checkUnitMove(fromUnit, from, to)) {
                console.log('cant move');
                return;
            }
            if (toMap == 소용돌이) {
                console.log('소용돌이');
                return;
            }
            else if (toUnit != null) {
                if (toUnit[1] == player.color) {
                    if (fromUnit[0] == 범고래 && toUnit[0] == 해파리) {
                        this.unitArray[to.y][to.x] = fromUnit;
                        this.unitArray[from.y][from.x] = toUnit;
                        emitObj.event = EVENT_SWOP;
                    }
                    else {
                        console.log('same color attack');
                        return;
                    }
                }
                else {
                    emitObj.event = EVENT_ATTACK;

                    if (toUnit[0] == 범고래) {
                        emitObj.gameEnd = true;
                    }
                }
            }

            if (emitObj.event != EVENT_SWOP) {
                this.unitArray[to.y][to.x] = fromUnit;
                this.unitArray[from.y][from.x] = null;
            }

            if ((fromUnit[0] == 가재 || fromUnit[0] == 꽃게 && this.onlyMove == null) && toMap == 해변) {
                this.moreTurn(emitObj);
            }

            else if (fromUnit[0] == 새우 && (to.y == 0 || to.y == 6)) {
                this.rebirthTurn(emitObj);
            }

            else {
                this.nextTurn(emitObj);
            }

        });

        player.socket.on('rebirth', (type)=> {
            if (this.turn % 2 != player.color) {
                console.log('not your turn');
                return;
            }
            if (type != 꽃게 && type != 가재) return;
            this.unitArray[this.rebirthPos.y][this.rebirthPos.x][0] = type;
            this.nextTurn({from: this.rebirthPos, to: null, event: EVENT_REBIRTH, type: type});
        })
    }

    makeBlock() {
        var randomIndex = Math.floor(Math.random() * this.randomList.length);
        while (true) {
            var pos = this.randomList[randomIndex];
            if (this.unitArray[pos.y][pos.x] == null) break;
            randomIndex = Math.floor(Math.random() * this.randomList.length);
        }

        var blockPos = this.randomList.splice(randomIndex, 1)[0];
        this.mapArray[blockPos.y][blockPos.x] = 소용돌이;

        console.log(blockPos);

        return blockPos;
    }


    checkUnitMove(unit, from, to) {

        var dx = Math.abs(from.x - to.x);
        var dy = Math.abs(from.y - to.y);
        if (dx == 0 && dy == 0) return false;

        switch (unit[0]) {
            case 새우:
                if (this.unitArray[to.y][to.x] == null) {
                    if (from.x != to.x) return false;

                    var first = (unit[1] == RED && from.y == 1) || (unit[1] == BLUE && from.y == 5);
                    var deltaY = to.y - from.y;
                    if (unit[1] != RED) deltaY *= -1;

                    if (deltaY == 1) return true;
                    if (first) {
                        if (deltaY == 2 && this.unitArray[(to.y + from.y) / 2][from.x] == null) return true;
                    }

                    return false;
                }
                else {
                    if(from.x + 1 != to.x && from.x - 1 != to.x) return false;
                    var deltaY = to.y - from.y;
                    if (unit[1] != RED) deltaY *= -1;

                    if (deltaY == 1) return true;

                    return false;
                }
                break;


            case 꽃게:

                if (from.x == to.x) {
                    if (dy == 1) return true;
                }
                if (from.y == to.y) {
                    if (dx == 1) return true;
                }
                if (this.mapArray[from.y][from.x] == 해변) {
                    var i;
                    if (from.y == to.y) {
                        for (i = from.x + (from.x < to.x ? 1 : -1); i != to.x; i < to.x ? i++ : i--) {
                            if (this.unitArray[from.y][i] != null) return false;
                        }
                        return true;
                    }
                }
                return false;

                break;

            case 복어:
                if (dx == 1 && dy == 2 || dx == 2 && dy == 1) return true;
                return false;

                break;

            case 문어:

                if (this.unitArray[to.y][to.x] == null) {
                    if (dx == 0) {
                        if (dy == 1) return true;
                        if (dy == 2 && this.unitArray[(to.y + from.y) / 2][from.x] == null) return true;
                    }
                    if (dy == 0 || dy == dx) {
                        if (dx == 1) return true;
                        if (dx == 2 && this.unitArray[from.y][(to.x + from.x) / 2] == null) return true;
                    }
                }
                else {
                    if (dx == 0) {
                        if (dy == 1) return true;
                        if (dy == 3) {
                            for (i = from.y + (from.y < to.y ? 1 : -1); i != to.y; i < to.y ? i++ : i--) {
                                if (this.unitArray[i][from.x] != null) return false;
                            }
                            return true;
                        }
                    }
                    if (dy == 0) {
                        if (dx == 1) return true;
                        if (dx == 3) {
                            for (i = from.x + (from.x < to.x ? 1 : -1); i != to.x; i < to.x ? i++ : i--) {
                                if (this.unitArray[from.y][i] != null) return false;
                            }
                            return true;
                        }
                    }
                    if (dy == dx) {
                        if (dx == 1) return true;
                        if (dx == 3) {
                            var xi = from.x + (from.x < to.x ? 1 : -1);
                            var yi = from.y + (from.y < to.y ? 1 : -1);
                            while (xi != to.x && yi != to.y) {
                                if (this.unitArray[yi][xi] != null) return false;
                                xi < to.x ? xi++ : xi--;
                                yi < to.y ? yi++ : yi--;
                            }
                            return true;
                        }
                    }
                }
                return false;
                break;

            case 범고래:

                if (dx == 0) {
                    if (dy == 1) return true;
                }
                if (dy == 0 || dy == dx) {
                    if (dx == 1) return true;
                }
                break;
            case 해파리:

                if (dx == dy) {
                    var xi = from.x + (from.x < to.x ? 1 : -1);
                    var yi = from.y + (from.y < to.y ? 1 : -1);
                    while (xi != to.x && yi != to.y) {
                        if (this.unitArray[yi][xi] != null) return false;
                        xi < to.x ? xi++ : xi--;
                        yi < to.y ? yi++ : yi--;
                    }
                    return true;
                }
                break;

            case 가재:

                if (from.x == to.x) {
                    if (dy == 1) return true;
                }
                if (from.y == to.y) {
                    if (dx == 1) return true;
                }
                if (this.mapArray[from.y][from.x] == 해변) {
                    var i;
                    if (from.x == to.x) {
                        for (i = from.y + (from.y < to.y ? 1 : -1); i != to.y; i < to.y ? i++ : i--) {
                            if (this.unitArray[i][from.x] != null) return false;
                        }
                        return true;
                    }
                    if (dx == dy) {
                        var xi = from.x + (from.x < to.x ? 1 : -1);
                        var yi = from.y + (from.y < to.y ? 1 : -1);
                        while (xi != to.x && yi != to.y) {
                            if (this.unitArray[yi][xi] != null) return false;
                            xi < to.x ? xi++ : xi--;
                            yi < to.y ? yi++ : yi--;
                        }
                        return true;
                    }
                }
                return false;
                break;
        }
    }


}

module.exports = Room;