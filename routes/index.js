var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.user) res.render('page/index', { title: 'Express' });
  else res.redirect('/login');
});

module.exports = router;
