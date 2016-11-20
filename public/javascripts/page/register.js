/**
 * Created by 최예찬 on 2016-11-01.
 */


$(window).ready(()=> {

    var $title = $('#title');
    setTimeout(function () {
        $title.addClass('animated fadeInUp').show();
        setTimeout(function () {
            $('#register-wrap').fadeIn(500);
        }, 1000);
    }, 500);

    var $registerForm = $("#register-form");
    $registerForm.submit(function (e) {
        var url = "/api/user/register"; // the script where you handle the form input.
        $.ajax({
            type: "POST",
            url: url,
            data: $('input[name!=password2]', this).serialize(), // serializes the form's elements.
            complete: (xhr)=>{
                switch(xhr.status){
                    case 200:
                        alert(xhr.responseText);
                        $('#html-wrap').fadeOut(500, function() {
                            window.location.href = '/login';
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

    $("#register-button").click(()=>{
        $registerForm.submit();
    });



});