/**
 * Created by User7 on 2016-10-29.
 */

function needLogin(req, res, next) {
    if(req.isAuthenticated()) next();
    else res.status(401).send('로그인이 필요합니다.');
}


exports.needLogin = needLogin;
