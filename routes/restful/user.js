/**
 * Created by User7 on 2016-10-29.
 */

var express = require('express');
var passport = require('passport');
var mongo = require('../../mongo');
var middleware = require('../middleware');
var permission = require('./permission');
var router = express.Router();


router.post('/login/local', middleware.parseParam.body([
    ['email', 'string', true],
    ['password', 'string', true]
]), (req, res, next)=> {
    //noinspection JSUnresolvedFunction
    passport.authenticate('local', {badRequestMessage: "잘못된 입력입니다."}, (err, user, info)=> {
        if (err) res.status(400).send(err.message);
        else if (!user) res.status(401).send(info.message);
        else req.login(user, err=> {
                if (err) res.status(500).send(err.message);
                else res.send("성공적으로 로그인되었습니다.");
            });
    })(req, res, next);
});

router.post('/register', middleware.parseParam.body([
    ['email', 'string', true],
    ['password', 'string', true],
    ['nickname', 'string', true]
]), (req, res) => {

    //noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
    mongo.User.registerLocal(req.body.email, req.body.password, req.body.nickname)
        .then(()=> {
            res.send("회원가입에 성공했습니다.\n입력하신 이메일로 로그인해주세요.");
        })
        .catch(err=> {
            res.status(err.statusCode).send(err.message);
        });
});


router.post('/logout', (req, res)=> {
    req.logout();
    res.send("성공적으로 로그아웃되었습니다.");
});


router.post('/nickname', permission.needLogin, middleware.parseParam.body([
    ['nickname', 'string', true],
]), (req, res)=> {
    req.user.addNickname(req.body.nickname)
        .then(()=> {
            res.send("성공적으로 닉네임이 등록되었습니다.");
        })
        .catch(err=> {
            res.status(err.statusCode).send(err.message);
        });
});

router.post('/add-friend', permission.needLogin, middleware.parseParam.body([
    ['id', 'string', true],
]), (req, res)=> {
    mongo.User.inviteFriend(req.user._id, req.body.id)
        .then(()=>{
            res.send("성공적으로 친구 추가가 요청되었습니다.");
        })
        .catch(err=>{
            res.status(err.statusCode).send(err.message);
        });
});

router.post('/accept-friend', permission.needLogin, middleware.parseParam.body([
    ['id', 'string', true],
]), (req, res)=> {
    mongo.User.acceptFriend(req.user._id, req.body.id)
        .then(()=>{
            res.send("성공적으로 친구 추가를 수락했습니다.");
        })
        .catch(err=>{
            console.log(err);
            res.status(err.statusCode).send(err.message);
        });
});


router.post('/deny-friend', permission.needLogin, middleware.parseParam.body([
    ['id', 'string', true],
]), (req, res)=> {
    mongo.User.denyFriend(req.user._id, req.body.id)
        .then(()=>{
            res.send("성공적으로 친구 추가를 거절했습니다.");
        })
        .catch(err=>{
            res.status(err.statusCode).send(err.message);
        });
});

module.exports = router;