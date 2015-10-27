var LoginPassport = function (socket) {

  var LoginPassport = React.createClass({

    render: function () {
      return (
        <div>
          <h2>Установите пароль</h2>
          <div className="form__row">
            <label className="form__label" htmlFor="inputPassword"><i className="fa fa-asterisk"></i></label>
            <input className={this.props.classPass} onChange={this.props.handlePassword} type="password" id="inputPassword" placeholder="Пароль"/>
          </div>
          <button className="btn" type="submit">Войти</button>
        </div>
      );

    }
  });

  return LoginPassport;
};

module.exports = LoginPassport;
