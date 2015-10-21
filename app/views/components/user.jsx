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
              <strong>Имя: </strong>
              <span>{this.state.user.setting.first_name}</span>
            </div>
            <div className="form__row">
              <strong>Фамилия: </strong>
              <span>{this.state.user.setting.last_name}</span>
            </div>
            <div className="form__row">
              <strong>Почта: </strong>
              <span>{this.state.user.setting.email}</span>
            </div>
            <div className="form__row">
              <strong>Описание: </strong>
              <span>{this.state.user.setting.description}</span>
            </div>
          </div>
        );
      } else {
        body = (
          <div className="form__row">
            <span className="fa fa-circle-o-notch fa-spin fa-2x"></span>
          </div>
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

