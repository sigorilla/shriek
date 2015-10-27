var mocha = require('mocha');
var chai = require('chai');
var should = chai.should();
var port = process.env.PORT || 5000;
var io = require('socket.io-client');

describe('Message', function () {
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
    socket = io.connect('http://localhost:' + port, options);

    socket.on('connect', function () {
      done();
    });
  });

  afterEach(function (done) {
    if (socket.connected) {
      socket.disconnect();
    }
    done();
  });

  it('send', function (done) {
    socket.once('message send', function (data) {
      data.status.should.equal('ok');
      data.message.username.should.equal(testuser.username);
      data.message.text.should.be.a('String');

      done();
    });

    socket.once('user enter', function (data) {
      data.status.should.equal('ok');

      socket.emit('message send', {
        user: testuser.username,
        text: testmsg
      });
    });

    socket.emit('user enter', testuser);
  });

  it('send without login', function (done) {

    socket.once('message send', function (data) {
      data.status.should.equal('error');

      done();
    });

    socket.emit('message send', {
      user: testuser.username,
      text: testmsg
    });

  });

});
