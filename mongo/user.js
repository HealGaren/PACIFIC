/**
 * Created by 최예찬 on 2016-08-20.
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var MyError = require('../my-error');

var schema = new mongoose.Schema({
    createdDate: {
        type: Date,
        default: Date.now
    },
    facebookID: {
        type: String
    },
    localEmail: {
        type: String
    },
    localSalt: {
        type: String
    },
    localHash: {
        type: String
    },
    nickname: {
        type: String
    },
    facebookExist: {
        type: Boolean,
        default: false
    },
    localExist: {
        type: Boolean,
        default: false
    },
    friends: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }]
    },
});

/**
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
schema.methods.addLocalLogin = function (email, password) {
    var salt = Math.round((new Date().valueOf() * Math.random())) + "";
    var hashedPass = crypto.createHash("sha512").update(password + salt).digest("hex");

    this.localEmail = email;
    this.localSalt = salt;
    this.localHash = hashedPass;

    this.localExist = true;

    return this.save();
};

/**
 *
 * @param {string} facebookID
 * @param {string} email
 * @returns {Promise}
 */
schema.methods.addFacebookLogin = function (facebookID, email) {

    this.facebookID = facebookID;
    if (!this.localExist) this.localEmail = email;
    this.facebookExist = true;

    return this.save();
};

/**
 *
 * @param {string} nickname
 * @returns {Promise}
 */
schema.methods.addNickname = function (nickname) {
    this.nickname = nickname;
    return this.save();
};

/**
 *
 * @param {string} password
 * @returns {boolean}
 */
schema.methods.equalsPassword = function (password) {
    var hash = crypto.createHash('sha512').update(password + this.localSalt).digest('hex');
    return hash == this.localHash;
};

/**
 *
 * @param {string} id
 * @param {string} email
 * @returns {Promise}
 */
schema.statics.registerFacebook = function (id, email) {
    return this.findOne({facebookID: id}).exec()
        .then(user=> {
            if (!user) return new this().addFacebookLogin(id, email);
            else throw new MyError("이미 존재하는 유저입니다.", 409);
        });
};

/**
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nickname
 * @returns {Promise}
 */
schema.statics.registerLocal = function (email, password, nickname) {
    return this.findOne({localEmail: email}).exec()
        .then(user=> {
            if (!user) return new this().addLocalLogin(email, password)
                .then(user=> {
                    return user.addNickname(nickname);
                });
            else throw new MyError("이미 존재하는 유저입니다.", 409);
        });
};

/**
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
schema.statics.loginLocal = function (email, password) {
    return this.findOne({localEmail: email}).exec()
        .then(user=>{
            if (!user) throw new MyError("이메일이 존재하지 않습니다.", 401);
            else if (!user.equalsPassword(password))
                throw new MyError("비밀번호가 일치하지 않습니다.", 401);
            else return user;
        });
};

/**
 *
 * @param {string} facebookId
 * @param {string} email
 * @returns {Promise}
 */
schema.statics.loginFacebook = function (facebookId, email) {
    return this.findOne({facebookID: facebookId}).exec()
        .then(user=>{
            if (user) return user;
            else return this.registerFacebook(facebookId, email);
        });
};

/**
 *
 * @param {string} id
 * @returns {Promise}
 */
schema.statics.removeUser = function (id) {
    return this.findByIdAndRemove(id).exec();
};

/**
 *
 * @param {ObjectId} id
 * @param {ObjectId} friendId
 * @returns {Promise}
 */
schema.statics.addFriend = function (id, friendId) {
    return this.findByIdAndUpdate(id, {$push: {friends: friendId}}).exec();
};

/**
 *
 * @param {ObjectId} id
 * @param {ObjectId} friendId
 * @returns {Promise}
 */
schema.statics.removeFriend = function (id, friendId) {
    return this.findByIdAndUpdate(id, {$pull: {friends: friendId}}).exec();
};

var model = mongoose.model('users', schema);

module.exports = model;