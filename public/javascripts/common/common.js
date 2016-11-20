/**
 * Created by 최예찬 on 2016-11-01.
 */

$(window).ready(()=>{
    setTimeout(()=> {
        $("body").removeClass('preload');
    }, 100);
    $('.nano').nanoScroller();
});