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
      var cx = require('classnames');
      var classesSelf = cx({
        'msg__author-name': true,
        'msg__author-self': localStorage.userName == this.props.username
      });

      return (
        <span className="msg__author">
          <span className={classesSelf} onClick={this.showUserInfo}>{this.props.username}</span>
          <span className="msg__author-divider">:</span>
        </span>
      );
    }
  });

  return MessageAuthor;
};

module.exports = MessageAuthorComponent;

