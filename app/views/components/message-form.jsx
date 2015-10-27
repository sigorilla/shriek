var MessageFormComponent = function (socket) {
  var MessagesStore = require('./../../stores/MessagesStore')(socket);
  var ErrorActions = require('./../../actions/ErrorActions');

  var ChannelsStore = require('./../../stores/ChannelsStore')(socket);

  var MessageForm = React.createClass({
    getInitialState: function () {
      return {
        typing: false,
        lastTypingTime: 0,
        FReader: undefined,
        selectedFile: undefined,
        attachments: [],
        loadingAttach: false,
        channelsStore: ChannelsStore.getState()
      }
    },

    componentDidMount: function () {
      ChannelsStore.listen(this.onChange);
      var _this = this;

      socket.on('file more', function (data) {
        _this.refs.progressAttach.getDOMNode().style.width = data.percent + '%';
        var place = data.place * 524288; //The Next Blocks Starting Position
        var newfile; //The Variable that will hold the new Block of Data
        var file = _this.state.selectedFile;
        if (file.slice) {
          newfile = file.slice(place, place + Math.min(524288, (file.size - place)));
        } else if (file.webkitSlice) {
          newfile = file.webkitSlice(place, place + Math.min(524288, (file.size - place)));
        } else {
          newfile = file.mozSlice(place, place + Math.min(524288, (file.size - place)));
        }
        _this.state.FReader.readAsBinaryString(newfile);
      });

      socket.on('file done', function (data) {
        // catch err
        if (data.status === 'ok') {
          var tmp = _this.state.attachments;
          tmp.push(data.attach);
          _this.setState({attachments: tmp});
        } else {
          ErrorActions.addError(data.error_message);
        }
        _this.refs.submitButton.getDOMNode().removeAttribute('disabled');
        _this.setState({loadingAttach: false});
      });

      socket.on('reconnect', function () {
        if (_this.state.loadingAttach) {
          ErrorActions.addError('Ошибка загрузки. Повторите попытку.');
          _this.refs.submitButton.getDOMNode().removeAttribute('disabled');
          _this.setState({loadingAttach: false});
        }
      });
    },

    componentWillUnmount: function () {
      ChannelsStore.unlisten(this.onChange);
    },

    onChange: function (state) {
      this.setState({channelsStore: state});
    },

    handleSubmit: function (e) {
      e.preventDefault();
      var _this = this; // чтобы потом найти текстовое поле
      var submitButton = this.refs.submitButton.getDOMNode(); // получаем кнопку
      if (!this.state.loadingAttach) {
        var text = this.refs.text.getDOMNode().value; // получаем текст
        submitButton.setAttribute('disabled', 'disabled');
        var message = {
          text: text,
          attachments: _this.state.attachments
        }
        this.props.submitMessage(message, function (err) { // вызываем submitMessage, передаем колбек
          if (err) {
            ErrorActions.addError(err);
          } else {
            _this.refs.text.getDOMNode().value = '';
            _this.setState({attachments: []});
          }
          submitButton.removeAttribute('disabled');
        });
      } else {
        ErrorActions.addError('Файл еще грузиться. Пожалуйста, подождите.');
      }
    },

    resize: function() {
      var textarea = this.refs.text.getDOMNode();
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight > 105 ? 105 : textarea.scrollHeight + 2)+'px';
    },

    handleKeyDown: function (e) {
      var _this = this;
      var pressSubmit = !(e.metaKey || e.ctrlKey) && e.keyCode === 13;
      var pressNewLine = (e.metaKey || e.ctrlKey) && e.keyCode === 13;

      if (pressSubmit) {
        this.handleSubmit(e);
      }

      if (pressNewLine) {
        var area = this.refs.text.getDOMNode();
        if (area.selectionStart || area.selectionStart == '0') {
          var start = area.selectionStart;
          var end = area.selectionEnd;
          area.value = area.value.substring(0, start) +
            '\n' + area.value.substring(end, area.value.length);
          area.setSelectionRange(start + 1, start + 1);
        }
      }

      this.resize();

      // typing
      if (!_this.state.typing) {
        _this.setState({typing: true});
        socket.emit('user start typing');
      }
      _this.setState({lastTypingTime: (new Date()).getTime()});

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - _this.state.lastTypingTime;
        if (timeDiff >= 500 && _this.state.typing) {
          socket.emit('user stop typing');
          _this.setState({typing: false});
        }
      }, 500);

      // mention
      $(_this.refs.text.getDOMNode()).atwho({
        at: '@',
        data: _this.state.channelsStore.userList.map(function (user) {
          return user.username
        })
      });
      // https://github.com/jakiestfu/Mention.js
      // .mention({
      //   queryBy: ['name', 'username'],
      //   users: _this.state.channelsStore.userList.map(function (user) {
      //     return {
      //       username: user.username,
      //       name: [user.setting.first_name, user.setting.last_name].join(' '),
      //       image: user.setting.image
      //   })
      // });
    },

    handleAddFile: function (e) {
      this.refs.attachment.getDOMNode().click();
    },

    handleFileSelect: function (e) {
      e.preventDefault();
      var file = e.target.files[0];
      this.setState({selectedFile: file});
      var name = localStorage.userName + (new Date()).getTime().toString();
      var FILE_SIZE = 10485760;

      if (!this.state.loadingAttach && this.state.attachments.length < 5 &&
        file && file.size <= FILE_SIZE && window.File && window.FileReader) {
        var FReader = new FileReader();

        this.refs.submitButton.getDOMNode().setAttribute('disabled', 'disabled');
        FReader.onload = function (event) {
          socket.emit('file upload', {data: event.target.result, name: name});
        }
        this.setState({FReader: FReader});
        this.setState({loadingAttach: true});
        socket.emit('file start', {
          name: name,
          size: file.size,
          filename: file.name,
          type: file.type
        });
      }

      if (file) {
        if (this.state.loadingAttach) {
          ErrorActions.addError('Файл еще грузиться. Пожалуйста, подождите.');
        }
        if (file.size > FILE_SIZE) {
          ErrorActions.addError('Слишком большой файл. Максимальный размер — 10 МБ.');
        }
        if (this.state.attachments.length >= 5) {
          ErrorActions.addError('Максимальное количество файлов в сообщении: 5.');
        }
      }
    },

    handleRemoveAttach: function (e) {
      e.preventDefault();
      var _this = this;

      try {
        socket.emit('file remove', {key: e.target.dataset.s3});

        var tmp = _this.state.attachments.filter(function (attach) {
          return attach.name !== e.target.dataset.attach;
        });
        this.setState({attachments: tmp});
      } catch (er) {}
    },

    render: function () {
      var _this = this;
      var pluginKey = 0;
      var messagePlugins = this.props.plugins || [];
      var typingUsers = MessagesStore.getState().typingUsers;
      var showTypingUsers = typingUsers.slice(0, 3).map(function (username) {
        return '<strong>' + username + '</strong>';
      });
      var msgTypingUsers = showTypingUsers.join(', ');
      var moreTyping = (typingUsers.length > 3) ? (' и еще ' + (typingUsers.length - 3) + ' человек') : '';
      msgTypingUsers += (typingUsers.length > 1) ? (moreTyping + ' печатают...') : ' печатает...';
      msgTypingUsers = (typingUsers.length > 0) ? msgTypingUsers : 'Прекрасного тебе дня, человек!';

      var fileAllow = window.File && window.FileReader;

      var classesBtnAttach = ['fa', 'fa-lg'];
      if (this.state.loadingAttach) {
        classesBtnAttach.push('fa-circle-o-notch', 'fa-spin');
      } else {
        classesBtnAttach.push('fa-plus');
      }

      return (
        <div className="send">
          {this.state.loadingAttach && (
            <div className="send__attachment_progress" ref="progressAttach"></div>
          )}
          <div className="send__attachments">
            {_this.state.attachments.map(function (attach) {
              return (
              <div className="send__attachments_item" key={attach.name}>
                <a>{attach.name}</a>
                <i className="fa fa-remove fa-lg" data-attach={attach.name} data-s3={attach.s3_key} onClick={_this.handleRemoveAttach}></i>
              </div>
              )
            })}
          </div>
          <div
            className="send__info"
            dangerouslySetInnerHTML={{__html: msgTypingUsers}} />
          <form className="send__form" onSubmit={this.handleSubmit} ref="formMsg">
            {fileAllow && (<div className="send__left send__attachment" onClick={this.handleAddFile}>
                <i className={classesBtnAttach.join(' ')}></i>
                <input type="file" ref="attachment" className="hidden" onChange={this.handleFileSelect} />
            </div>)}
            <textarea className="send__text" onKeyDown={this.handleKeyDown} onKeyUp={this.resize} onInput={this.resize} name="text" ref="text" placeholder="Сообщение" autoFocus required rows="1" />
            <div className="send__plugins">
              {messagePlugins.map(function (PluginComponent) {
                pluginKey++;
                return <PluginComponent key={pluginKey} />;
              })}
            </div>
            <div className="send__right">
              <button className="send__button btn" type="submit" ref="submitButton">
                <i className="fa fa-paper-plane fa-lg"></i>
              </button>
            </div>
          </form>
        </div>
      );
    }
  });

  return MessageForm;
};

module.exports = MessageFormComponent;
