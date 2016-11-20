var express = require('express');
var router = express.Router();
var passport = require('passport');

var permission = require('./permission');

/* GET home page. */
router.get('/', permission.needLogin, function(req, res, next) {
  res.render('page/index', { title: 'PACIFIC: Index' });
});

router.get('/game', permission.needLogin, function(req, res, next) {
  res.render('page/game', { title: 'PACIFIC: Game' });
});

router.get('/shop', permission.needLogin, function(req, res, next) {
  res.render('page/shop', { title: 'PACIFIC: Shop' });
});

module.exports = router;
