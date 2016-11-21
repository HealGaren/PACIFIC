/**
 * Created by 최예찬 on 2016-11-03.
 */

var LAST_PLAYER = 1;
var ONLINE_FRIEND = 2;
var OFFLINE_FRIEND = 3;
var INVITE_FRIEND = 4;

$(window).ready(()=> {
    //noinspection all

    var socket;

    $('#shop-icon').click(function () {
        $('#html-wrap').fadeOut(500, function () {
            window.location.href = '/shop';
        });
    });

    $('#logout-icon').click(function () {
        $('#html-wrap').fadeOut(500, function () {
            window.location.href = '/login/logout';
        });
    });

    var isFriendShowing = false;

    $('#friend-icon').click(function () {
        $('#friend-list-wrap').removeClass().addClass(`animated ${isFriendShowing ? 'fadeOutLeft' : 'fadeInLeft'}`).show();
        isFriendShowing = !isFriendShowing;
        $('.nano').nanoScroller();
    });

    var $matchingBar = $('#matching-bar');
    var $matchingBarSpan = $matchingBar.find('span');

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
            socket.on('init', onSocketConnect);
        }, 500);

    }, 1000);

    function onSocketConnect(data) {

        $matchingBarSpan.text('매칭하기');

        $matchingBar.click(function () {
            $matchingBar.off('click');
            $matchingBarSpan.text('매칭 중입니다...');
            socket.emit('match', onMatchReady)
        });

        $('#player-image').css('background-image', `url('http://graph.facebook.com/${data.user.facebookID}/picture?type=normal')`);
        $('#player-name').text(data.user.nickname);

        $('#win-number').text(data.user.win);
        $('#lose-number').text(data.user.lose);
        var winLose = (data.user.win / (data.user.win + data.user.lose)) * 100;
        if (isNaN(winLose)) winLose = 0;
        $('#win-percent').text(Math.round(winLose) + '%');

        $('#money-bar').find('span').text(data.user.money + ' pearl');


        console.log(data.user);
        var $friendContent = $('#friend-list').find('> .nano-content');


        if (data.user.lastPlayed) {
            $friendContent.append(makeCategoryDiv("최근 플레이"));
            $friendContent.append(makeFriendDiv(data.user.lastPlayed, LAST_PLAYER, true));
        }


        if (data.user.friends && data.user.friends.length > 0) {

            var onlineFriends = data.user.friends.filter((p)=> {
                return p.isOnline;
            });
            var offlineFriends = data.user.friends.filter((p)=> {
                return !p.isOnline;
            });

            if (onlineFriends && onlineFriends.length > 0) {
                $friendContent.append(makeCategoryDiv("온라인 친구 목록"));
                for (var i = 0; i < onlineFriends.length; i++) {
                    var p = onlineFriends[i];
                    $friendContent.append(makeFriendDiv(p, ONLINE_FRIEND, i == onlineFriends.length - 1));
                }
            }

            if (offlineFriends && offlineFriends.length > 0) {
                $friendContent.append(makeCategoryDiv("오프라인 친구 목록"));
                for (var i = 0; i < offlineFriends.length; i++) {
                    var p = offlineFriends[i];
                    $friendContent.append(makeFriendDiv(p, OFFLINE_FRIEND, i == offlineFriends.length - 1));
                }
            }
        }
        if (data.user.invites && data.user.invites.length > 0) {
            $friendContent.append(makeCategoryDiv("받은 요청"));
            for (var i = 0; i < data.user.invites.length; i++) {
                var p = data.user.invites[i];
                $friendContent.append(makeFriendDiv(p, INVITE_FRIEND, i == data.user.invites.length - 1));
            }
        }

        $friendContent.on('click', '.btn', function () {
            var $this = $(this);
            var player = $this.parent().parent().data('player');
            if ($this.hasClass('add-friend')) {
                var url = "/api/user/add-friend"; // the script where you handle the form input.
                $.ajax({
                    type: "POST",
                    url: url,
                    data: {id: player._id}, // serializes the form's elements.
                    complete: (xhr)=> {
                        switch (xhr.status) {
                            case 200:
                                alert('친구 요청이 전송되었습니다.');
                                break;
                            default:
                                alert(xhr.responseText);
                                break;
                        }
                    }
                });
            }

            else if ($this.hasClass('accept-friend')) {
                var url = "/api/user/accept-friend"; // the script where you handle the form input.
                $.ajax({
                    type: "POST",
                    url: url,
                    data: {id: player._id}, // serializes the form's elements.
                    complete: (xhr)=> {
                        switch (xhr.status) {
                            case 200:
                                alert('친구 요청을 수락했습니다.');
                                window.location.reload(true);
                                break;
                            default:
                                alert(xhr.responseText);
                                break;
                        }
                    }
                });
            }


            else if ($this.hasClass('deny-friend')) {
                var url = "/api/user/deny-friend"; // the script where you handle the form input.
                $.ajax({
                    type: "POST",
                    url: url,
                    data: {id: player._id}, // serializes the form's elements.
                    complete: (xhr)=> {
                        switch (xhr.status) {
                            case 200:
                                alert('친구 요청을 거절했습니다.');
                                window.location.reload(true);
                                break;
                            default:
                                alert(xhr.responseText);
                                break;
                        }
                    }
                });
            }

            else if ($this.hasClass('battle-friend')){
                socket.emit('vs', player._id, onAcceptVs);
            }
        });

        socket.on('vs', (nickname)=>{
            var accept = confirm(`'${nickname}'님이 배틀을 신청했습니다. 수락하시겠습니까?`);
            if(accept) socket.emit('vs accept', true, onAcceptVs);
            else socket.emit('vs accept', false);
        });

    }

    function makeFriendDiv(player, type, isLast) {

        var winLose = (player.win / (player.win + player.lose)) * 100;
        if (isNaN(winLose)) winLose = 0;

        var str = `<div class='${!isLast ? "friend" : "friend last-list"}'>` +
            `<div class="friend-icon" style="background-image:url('http://graph.facebook.com/${player.facebookID}/picture?type=normal')"></div>` +
            '<div class="friend-info">' +
            '<div class="friend-name">' +
            '<span>' + player.nickname + '</span>' +
            '</div>' +
            '<div class="friend-log">' +
            '<span class="f-win-number">' + player.win + '</span>' +
            '<span class="red">W&nbsp;</span>' +
            '<span class="f-lose-number">' + player.lose + '</span>' +
            '<span class="blue">L&nbsp;</span>' +
            '<span class="f-win-percent">' + Math.round(winLose) + '%</span>' +
            '</div>' +
            '</div>' +
            '<div class="friend-btns">';

        switch (type) {
            case LAST_PLAYER:
                str = str +
                    '<div class="btn add-friend"></div>';
                break;
            case ONLINE_FRIEND:
                str = str +
                    '<div class="btn battle-friend"></div>';
                break;
            case OFFLINE_FRIEND:
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

        var result = $(str);

        result.data('player', player);
        return result;
    }

    function makeCategoryDiv(name) {
        return `<div class="friend-category"><span>${name}</span></div>`;
    }

    function onMatchReady() {
        $matchingBarSpan.text('매칭이 완료되었습니다!');
        $matchingBar.unbind('click');
        setTimeout(()=> {
            $('#html-wrap').fadeOut(500, function () {
                window.location.href = '/game';
            });
        }, 1000);
    }

    function onAcceptVs() {
        $matchingBarSpan.text('대결이 성사되었습니다!');
        $matchingBar.unbind('click');
        setTimeout(()=> {
            $('#html-wrap').fadeOut(500, function () {
                window.location.href = '/game';
            });
        }, 1000);
    }


});
