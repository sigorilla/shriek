var ErrorStore = require('./../../stores/ErrorStore')();
var ErrorActions = require('./../../actions/ErrorActions');

var ErrorComponent = React.createClass({

  getInitialState: function () {
    return ErrorStore.getState();
  },

  componentDidMount: function () {
    ErrorStore.listen(this.onChange);
  },

  componentWillUnmount: function () {
    ErrorStore.unlisten(this.onChange);
  },

  onChange: function (state) {
    this.setState(state);
    if (this.state.errors.length > 0) {
      setTimeout(ErrorActions.shiftError, 2000);
    }
  },

  render: function () {
    return (
      <div className="error__list">
        {this.state.errors.map(function (error, index) {
          return (
            <div className="error__item" key={index}>{error}</div>
          )
        })}
      </div>
    );
  }

});

module.exports = ErrorComponent;
