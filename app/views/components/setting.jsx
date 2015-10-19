var SettingComponent = function (socket) {

  var ModalComponent = require('../../views/components/modal.jsx');

  var SettingBlock = React.createClass({

    getInitialState: function () {
      return {
        email: '',
        image: '',
        first_name: '',
        last_name: '',
        sex: '',
        description: '',
        opened: false
      };
    },

    componentDidMount: function () {
      var _this = this;
      var username;

      window.addEventListener('openSetting', function () {
        _this.setState({opened: true});
      });

      socket.on('user info', function (data) {
        if (data.status === 'ok') {
          _this.setState({
            email: data.user.setting.email,
            image: data.user.setting.image,
            first_name: data.user.setting.first_name,
            last_name: data.user.setting.last_name,
            description: data.user.setting.description,
            sex: data.user.setting.sex
          });
        }
      });

      socket.on('user update', function (data) {
        if (data.status == 'ok') {
          socket.emit('user info', {username: data.user.username});
          _this.handleClose();
        }
      });
    },

    handleEmailChange: function (e) {
      this.setState({email: e.target.value});
    },

    handleImageChange: function (e) {
      this.setState({image: e.target.value});
    },

    handleFirstNameChange: function (e) {
      this.setState({first_name: e.target.value});
    },

    handleLastNameChange: function (e) {
      this.setState({last_name: e.target.value});
    },

    handleSexChange: function (e) {
      this.setState({sex: e.target.value});
    },

    handleDescriptionChange: function (e) {
      this.setState({description: e.target.value});
    },

    handleSave: function (e) {
      e.preventDefault();

      if (this.state != null) {
        socket.emit('user update', {
          username: socket.username,
          setting: {
            email: this.state.email,
            image: this.state.image,
            first_name: this.state.first_name,
            last_name: this.state.last_name,
            description: this.state.description,
            sex: this.state.sex
          }
        });
      }
    },

    handleClose: function (e) {
      this.setState({opened: false});
    },

    render: function () {
      var formSetting = (
        <form className="form setting" onSubmit={this.handleSave}>
          <div className="form__row">
            <label className="form__label"><i className="fa fa-user"></i></label>
            <input className="form__text"type="text" id="inputNick" placeholder="Username" value={localStorage.userName} readonly />
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputFirstName"><i className="fa fa-edit"></i></label>
            <input className="form__text" onChange={this.handleFirstNameChange} type="text" id="inputFirstName" placeholder="Имя" value={this.state.first_name} />
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputLastName"><i className="fa fa-edit"></i></label>
            <input className="form__text" onChange={this.handleLastNameChange} type="text" id="inputLastName" placeholder="Фамилия" value={this.state.last_name} />
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputEmail"><i className="fa fa-envelope-o"></i></label>
            <input className="form__text" onChange={this.handleEmailChange} type="email" id="inputEmail" placeholder="Email" value={this.state.email} />
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputImage"><i className="fa fa-picture-o"></i></label>
            <input className="form__text" onChange={this.handleImageChange} type="url" id="inputImage" placeholder="Ваш аватар" value={this.state.image} />
          </div>
          <div className="form__row form__row-radio">
            <span className="form__label"><i className="fa fa-venus-mars"></i></span>
            <input className="form__radio" name="sex" onChange={this.handleSexChange} type="radio" id="inputSexMale" value="male" defaultChecked={this.state.sex === 'male'} />
            <label htmlFor="inputSexMale" className="btn">
              <i className="fa fa-mars"></i>
            </label>
            <input className="form__radio" name="sex" onChange={this.handleSexChange} type="radio" id="inputSexFemale" value="female" defaultChecked={this.state.sex === 'female'} />
            <label htmlFor="inputSexFemale" className="btn">
              <i className="fa fa-venus"></i>
            </label>
          </div>
          <div className="form__row">
            <label className="form__label" htmlFor="inputDescription"><i className="fa fa-edit"></i></label>
            <textarea className="form__textarea" onChange={this.handleDescriptionChange} id="inputDescription" placeholder="Описание" value={this.state.description} />
          </div>
        </form>
      );

      var footer = (
        <div>
          <button className="btn" onClick={this.handleSave} type="submit">
            <i className="fa fa-floppy-o"></i> Сохранить
          </button>
          <span> </span>
          <button className="btn" onClick={this.handleClose} type="button">Закрыть</button>
        </div>
      );

      return (
        <div>
          {this.state.opened == true && (
            <ModalComponent header="Настройки профиля" body={formSetting} footer={footer} />
          )}
        </div>
      );
    }

  });

  return SettingBlock;
};

module.exports = SettingComponent;
