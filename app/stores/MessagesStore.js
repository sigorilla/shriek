var MessagesStoreObj = null;
var MessagesStoreFunction = function () {

  var alt_obj = require('./../controllers/alt_obj');
  var MessagesActions = require('./../actions/MessagesActions');

  function MessagesStore() {
    this.displayName = 'MessagesStore'; // обязательное поле для ES5
    this.messages = []; // это бывший initState у компонента
    this.typingUsers = [];
    this.plugins = [];
    this.hideMore = false;
    this.bindListeners({ // это биндинги на события экшена, сработает только если внутри функции экшена есть dispatch()
      updateMessages: MessagesActions.UPDATE_MESSAGES,  // ключ хеша — функция стора, значение — функция экшена
      pushMessage: MessagesActions.PUSH_MESSAGE,
      setSearchedMessage: MessagesActions.SET_SEARCHED_MESSAGE,
      updateSkip: MessagesActions.UPDATE_SKIP,
      hideMoreButton: MessagesActions.HIDE_MORE_BUTTON,
      registerPlugin: MessagesActions.REGISTER_PLUGIN,
      addTypingUser: MessagesActions.ADD_TYPING_USER,
      removeTypingUser: MessagesActions.REMOVE_TYPING_USER,
      fullReset: MessagesActions.FULL_RESET
    });
  }

  // тут описываем все функции стора (в основном это присваение стейта нового значения)
  MessagesStore.prototype.pushMessage = function (fetched_data) {
    var messagesAll = this.messages;
    messagesAll.push(fetched_data.message);
    this.messages = messagesAll;
  };

  MessagesStore.prototype.updateMessages = function (fetched_data) {
    if (fetched_data.force) {
      this.messages = fetched_data.messages;
    } else {
      var messagesAll = fetched_data.messages;
      this.messages.map(function (message) {
        messagesAll.push(message);
      });
      this.messages = messagesAll;
    }
  };

  MessagesStore.prototype.setSearchedMessage = function (_ids) {
    var listOfMessages = [];

    this.messages.map(function (message) {
      message.searched = (_ids == message._id ? true : false);
      listOfMessages.push(message);
    });

    this.messages = listOfMessages;
  };

  MessagesStore.prototype.updateSkip = function (skip) {
    this.skip = skip;
  };

  MessagesStore.prototype.hideMoreButton = function (val) {
    this.hideMore = val;
  };

  MessagesStore.prototype.registerPlugin = function (plugin) {
    this.plugins.push(plugin);
  };

  MessagesStore.prototype.addTypingUser = function (username) {
    if (this.typingUsers.indexOf(username) == -1) {
      this.typingUsers.push(username);
    }
  };

  MessagesStore.prototype.removeTypingUser = function (username) {
    var position = this.typingUsers.indexOf(username)
    if ( position >= 0) {
      this.typingUsers.splice(position, 1);
    }
  };

  MessagesStore.prototype.fullReset = function () {
    this.messages = [];
    this.typingUsers = [];
    this.plugins = [];
    this.hideMore = false;
  }

  if (MessagesStoreObj === null) {
    MessagesStoreObj = alt_obj.createStore(MessagesStore);
  }
  return MessagesStoreObj;

};

module.exports = MessagesStoreFunction;
