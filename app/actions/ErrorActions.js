var altObj = require('./../controllers/alt_obj');

var ErrorActions = altObj.createActions({
  displayName: 'ErrorActions',

  addError: function (error) {
    this.dispatch(error);
  },

  shiftError: function () {
    this.dispatch();
  }

});

module.exports = altObj.createActions('ErrorActions', ErrorActions);
