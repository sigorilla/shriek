var MessageAuthorComponent = function (socket) {
  var UserActions = require('./../../actions/UserActions');

  var MessageAuthor = React.createClass({
    getInitialState: function () {
      return {};
    },

    showUserInfo: function () {
      UserActions.setUser(this.props.username);
    },

    render: function () {
      return (
        <span className="msg__author" onClick={this.showUserInfo}>
          <span className="msg__author-name">{this.props.username}</span>
          <span className="msg__author-divider">:</span>
        </span>
      );
    }
  });

  return MessageAuthor;
};

module.exports = MessageAuthorComponent;

