/**
 * Created by 최예찬 on 2016-11-03.
 */

var RED = 0;
var BLUE = 1;

var 새우 = 10;
var 꽃게 = 11;
var 복어 = 12;
var 문어 = 13;
var 범고래 = 14;
var 해파리 = 15;
var 가재 = 16;

var 노말 = 20;
var 해변 = 21;
var 소용돌이 = 22;

var EVENT_MOVE = 30;
var EVENT_ATTACK = 31;
var EVENT_SWOP = 32;
var EVENT_REBIRTH = 33;


var ON_MORE = 40;
var ON_REBIRTH = 41;

var unitImagePrefix = "/images/game/unit/";
var unitImageArr = [];
unitImageArr[새우] = 'shrimp';
unitImageArr[꽃게] = 'crap';
unitImageArr[복어] = 'fugu';
unitImageArr[문어] = 'octopus';
unitImageArr[범고래] = 'whale';
unitImageArr[해파리] = 'jellyfish';
unitImageArr[가재] = 'crawfish';


var unitSize = [];
unitSize[새우] = [90, 132];
unitSize[꽃게] = [112, 105];
unitSize[복어] = [110, 100];
unitSize[문어] = [104, 170];
unitSize[범고래] = [170, 214];
unitSize[해파리] = [114, 137];
unitSize[가재] = [96, 150];


$(window).ready(()=> {
    //noinspection all

    var color;
    var unitArray;
    var mapArray;

    var socket;
    setTimeout(function () {
        $('#left-menu').addClass('animated fadeInLeft').show();
        setTimeout(function () {
            $('#right-menu').addClass('animated fadeInRight').show();
        }, 500);
        setTimeout(function () {
            $('#content-wrap').addClass('animated fadeIn').show();
        }, 500);
        setTimeout(function () {
            socket = io.connect();
            socket.on('connect', onSocketConnect);
        }, 500);

    }, 1000);


    var money;
    var currentMine;

    var $cell;

    var isMyMessageShow = false;


    function onSocketConnect() {
        socket.emit('connect again', function (info) {
            if (info.player.user.facebookExist) {
                $('#player-image').css('background', `url('http://graph.facebook.com/${info.player.user.facebookID}/picture?type=normal')`);
            }
            $('#player-name').text(info.player.user.nickname);

            $('#win-number').text(info.player.user.win);
            $('#lose-number').text(info.player.user.lose);
            var winLose = (info.player.user.win / (info.player.user.win + info.player.user.lose)) * 100;
            if (isNaN(winLose)) winLose = 0;
            $('#win-percent').text(Math.round(winLose) + '%');

            if (info.other.user.facebookExist) {
                $('#other-player-image').css('background', `url('http://graph.facebook.com/${info.other.user.facebookID}/picture?type=normal')`);
            }
            $('#other-player-name').text(info.other.user.nickname);
            $('#other-win-number').text(info.other.user.win);
            $('#other-lose-number').text(info.other.user.lose);
            var otherWinLose = (info.other.user.win / (info.other.user.win + info.other.user.lose)) * 100;
            if (isNaN(otherWinLose)) otherWinLose = 0;
            $('#other-win-percent').text(Math.round(otherWinLose) + '%');

            money = info.player.user.money;


            color = info.player.color;

            unitArray = info.unitArray;
            mapArray = info.mapArray;

            startFadeOut();

            if (color == RED) reverseCell();


            makeMap();

            $cell = $('.cell');

            socket.on('turn start', onGameStart);
            socket.on('turn', onTurn);
            socket.on('message', onMessage);


            if(info.player.user.isHaveDead) {
                $('#dead-icon').click(function () {
                    if (!isMyMessageShow) socket.emit('message', 'dead');
                });
            }
            else {
                $('#dead-icon').addClass('non-bought');
            }
            if(info.player.user.isHaveSmile) {
                $('#smile-icon').click(function () {
                    if (!isMyMessageShow) socket.emit('message', 'smile');
                });
            }

            else {
                $('#smile-icon').addClass('non-bought');
            }
            if(info.player.user.isHaveAngry) {
                $('#angry-icon').click(function () {
                    if (!isMyMessageShow) socket.emit('message', 'angry');
                });
            }

            else {
                $('#angry-icon').addClass('non-bought');
            }
        });
    }


    function onMessage(message, hiscolor) {
        var $card = $(color == hiscolor ? '#card' : '#other-card');

        if (color == hiscolor) isMyMessageShow = true;
        $card.css('background', `url('../../images/card/${message}.png')`).css('background-size', 'cover').fadeIn(500, function () {
            setTimeout(function () {
                $card.fadeOut(500, function () {
                    if (color == hiscolor) isMyMessageShow = false;
                });
            }, 2000);
        })


    }

    function startFadeOut() {

    }

    function onGameStart(isMine) {
        currentMine = isMine;
        showText(`게임이 시작되었습니다! ${isMine ? "당신" : "상대방"}의 차례입니다.`);
        bindUnitSelect();
    }

    var isOnlyUnit;
    var onlyUnit = null;

    function bindUnitSelect() {
        $cell.off('click');
        $cell.on('click', function () {
            if (!currentMine) {
                showText("상대방의 턴입니다.");
                return;
            }
            var $this = $(this);
            var $mine = $this.find('.mine');
            if ($mine.length == 0) {
                showText("상대방의 유닛입니다.");
                return;

            }
            else bindTargetSelect($this.data('x'), $this.data('y'));
        });
    }

    function bindOnlyUnitSelect(x, y) {
        $cell.off('click');
        $cell.on('click', function () {
            showText("추가 턴을 얻은 유닛만 선택할 수 있습니다.");
        });

        $(`.line.${y}`).find(`.cell.${x}`).off('click').on('click', function () {
            if (!currentMine) return;
            var $this = $(this);
            var $mine = $this.find('.mine');
            if ($mine.length == 0) return;
            else bindTargetSelect($this.data('x'), $this.data('y'));
        });
    }

    function bindTargetSelect(fromX, fromY) {

        var sendFrom = {x: fromX, y: fromY};

        var fromUnit = unitArray[fromY][fromX];

        var count = 0;
        for (var y = 0; y < 7; y++) {
            for (var x = 0; x < 7; x++) {
                var toUnit = unitArray[y][x];
                if (fromUnit != null && checkUnitMove(fromUnit, {x: fromX, y: fromY}, {x: x, y: y})) {

                    if (toUnit && toUnit[1] == color) {
                        if (fromUnit[0] != 범고래 || toUnit[0] != 해파리) continue;
                    }
                    if (mapArray[y][x] == 소용돌이) continue;

                    var $myCell = $(`.line.${y}`).find(`.cell.${x}`);
                    if (unitArray[y][x] == null) $myCell.append('<div class="collect"></div>');
                    else $myCell.append('<div class="collect target"></div>');
                    count++;
                }
            }
        }
        if (count == 0) {
            showText("그 유닛은 갈 수 있는 곳이 없습니다.");
            bindUnitSelect();
        }
        else {
            $cell.off('click');
            $cell.on('click', function () {
                var $this = $(this);
                if ($this.has('.collect').length > 0) {
                    var sendTo = {x: $this.data('x'), y: $this.data('y')};
                    socket.emit('move', sendFrom, sendTo);
                    console.log(sendTo);
                }
                else {
                    showText("그곳으로는 갈 수 없습니다.");
                    $('.collect').remove();
                    if (isOnlyUnit) bindOnlyUnitSelect(onlyUnit.x, onlyUnit.y);
                    else bindUnitSelect();
                }
            });
        }
    }

    function onTurn(data, isMine) {
        currentMine = isMine;

        $cell.off('click');
        $('.collect').remove();

        switch (data.event) {
            case EVENT_MOVE:
                var $fromCell = $(`.line.${data.from.y}`).find(`.cell.${data.from.x}`);
                var $toCell = $(`.line.${data.to.y}`).find(`.cell.${data.to.x}`);

                var $fromUnit = $fromCell.children().eq(0);
                $fromUnit.fadeOut(500, function () {
                    $fromUnit.detach().appendTo($toCell).fadeIn(500, function () {

                        unitArray[data.to.y][data.to.x] = unitArray[data.from.y][data.from.x];
                        unitArray[data.from.y][data.from.x] = null;

                        andMore();
                    });
                });
                break;
            case EVENT_SWOP:
                var $fromCell = $(`.line.${data.from.y}`).find(`.cell.${data.from.x}`);
                var $toCell = $(`.line.${data.to.y}`).find(`.cell.${data.to.x}`);

                var $fromUnit = $fromCell.children().eq(0);
                var $toUnit = $toCell.children().eq(0);
                $fromUnit.add($toUnit).fadeOut(500, function () {
                    $fromUnit.detach().appendTo($toCell);
                    $toUnit.detach().appendTo($fromCell);
                    $fromUnit.add($toUnit).fadeIn(500, function () {
                        var temp = unitArray[data.from.y][data.from.x];
                        unitArray[data.from.y][data.from.x] = unitArray[data.to.y][data.to.x];
                        unitArray[data.to.y][data.to.x] = temp;

                        andMore();
                    });
                });
                break;
            case EVENT_ATTACK:
                var $fromCell = $(`.line.${data.from.y}`).find(`.cell.${data.from.x}`);
                var $toCell = $(`.line.${data.to.y}`).find(`.cell.${data.to.x}`);

                var $fromUnit = $fromCell.children().eq(0);
                var $toUnit = $toCell.children().eq(0);
                $fromUnit.fadeOut(500, function () {
                    $toUnit.fadeOut(500, function () {
                        $toUnit.remove();
                        $fromUnit.detach().appendTo($toCell).fadeIn(500, function () {
                            unitArray[data.to.y][data.to.x] = unitArray[data.from.y][data.from.x];
                            unitArray[data.from.y][data.from.x] = null;

                            andMore();
                        });
                    });
                });
                break;

            case EVENT_REBIRTH:
                var $myCell = $(`.line.${data.from.y}`).find(`.cell.${data.from.x}`);
                var $myUnit = $myCell.children().eq(0);
                var type = data.type;
                $('#upgrade-wrap').fadeOut(500);
                $('#black-wrap').fadeOut(500, function () {
                    $(this).hide();
                    $myUnit.fadeOut(500, function () {
                        $myUnit.remove();


                        var unitName = unitImageArr[type];
                        var colorStr;
                        if (currentMine) {
                            if (color == BLUE) colorStr = 'blue';
                            else colorStr = 'red';
                        }
                        else {
                            if (color == BLUE) colorStr = 'red';
                            else colorStr = 'blue';
                        }
                        var unitFileEnd = `/${colorStr}_${!currentMine ? 'back' : 'front'}.png`;
                        var unitFile = unitImagePrefix + unitName + unitFileEnd;

                        var $unit = $(`<img class='unit ${unitName}' src="${unitFile}" style="display:none;">`);
                        $myCell.append($unit);
                        $unit.css({width: unitSize[type][0] * 0.7, height: unitSize[type][1] * 0.7});
                        $unit.css({left: (100 - $unit.width()) / 2});
                        if (!currentMine) $unit.addClass('mine');

                        $unit.fadeIn(500, function () {
                            unitArray[data.from.y][data.from.x][0] = type;
                            andMore();
                        });
                    });
                });
        }


        function andMore() {
            isOnlyUnit = false;
            if (data.gameEnd) {
                var isWin = (data.turn % 2) != color;
                console.log($('#result-title'));
                $('#result-title').css('background', `url("../../images/game/game_finish/${isWin ? "win" : "lose"}_title.png") no-repeat`)
                    .css('background-position-x', 'center')
                    .css('background-size', 'contain');

                $('#result-scores .score-num').text('' + money);
                $('#get-scores .score-num').text(isWin?'10':'-10');
                $('#bonus-scores .score-num').text('0');
                $('#done-button').click(function () {
                    window.location.href = '/';
                });

                $('#result-wrap').fadeIn(500);
                $('#end-black-wrap').show().animate({opacity: 0.8}, 500);
            }
            else if (data.extra == undefined) {

                showText(`${data.turn}턴 : ${currentMine ? "당신의 차례입니다!" : "상대방의 차례입니다."}`);
                blockAndBind();
            }
            else if (data.extra == ON_REBIRTH) {
                $('#upgrade-wrap').fadeIn(500);
                $('#black-wrap').show().animate({opacity: 0.8}, 500, function () {

                    $('#crap-wrap').click(function () {
                        socket.emit('rebirth', 꽃게);
                    });

                    $('#crawfish-wrap').click(function () {
                        socket.emit('rebirth', 가재);
                    });

                });
            }
            else {
                showText(`${data.turn}턴 : 한 번 더 움직입니다!`);
                isOnlyUnit = true;
                onlyUnit = {x: data.to.x, y: data.to.y};
                bindOnlyUnitSelect(data.to.x, data.to.y);
            }
        }

        function blockAndBind() {

            if (data.block) {
                var blockCell = $(`.line.${data.block.y}`).find(`.cell.${data.block.x}`);

                blockCell.css('background', 'url("../../images/game/block.png")');
                mapArray[data.block.y][data.block.x] = 소용돌이;

                setTimeout(bindUnitSelect, 500);
            }

            bindUnitSelect();
        }

    }

    function showText(msg) {

        $('#message').text(msg).animate({opacity: 1}, 500, function () {
            setTimeout(function () {
                $('#message').animate({opacity: 0}, 500);
            }, 2000);
        });
    }


    function makeMap() {
        for (var y = 0; y < 7; y++) {
            var $line = $(`.line.${y}`);
            for (var x = 0; x < 7; x++) {
                var $cell = $line.find(`.cell.${x}`);
                $cell.data('x', x);
                $cell.data('y', y);
                if (mapArray[y][x] == 소용돌이) {
                    $cell.css('background', 'url("../../images/game/block.png")');
                }
                if (unitArray[y][x] != null) {
                    var unit = unitArray[y][x];
                    var unitName = unitImageArr[unit[0]];
                    var unitFileEnd = `/${unit[1] == BLUE ? 'blue' : 'red'}_${color == unit[1] ? 'back' : 'front'}.png`;
                    var unitFile = unitImagePrefix + unitName + unitFileEnd;

                    var $unit = $(`<img class='unit ${unitName}' src="${unitFile}">`);
                    $cell.append($unit);
                    $unit.css({width: unitSize[unit[0]][0] * 0.7, height: unitSize[unit[0]][1] * 0.7});
                    $unit.css({left: (100 - $unit.width()) / 2});
                    if (unit[1] == color) $unit.addClass('mine');
                }
            }
        }

        setInterval(animLoop, 50);
    }

    var isAnimPause = false;
    var animFrame = 1;

    function animLoop(){
        if(isAnimPause) return;

        $('.unit').each(function(){
            var $this = $(this);
            var src = $this.attr('src');

            var num = parseInt(src.charAt(src.length - 5));

            var myFrame = 1;
            switch(animFrame){
                case 1:
                case 2:
                case 3:
                    myFrame = animFrame;
                    break;
                case 4:
                case 5:
                    myFrame = 6 - animFrame;
                    break;
            }

            var toSrc = src.substr(0, src.length - 5) + myFrame + src.substr(src.length - 4, 4);

            $this.attr('src', toSrc);
            animFrame++;
            if(animFrame >= 6) animFrame -= 5;

        });
    }

    function onGameEnd() {
        setTimeout(()=> {
            window.location.href = '/';
        }, 0);
    }


    function checkUnitMove(unit, from, to) {

        var dx = Math.abs(from.x - to.x);
        var dy = Math.abs(from.y - to.y);
        if (dx == 0 && dy == 0) return false;

        switch (unit[0]) {
            case 새우:
                if (unitArray[to.y][to.x] == null) {
                    if (from.x != to.x) return false;

                    var first = (unit[1] == RED && from.y == 1) || (unit[1] == BLUE && from.y == 5);
                    var deltaY = to.y - from.y;
                    if (unit[1] != RED) deltaY *= -1;

                    if (deltaY == 1) return true;
                    if (first) {
                        if (deltaY == 2 && unitArray[(to.y + from.y) / 2][from.x] == null) return true;
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
                if (mapArray[from.y][from.x] == 해변) {
                    var i;
                    if (from.y == to.y) {
                        for (i = from.x + (from.x < to.x ? 1 : -1); i != to.x; i < to.x ? i++ : i--) {
                            if (unitArray[from.y][i] != null) return false;
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

                if (unitArray[to.y][to.x] == null) {
                    if (dx == 0) {
                        if (dy == 1) return true;
                        if (dy == 2 && unitArray[(to.y + from.y) / 2][from.x] == null) return true;
                    }
                    if (dy == 0 || dy == dx) {
                        if (dx == 1) return true;
                        if (dx == 2 && unitArray[from.y][(to.x + from.x) / 2] == null) return true;
                    }
                }
                else {
                    if (dx == 0) {
                        if (dy == 1) return true;
                        if (dy == 3) {
                            for (i = from.y + (from.y < to.y ? 1 : -1); i != to.y; i < to.y ? i++ : i--) {
                                if (unitArray[i][from.x] != null) return false;
                            }
                            return true;
                        }
                    }
                    if (dy == 0) {
                        if (dx == 1) return true;
                        if (dx == 3) {
                            for (i = from.x + (from.x < to.x ? 1 : -1); i != to.x; i < to.x ? i++ : i--) {
                                if (unitArray[from.y][i] != null) return false;
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
                                if (unitArray[yi][xi] != null) return false;
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
                        if (unitArray[yi][xi] != null) return false;
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
                if (mapArray[from.y][from.x] == 해변) {
                    var i;
                    if (from.x == to.x) {
                        for (i = from.y + (from.y < to.y ? 1 : -1); i != to.y; i < to.y ? i++ : i--) {
                            if (unitArray[i][from.x] != null) return false;
                        }
                        return true;
                    }
                    if (dx == dy) {
                        var xi = from.x + (from.x < to.x ? 1 : -1);
                        var yi = from.y + (from.y < to.y ? 1 : -1);
                        while (xi != to.x && yi != to.y) {
                            if (unitArray[yi][xi] != null) return false;
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

    function reverseCell() {
        var $unitWrap = $('#unit-wrap');

        var lineList = [];
        for (var y = 0; y < 7; y++) lineList.push($(`.line.${y}`).detach());
        for (var y = 6; y >= 0; y--) $unitWrap.append(lineList[y]);


    }

});
