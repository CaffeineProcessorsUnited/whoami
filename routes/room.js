var express = require('express');
var crypto = require('crypto');

module.exports = function(app) {
  var router = express.Router({
    caseSensitive: app.get('case sensitive routing'),
    strict       : app.get('strict routing')
  });

  router.param('room', function(req, res, next, id) {
    req.room["id"] = id;
    next();
  });

  /* GET room listings. */
  router.get('/', function(req, res, next) {
    var allrooms = req.app.locals["rooms"];
    var rooms = [];
    for (var k in allrooms) {
      if (allrooms.hasOwnProperty(k)) {
        var count = 0;
        for (var u in allrooms[k]["users"]) {
          if (allrooms[k]["users"].hasOwnProperty(u)) {
            count++;
          }
        }
        rooms.push({
          "id": k,
          "name": allrooms[k]["name"],
          "count": count
        });
      }
    }
    res.render('listrooms', { "title": "All rooms", "rooms": rooms });
  });

  router.all('/create/', function(req, res, next) {
    if (req.body["action"] != "createroom") {
      res.render('createroom', { "title": "Create a new room", "subtitle": "Choose a name:" });
    } else {
      var errormsg = "";
      var name = req.body["name"];
      if (name == "") {
        errormsg = "Name should not be empty!";
      } else if (name.length <= 2) {
        errormsg = "Name is too short!";
      } else if (!(new RegExp("[A-Z 0-9ÄÖÜa]+", "i").test(name))) {
        errormsg = "Name contains invalid characters!";
      }  
      if (errormsg != "") {
        res.render('createroom', { "title": "Create a new room", "subtitle": "Choose a name:", "error": errormsg });
      } else {
        var room = name + "-" + new Date().getTime() + "-" + req.connection.remoteAddress;
        var id = crypto.createHash('sha1').update(room).digest("hex");
        req.app.locals["rooms"][id] = {
          "name": name,
          "users": {}
        };
        res.redirect("/room/" + id + "/");
      }
    }
  });

  /* GET room. */
  router.all('/:room/', function(req, res, next) {
    var room = req.app.locals["rooms"][req.room["id"]];
    if (!room) {
      var err = new Error('Room does not exist!');
      err.status = 404;
      next(err);
    }
    if (req.body["action"] === "createuser") {
      var errormsg = "";
      var name = req.body["name"];
      if (name == "") {
        errormsg = "Name should not be empty!";
      } else if (name.length <= 2) {
        errormsg = "Name is too short!";
      } else if (!(new RegExp("[A-Z 0-9ÄÖÜa]+", "i").test(name))) {
        errormsg = "Name contains invalid characters!";
      }  
      if (errormsg !== "") {
        res.render('createuser', { "title": "Join", "subtitle": "Choose a name:", "error": errormsg });
      } else {
        var nameid = new Date().getTime() + "-" + name;
        var id = crypto.createHash('sha1').update(nameid).digest("hex");
        req.app.locals["users"][id] = {
          "name": name
        };
        res.cookie('id', id, {});
        res.redirect(req.originalUrl);
      }
    }
    if (!req.cookies["id"] || !app.locals["users"][req.cookies["id"]]) {
      res.render('createuser', { "title": "Join", "subtitle": "Choose a name:" });
    } else {
      var roomusers = room["users"];
      var allusers = req.app.locals["users"];
      var id = req.cookies["id"];
      if (!roomusers[id]) {
        roomusers[id] = {
          "term": undefined,
          "guessed": false
        };
      }
      if (req.body["action"] === "createterm") {
        if (req.body["term"] != "" && req.body["user"] != "" && req.body["user"] != id) {
          roomusers[req.body["user"]]["term"] = req.body["term"];
        }
      }
      if( req.body["action"] === "markguessed") {
        if (roomusers[req.body["user"]]["guessed"] != true && req.body["user"] != "" && req.body["user"] != id && roomusers[req.body["user"]]["term"]) {
          roomusers[req.body["user"]]["guessed"] = true;
        }
      }
      var users = [];
      for (var k in roomusers) {
        if (roomusers.hasOwnProperty(k)) {
          var term = roomusers[k]["term"];
          term = (term === undefined || term === "") ? "" : term;
          var show = (roomusers[k]["guessed"] === true || k != id);
          term = (show) ? term : "_";
          users.push({
            "id": k,
            "name": allusers[k]["name"],
            "term": term,
            "guessed": roomusers[k]["guessed"]
          });
        }
      }
      res.render('room', { "room": room, "users": users, "currentuser": id });
  });


  return router;
};
