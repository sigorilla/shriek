var LoginDefault = function (socket) {

// askLogin component
  var LoginDefault = React.createClass({

    render: function () {
      return (
        <div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputUsername"><i className="fa fa-user"></i></label>
            <input className={this.props.classUser} onChange={this.props.handleName} type="username" id="inputUsername" placeholder="Логин"/>
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputPassword"><i className="fa fa-asterisk"></i></label>
            <input className={this.props.classPass} onChange={this.props.handlePassword} type="password" id="inputPassword" placeholder="Пароль"/>
          </div>
          <button className="btn" type="submit">Войти</button>
          <div className="form__row">или используйте соцсети:</div>
          <div className="form__row">
            <a href="/auth/twitter"><i className="fa fa-twitter-square fa-2x"></i></a>
            <a href="/auth/google"><i className="fa fa-google-plus-square fa-2x"></i></a>
            <a href="/auth/github"><i className="fa fa-github-square fa-2x"></i></a>
          </div>
        </div>
      );

    }
  });

  return LoginDefault;
};

module.exports = LoginDefault;
