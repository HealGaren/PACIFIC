/**
 * Created by User7 on 2016-10-29.
 */



function needLogin(req, res, next) {
    if(req.isAuthenticated()) next();
    else res.redirect('/login');
}


exports.needLogin = needLogin;
