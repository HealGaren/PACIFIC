/**
 * Created by 최예찬 on 2016-11-03.
 */


$(window).ready(()=> {
    //noinspection all

    var socket;

    $('#goto-home').click(function () {
        $('#html-wrap').fadeOut(500, function() {
            window.location.href = '/';
        });
    });

    var money;


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


        var array = [[$('#angry'), 'isHaveAngry'], [$('#smile'), 'isHaveSmile'], [$('#dead'), 'isHaveDead']];


        for (var i = 0; i < array.length; i++) {
            var keys = array[i];
            if (data.user[keys[1]]) {
                keys[0].addClass('bought').removeClass('btn').click(()=>{
                    alert('이미 구매하신 품목입니다.');
                });

                keys[0].find('.price').text('이미 구매하셨습니다.');
                keys[0].find('.price-end').text('구매 불가');
            }
            else {
                keys[0].click((keys=> {
                    return ()=> {
                        if (money < 100) {
                            alert('돈이 부족합니다!');
                            return;
                        }
                        socket.emit('buy', keys[1], ()=> {
                            alert('성공적으로 구매했습니다.');
                            money -= 100;
                            $('#money-bar').find('span').text(money + ' pearl');
                            keys[0].addClass('bought').removeClass('btn').click(()=>{
                                alert('이미 구매하신 품목입니다.');
                            });

                            keys[0].find('.price').text('이미 구매하셨습니다.');
                            keys[0].find('.price-end').text('구매 불가');
                        });
                    };
                })(keys));
            }
        }


        $('#money-bar').find('span').text(data.user.money + ' pearl');
        money = data.user.money;

        $('#btn-category-skin').click(()=>{
            alert('준비 중입니다.');
        });
    }

});
