var ErrorStoreObj = null;
var ErrorStoreFunction = function () {

  var alt_obj = require('./../controllers/alt_obj');
  var ErrorActions = require('./../actions/ErrorActions');

  function ErrorStore() {
    this.displayName = 'ErrorStore';
    this.errors = [];
    this.bindListeners({
      addError: ErrorActions.ADD_ERROR,
      shiftError: ErrorActions.SHIFT_ERROR
    });
  }

  ErrorStore.prototype.addError = function (error) {
    this.errors.push(error);
  };

  ErrorStore.prototype.shiftError = function () {
    this.errors.shift();
  };

  if (ErrorStoreObj === null) {
    ErrorStoreObj = alt_obj.createStore(ErrorStore);
  }
  return ErrorStoreObj;
};

module.exports = ErrorStoreFunction;
