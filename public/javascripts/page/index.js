/**
 * Created by 최예찬 on 2016-11-03.
 */


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
