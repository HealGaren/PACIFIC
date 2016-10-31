/**
 * Created by User7 on 2016-10-29.
 */

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/MyWebGame');

var db = mongoose.connection;
db.once('open', function(){
    console.log('mongoose connect done');
});

module.exports = {
    User: require('./user'),
};