// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var session = require('express-session');
var port = process.env.PORT || 5000;

app.set('port', port);

// passportjs
var passport = require('passport');

var domain = process.env.DOMAIN || ('localhost:' + app.get('port'));

server.listen(app.get('port'), function () {
  mongoose.connect(process.env.MONGO_LINK || 'mongodb://localhost/shriek');
  var db = mongoose.connection;

  db.on('error', function (err) {
    console.error('Connection error:', err.message);
  });
  db.once('open', function callback() {
    console.info('Connected to DB!');
  });
});

// Routing
app.use(express.static('public'));
app.use('/components', express.static('app/components'));

app.use(session({
  genid: function () {
    var date = new Date();
    var uid = date.getTime();
    return uid.toString();
  },
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

var UserModel = require('../models/user');

passport.deserializeUser(function (id, done) {
  UserModel.findById(id, function (err, user) {
    done(err, user);
  });
});

// passports
require('../modules/passports/twitter')(app, domain);
require('../modules/passports/google')(app, domain);
require('../modules/passports/github')(app, domain);

// Chatroom

io.on('connection', function (socket) {
  require('../modules/user')(socket, io);
  require('../modules/message')(socket);
  require('../modules/channel')(socket);
  require('../modules/search')(socket);

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    socket.broadcast.emit('user disconnected', {
      status: 'ok',
      user: {
        username: socket.username
      }
    });
  });
});
