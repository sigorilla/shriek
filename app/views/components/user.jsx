var UserComponent = function (socket) {
  var UserStore = require('./../../stores/UserStore')(socket);
  var UserActions = require('./../../actions/UserActions');

  var ModalComponent = require('../../views/components/modal.jsx');

  var User = React.createClass({
    getInitialState: function () {
      return UserStore.getState();
    },

    componentDidMount: function () {
      UserStore.listen(this.onChange);
    },

    componentWillUnmount: function () {
      UserStore.unlisten(this.onChange);
    },

    onChange: function (state) {
      this.setState(state);
    },

    render: function () {
      var defaultValue = '—';
      var body;
      if (this.state.loaded) {
        body = (
          <div className="modal__user">
            <div className="modal__user_img">
            {this.state.user.setting.image && (
              <img src={this.state.user.setting.image} alt="Аватар" />
            )}
            {!this.state.user.setting.image && (
              <span className="fa fa-user fa-4x"></span>
            )}
            </div>
            <div className="form__row">
              <span><strong>Имя:</strong></span>
              <span>{this.state.user.setting.first_name || defaultValue}</span>
            </div>
            <div className="form__row">
              <span><strong>Фамилия:</strong></span>
              <span>{this.state.user.setting.last_name || defaultValue}</span>
            </div>
            <div className="form__row">
              <span><strong>Почта:</strong></span>
              <span>{this.state.user.setting.email || defaultValue}</span>
            </div>
            <div className="form__row">
              <span><strong>Описание:</strong></span>
              <span>{this.state.user.setting.description || defaultValue}</span>
            </div>
          </div>
        );
      } else {
        body = (
          <span className="fa fa-circle-o-notch fa-spin fa-2x"></span>
        );
      }
      var footer = (
        <div>
          <button className="btn" onClick={UserActions.hideUserInfo} type="button">Закрыть</button>
        </div>
      );

      return (
        <div>
          {this.state.showInfo === true && (
            <ModalComponent header={this.state.username} body={body} footer={footer} />
          )}
        </div>
      );
    }
  });

  return User;
};

module.exports = UserComponent;

