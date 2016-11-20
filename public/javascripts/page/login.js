/**
 * Created by 최예찬 on 2016-11-01.
 */


$(window).ready(()=> {

    var $loginForm = $("#login-form");
    var $title = $('#title');
    setTimeout(function () {
        $title.addClass('animated fadeInUp').show();
        setTimeout(function () {
            $('#login-wrap').fadeIn(500);
        }, 1000);
    }, 500);
    $loginForm.submit(function (e) {
        var url = "/api/user/login/local"; // the script where you handle the form input.
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(), // serializes the form's elements.
            complete: (xhr)=> {
                switch (xhr.status) {
                    case 200:
                        $('#html-wrap').fadeOut(500, function(){
                            window.location.href = '/';
                        });
                        break;
                    default:
                        alert(xhr.responseText);
                        break;
                }
            }
        });
        e.preventDefault(); // avoid to execute the actual submit of the form.
    });

    $("#login-button").click(()=> {
        $loginForm.submit();
    });

    $('#signup-btn').click(()=>{
        $('#html-wrap').fadeOut(500, function(){
            window.location.href = '/login/register';
        });
    })

    $('#facebook-btn').click(()=>{
        $('#html-wrap').fadeOut(500, function(){
            window.location.href = '/login/facebook';
        });
    })


});