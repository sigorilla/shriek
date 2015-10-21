var altObj = require('./../controllers/alt_obj');

var UserActions = altObj.createActions({
  displayName: 'UserActions',

  setUser: function (username) {
    this.dispatch(username);
  },

  showUserInfo: function () {
    this.dispatch();
  },

  hideUserInfo: function () {
    this.dispatch();
  }

});

module.exports = altObj.createActions('UserActions', UserActions);
