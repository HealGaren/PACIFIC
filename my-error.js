/**
 * Created by User7 on 2016-10-29.
 */

function MyError(msg, code){
    Error.call(this, msg);
    this.statusCode = code;
}

MyError.prototype = Object.create(Error.prototype);
MyError.prototype.constructor = MyError;