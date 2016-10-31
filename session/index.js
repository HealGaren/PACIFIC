/**
 * Created by User7 on 2016-10-29.
 */

var session = require('express-session');

module.exports = session({
    secret: '314159 is pi',
    resave: false,
    saveUninitialized: true
});