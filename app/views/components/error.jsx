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
    setTimeout(ErrorActions.shiftError, 2000);
  },

  render: function () {
    var erT = (new Date()).getTime();
    return (
      <div className="error__list">
        {this.state.errors.map(function (error) {
          return (
            <div className="error__item" key={erT}>{error}</div>
          )
        })}
      </div>
    );
  }

});

module.exports = ErrorComponent;
