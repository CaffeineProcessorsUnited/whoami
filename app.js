var express = require('express');
var slash   = require('express-slash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var crypto = require('crypto');

var app = express();

app.enable('strict routing');

app.locals["rooms"] = {};
app.locals["users"] = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  if (req.path.slice(-1) !== "/") {
    res.redirect(req.path + "/");
  } else {
    next();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function(req, res, next) {
  req.room = {};
  next();
});

app.use(function(req, res, next) {
  switch (req.body["action"]) {
    case "createuser":
      var name = req.body["name"];
      var nameid = new Date().getTime() + "-" + name;
      var id = crypto.createHash('sha1').update(nameid).digest("hex");
      req.app.locals["users"][id] = {
        "name": name
      };
      res.cookie('id', id, {});
      res.redirect(req.path);
      break;
    default:
      next();
      break;
  }
});

app.use(function(req, res, next) {
  if (!req.cookies["id"] || !app.locals["users"][req.cookies["id"]]) {
    res.render('createuser', { "title": "Join", "subtitle": "Choose a name:" });
  } else {
    next();
  }
});

app.use('/', require('./routes/index')(app));
app.use('/room', require('./routes/room')(app));

app.use(slash());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
