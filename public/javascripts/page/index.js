/**
 * Created by 최예찬 on 2016-11-03.
 */

var LAST_PLAYER = 1;
var NORMAL_FRIEND = 2;
var INVITE_FRIEND = 3;

$(window).ready(()=>{
    //noinspection all

    var socket;

    $('#shop-icon').click(function(){
        $('#html-wrap').fadeOut(500, function() {
            window.location.href = '/shop';
        });
    });

    $('#logout-icon').click(function(){
        $('#html-wrap').fadeOut(500, function() {
            window.location.href = '/login/logout';
        });
    });

    var isFriendShowing = false;

    $('#friend-icon').click(function(){
        $('#friend-list-wrap').removeClass().addClass(`animated ${isFriendShowing?'fadeOutLeft':'fadeInLeft'}`).show();
        isFriendShowing = !isFriendShowing;
        $('.nano').nanoScroller();
    });

    var $matchingBar = $('#matching-bar');
    var $matchingBarSpan = $matchingBar.find('span');

    setTimeout(function(){
        $('#left-menu').addClass('animated fadeInLeft').show();
        setTimeout(function(){
            $('#right-menu').addClass('animated fadeInRight').show();
        }, 500);
        setTimeout(function(){
            $('#content-wrap').addClass('animated fadeIn').show();
        }, 500);

        setTimeout(function() {
            socket = io.connect();
            socket.on('init', onSocketConnect);
        }, 500);

    }, 1000);

    function onSocketConnect(data){

        $matchingBarSpan.text('매칭하기');

        $matchingBar.click(function(){
            $matchingBar.off('click');
            $matchingBarSpan.text('매칭 중입니다...');
            socket.emit('match', onMatchReady)
        });

        if(data.user.facebookExist) {
            $('#player-image').css('background', `url('http://graph.facebook.com/${data.user.facebookID}/picture?type=normal')`);
        }
        $('#player-name').text(data.user.nickname);

        $('#win-number').text(data.user.win);
        $('#lose-number').text(data.user.lose);
        var winLose  = (data.user.win / (data.user.win + data.user.lose)) * 100;
        if(isNaN(winLose)) winLose = 0;
        $('#win-percent').text(Math.round(winLose) + '%');

        $('#money-bar').find('span').text(data.user.money + ' pearl');

        $('#friend-list').find('> .nano-content')
            .append(makeFriendDiv(data.user.lastPlayed, LAST_PLAYER));
    }

    function makeFriendDiv(player, type){

        var winLose  = (player.win / (player.win + player.lose)) * 100;
        if(isNaN(winLose)) winLose = 0;

        var str = '<div class="friend">'+
                    `<div class="friend-icon" style="background:url('http://graph.facebook.com/${player.facebookID}/picture?type=normal')"></div>` +
                    '<div class="friend-info">' +
                        '<div class="friend-name">' +
                            '<span>' + player.nickname + '</span>' +
                        '</div>' +
                        '<div class="friend-log">' +
                            '<span class="f-win-number">' + player.win + '</span>' +
                            '<span class="red">W&nbsp;</span>' +
                            '<span class="f-lose-number">' + player.lose + '</span>' +
                            '<span class="blue">L&nbsp;</span>' +
                            '<span class="f-win-percent">' + winLose + '%</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="friend-btns">';

        switch(type) {
            case LAST_PLAYER:
                str = str +
                    '<div class="btn add-friend"></div>';
                break;
            case NORMAL_FRIEND:
                str = str +
                    '<div class="btn battle-friend"></div>';
                break;
            case INVITE_FRIEND:
                str = str +
                    '<div class="btn accept-friend"></div>' +
                    '<div class="btn deny-friend"></div>';
                break;
        }
        str = str +
                '</div>' +
            '</div>';

        return str;
    }

    function onMatchReady(){
        $matchingBarSpan.text('매칭이 완료되었습니다!');
        $matchingBar.unbind('click');
        setTimeout(()=>{
            $('#html-wrap').fadeOut(500, function() {
                window.location.href = '/game';
            });
        }, 1000);
    }



});
