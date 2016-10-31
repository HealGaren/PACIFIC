/**
 * Created by User7 on 2016-10-29.
 */


/**
 * Created by qkswk on 2016-02-04.
 */

var crypto = require('crypto');
var mongo = require('../mongo');
var MyError = require('../my-error');

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy;


var objects = null;

exports.init = function (app) {

    if(!objects) {

        exports.serializeUserFunc = function (user, done) {
            done(null, user._id);
        };

        exports.deserializeUserFunc = function (id, done) {
            mongo.User.findOne({_id: id}).exec().then(function (user) {
                done(null, user);
            }, function (err) {
                done(err, false);
            });
        };

        //noinspection JSUnresolvedFunction
        passport.serializeUser(exports.serializeUserFunc);
        //noinspection JSUnresolvedFunction
        passport.deserializeUser(exports.deserializeUserFunc);

        passport.use(new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true
            },
            function (req, email, password, done) {
                mongo.User.loginLocal(email, password)
                    .then(function (user) {
                        done(null, user);
                    }, function (err) {
                        if (err instanceof MyError) done(null, false, err);
                        else done(err, false);
                    });
            }
        ));

        passport.use(new FacebookStrategy({
                clientID: '1804095099830430',
                clientSecret: '2933107e6aa8dddd3ec9460280440da7',
                callbackURL: 'http://localhost:3000/login/facebook/callback',
                profileFields: ['id', 'emails']
            },
            function (accessToken, refreshToken, profile, done) {
                mongo.User.loginFacebook(profile.id, profile.emails[0].value)
                    .then(function (user) {
                        done(null, user);
                    }).catch(err=>{
                        if (err instanceof MyError) done(null, false, err);
                        else done(err, false);
                    });
            }
        ));

        //noinspection JSUnresolvedFunction
        objects = {
            initialize: passport.initialize(),
            session: passport.session()
        };
    }

    app.use(objects.initialize);
    app.use(objects.session);

};
