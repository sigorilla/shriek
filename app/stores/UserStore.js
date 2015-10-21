var UserStoreObj = null;
var UserStoreFunction = function (socket) {

  var alt_obj = require('./../controllers/alt_obj');
  var UserActions = require('./../actions/UserActions');

  function UserStore() {
    this.displayName = 'UserStore';
    this.username = '';
    this.user = {};
    this.showInfo = false;
    this.loaded = false;
    this.bindListeners({
      setUser: UserActions.SET_USER,
      showUserInfo: UserActions.SHOW_USER_INFO,
      hideUserInfo: UserActions.HIDE_USER_INFO
    });
  }

  UserStore.prototype.setUser = function (username) {
    var _this = this;

    _this.username = username;
    _this.showInfo = true;

    socket.emit('user info', {username: this.username});
    socket.on('user info', function (data) {
      if (data.status === 'ok') {
        if (data.user.username === _this.username) {
          _this.user = data.user;
          _this.loaded = true;
          _this.emitChange();
        }
      }
    });
  };

  UserStore.prototype.showUserInfo = function () {
    this.showInfo = true;
  };

  UserStore.prototype.hideUserInfo = function () {
    this.username = '';
    this.user = {};
    this.showInfo = false;
    this.loaded = false;
  };

  if (UserStoreObj === null) {
    UserStoreObj = alt_obj.createStore(UserStore);
  }
  return UserStoreObj;
};

module.exports = UserStoreFunction;
