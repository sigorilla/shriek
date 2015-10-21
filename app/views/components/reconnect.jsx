var ReconnectComponent = function (socket) {

  var ReconnectComponent = React.createClass({
    getInitialState: function () {
      return {
        reconnecting: false
      };
    },

    componentDidMount: function () {
      var _this = this;

      socket.on('connect_error', function () {
        _this.setState({
          reconnecting: true
        });
      });

      socket.on('reconnect', function () {
        _this.setState({
          reconnecting: false
        });

        var storageUser = localStorage.userName;
        var storagePass = localStorage.userPass;

        if (storageUser != null && storagePass != null) {
          socket.emit('user enter', {
            username: storageUser,
            password: storagePass
          });
        }
      });
    },

    render: function () {
      var cx = require('classnames');
      var classes = cx({
        'reconnecting': true,
        'active': this.state.reconnecting
      });

      return (
        <div className={classes}>
          <div className="reconnecting__msg">
            <span className="fa fa-circle-o-notch fa-spin fa-4x"></span>
            <span>Потеря соединения. Пожалуйста, подождите...</span>
          </div>
        </div>
      );
    }
  });

  return ReconnectComponent;
};

module.exports = ReconnectComponent;
