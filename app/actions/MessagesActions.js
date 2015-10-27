var alt_obj = require('./../controllers/alt_obj');
var actualDate = false;

var MessagesActions = alt_obj.createActions({

  displayName: 'MessagesActions', // обязательное поле в ES5

  registerPlugin: function (plugin) {
    this.dispatch(plugin);
  },

  updateActualDateOnChangeChannel: function() {
    actualDate = new Date();
  },

  updateMessages: function (data) {  // на эту функцию мы будем подписываться в сторе
    if (data.messages.length < 20) { // если сообщений получено меньше чем 50, скрыть кнопку "еще"
      this.actions.hideMoreButton(true);
    }
    if (data.force == true) {
      this.actions.hideMoreButton(data.hideMore);
      if (data.messages.length > 0) {
        actualDate = new Date(data.messages[0].created_at);
      } else {
        actualDate = new Date();
      }
      this.skip = 0;
    }
    this.dispatch(data); // это блин ТРИГГЕР, на который реагирует стор
  },

  pushMessage: function (message) {
    this.dispatch(message);
  },

  setSearchedMessage: function (_ids) {
    this.dispatch(_ids);
  },

  updateSkip: function (skip) {
    this.dispatch(skip);
  },

  hideMoreButton: function (val) {
    this.dispatch(val);
  },

  scrollChat: function (force) {
    if (window.shriek.stopscroll === false) {
      var _this = this;
      var msglist = $('.msg__list');
      var scroll = msglist.scrollTop();
      var height = parseInt(msglist.height());
      var scrollHeight = scroll + height;
      var allheight = 0;

      var heightCalc = new Promise(function (resolve, reject) {
        $('.msg__list > div:not(:last-child)').each(function (index, elem) {
          allheight += parseInt($(elem).outerHeight());
        });
        resolve(allheight);
      });

      heightCalc
        .then(function (allheight) {
          var tmpHeight = scroll + parseInt($('.msg__list > div:last-child').height());
          if (tmpHeight >= (allheight - height) || force === true) {
            $('.msg__list').animate(
              {scrollTop: allheight},
              500,
              'swing',
              function () {
                window.shriek.stopscroll = false;
              }
            );
          } else {
            setTimeout(function () {
              window.shriek.stopscroll = false;
            }, 100);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  },

  initMessages: function (socket) { // это функция инициализации, тут мы подписываемся на сообщение из сокета
    try {
      Notification.requestPermission(function (result) {});
    } catch (e) {
      console.warn('Your browser does not support notifications');
    }
    var _this = this;
    actualDate = false;

    socket.on('message send', function (data) {
      if (data.status === 'ok') {
        // notification API
        if (data.message.username !== localStorage.userName) {
          var ChannelsStore = require('./../stores/ChannelsStore')(socket);
          var author = ChannelsStore.state.userList.filter(function (user) {
            return user.username === data.message.username;
          })[0];

          try {
            new Audio('beep.mp3').play();
            var notify = new Notification(author.username, {
              tag: [data.message.channel, data.message._id].join('|'),
              body: data.message.raw,
              icon: author.setting.image
            });
            var notifyTimer;
            notify.onshow = function () {
              notifyTimer = setTimeout(function () {
                notify.close();
              }, 3000);
            };
            notify.onclick = function (event) {
              var gotoMessage = event.target.tag.split('|');
              _this.actions.highlightMessage(gotoMessage[1]);
              clearTimeout(notifyTimer);
              notify.close();
            };
          } catch (e) {
            console.warn('Something is wrong.');
          }
        }

        // проверяем, правда ли сообщение пришло в текущий чат?
        if (data.message.channel === socket.activeChannel) {
          _this.actions.pushMessage({message: data.message});
          _this.actions.scrollChat(true);
        }
      }
    });
    socket.on('channel get', function (data) {
      _this.actions.updateMessages(data);
      _this.actions.updateSkip(data.newSkip);
      if (data.hasOwnProperty('indata')) {
        setTimeout(function () {
          _this.actions.scrollChat(data.indata.scrollAfter || false);
        }, 1000);
      }
    });

    socket.on('user start typing', function (data) {
      if (data.status === 'ok') {
        if (data.user.username !== localStorage.userName) {
          _this.actions.addTypingUser(data.user.username);
        }
      }
    });

    socket.on('user stop typing', function (data) {
      if (data.status === 'ok') {
        if (data.user.username !== localStorage.userName) {
          _this.actions.removeTypingUser(data.user.username);
        }
      }
    });

    window.registerMessagePlugin = _this.actions.registerPlugin;
  },

  getMessages: function (socket, skip) {
    if (!actualDate) actualDate = new Date();
    socket.emit('channel get', {channel: socket.activeChannel, date: actualDate, skip: skip});
    socket.emit('channel info', {slug: socket.activeChannel});
  },

  highlightMessage: function(_id) {
    this.actions.setSearchedMessage(_id);
  },

  addTypingUser: function (username) {
    this.dispatch(username);
  },

  removeTypingUser: function (username) {
    this.dispatch(username);
  },

  fullReset: function () {
    this.dispatch();
  }
});

// первый параметр имя экшена — обязательный в ES5
module.exports = alt_obj.createActions('MessagesActions', MessagesActions);
