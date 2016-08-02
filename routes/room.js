var express = require('express');
var crypto = require('crypto');
var router = express.Router();

router.param('room', function(req, res, next, room) {
  req.room["id"] = room;
  next();
});

/* GET room listings. */
router.get('/', function(req, res, next) {
  res.send('All rooms: ');
  // TODO: List all romms that exist
});

/* GET create room. */
router.get('/create', function(req, res, next) {
  console.log("create");
  var room = new Date().getTime() + "-" + req.connection.remoteAddress;
  var id = crypto.createHash('sha1').update(room).digest("hex");
  res.send('Created room ' + id);
  // TODO: redirect to '/room/' + id
});

/* GET room. */
router.get('/:room', function(req, res, next) {
  console.log("room");
  res.send('room = ' + req.room);
  // TODO: user has id?
  // TODO: create new user cookie
  // TODO: load room
  // TODO: create view
});

module.exports = router;
