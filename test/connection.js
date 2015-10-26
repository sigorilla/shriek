var mocha = require('mocha');
var chai = require('chai');
var should = chai.should();
var port = process.env.PORT || 5000;
var io = require('socket.io-client');
var exec = require('child_process').exec;
var server;

describe('Connection', function () {
  var socket;
  var options = {
    transports: ['websocket'],
    'force new connection': true
  };

  var testuser = {
    username: 'testuser',
    password: 'testpass'
  };

  var testmsg = 'Echo';

  beforeEach(function (done) {
    server = exec('heroku local', function (err, stdout, stderr) {
      socket = io.connect('http://localhost:' + port, options);

      socket.on('connect', function () {
        done();
      });
    });
  });

  afterEach(function (done) {
    if (socket.connected) {
      socket.disconnect();
      server.kill();
    }
    done();
  });

  it('should be true', function (done) {
    socket.connected.should.equal(true);

    done();
  });

  describe('User', function () {
    it('enters', function (done) {
      socket.once('user enter', function (data) {
        data.status.should.equal('ok');
        data.user.username.should.equal(testuser.username);

        done();
      });

      socket.emit('user enter', testuser);
    });

    it('enters with wrong data', function (done) {
      socket.once('user enter', function (data) {
        data.status.should.equal('error');

        done();
      });

      socket.emit('user enter', {
        username: '1',
        password: '1'
      });
    });
  });

});
