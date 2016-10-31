/**
 * Created by qkswk on 2016-02-05.
 */

var express = require('express');
var passport = require('passport');
var mongo = require('../mongo');
var permission = require('./permission');
var router = express.Router();
var middleware = require('./middleware');

router.get('/', (req, res)=> {
    res.render('page/login', {title: '로그인'});
});


//noinspection JSUnresolvedFunction
router.get('/facebook', passport.authenticate('facebook', {scope: 'email'}));

router.get('/facebook/callback', (req, res, next)=> {
    //noinspection JSUnresolvedFunction
    passport.authenticate('facebook', (err, user, info)=> {
        if (err) res.status(400).send(err.message);
        else if (!user) res.status(401).send(info.message);
        else req.login(user, err=> {
                if (err) res.status(500).send(err.message);
                else {
                    if (!user.nickname) res.redirect('/add-nickname');
                    else res.redirect('/');
                }
            });
    })(req, res, next);
});

router.get('/nickname', permission.needLogin, (req, res, next)=>{

});



module.exports = router;