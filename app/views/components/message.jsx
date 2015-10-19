var ChatComponent = function (socket) {
  var MessagesStore = require('./../../stores/MessagesStore')(socket); // подключаем стор
  var MessagesActions = require('./../../actions/MessagesActions'); // подключаем экшены
  var ErrorActions = require('./../../actions/ErrorActions');

  var ChannelUsers = require('../../views/components/channelUsers.jsx')(socket);

  var ChatBox = React.createClass({
    getInitialState: function () {
      return MessagesStore.getState(); // теперь мы возвращаем стор, внутри которого хранятся значения стейтов по умолчанию
    },

    componentDidMount: function () {
      MessagesStore.listen(this.onChange); // подписываемся на изменения store
      MessagesActions.initMessages(socket);

      window.shriek = {};
      window.shriek.stopscroll = false;
    },

    componentWillUnmount: function () {
      MessagesStore.unlisten(this.onChange); // отписываемся от изменений store
    },

    // эта функция выполняется когда store триггерит изменения внутри себя
    onChange: function (state) {
      this.setState(state);
    },

    submitMessage: function (data, callback) {
      if (data.text) {
        var message = {
          username: socket.username,
          channel: socket.activeChannel,
          text: data.text,
          type: 'text',
          attachments: data.attachments
        };

        socket.emit('message send', message);
        callback();
      } else {
        callback('Enter message, please!');
      }

    },

    render: function () {
      return (
        <div className="msg">
          <div className="msg__loading"><i className="fa fa-circle-o-notch fa-spin"></i></div>
          <div className="msg__wrap">
            <div className="msg__body">
              <MessagesList messages={this.state.messages} hideMore={this.state.hideMore} />
            </div>
            <ChannelUsers />
          </div>
          <MessageForm submitMessage={this.submitMessage} plugins={this.state.plugins}/>
        </div>
      );
    }
  });

  var MessagesList = React.createClass({
    getInitialState: function () {
      return ( { } );
    },

    componentDidMount: function () {
      var msglist = $(React.findDOMNode(this.refs.msg_list));
    },

    handleScroll: function () {
      if (!this.props.stopScroll) {
        var node = this.getDOMNode();

        if (node.scrollTop === 0) {
          if (this.state.scrollValue == 0) {
            this.state.startScrollHeight = node.scrollHeight;
          }

          this.state.scrollValue++;
          MessagesActions.getMessages(socket, this.state.scrollValue);
          this.state.scrollHeight = this.state.startScrollHeight;
          this.forceUpdate();
        }
      }
    },

    componentDidUpdate: function () {

    },
    clickMoreHandler: function() {
      var skip = MessagesStore.getState().skip; // подписываемся на изменения store
      MessagesActions.getMessages(socket, skip);
    },

    render: function () {
      var Messages = (<div>Loading messages...</div>);

      if (this.props.messages) {
        Messages = this.props.messages.map(function (message) {
          return (<Message message={message} key={message._id} />);
        });
      }

      var classes = 'msg__load_more ' + (this.props.hideMore ? 'hidden' : '');
      return (
        <div className="msg__list" ref="msglist">
          <div className={classes} onClick={this.clickMoreHandler}>Загрузить еще</div>
          {Messages}
        </div>
      );
    }
  });

  var Message = React.createClass({
    render: function () {
      var classes = ['msg__item'];
      var message = this.props.message.text || this.props.message.raw;

      if (this.props.message.searched) {
        classes.push('msg__searched');
      }

      return (
        <div className={classes.join(' ')}>
          <MessageDate date={this.props.message.created_at}/>
          <span className="msg__author">{this.props.message.username}: </span>
          <div
            className="msg__text"
            dangerouslySetInnerHTML={{__html: message}} />
          <div className="msg__attachments">
          {this.props.message.attachments.map(function (attach) {
            return (
            <div className="msg__attachments_item" key={'msg_' + attach._id}>
              <a href={attach.url} target="_blank">{attach.name}</a>
              {attach.type === 'image' && (
                <img src={attach.url} />
              )}
            </div>
            )
          })}
          </div>
        </div>
      );
    }
  });

  var MessageForm = React.createClass({
    getInitialState: function () {
      return {
        typing: false,
        lastTypingTime: 0,
        FReader: undefined,
        selectedFile: undefined,
        attachments: [],
        loadingAttach: false
      }
    },

    componentDidMount: function () {
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

      socket.on('file done', function (attach) {
        _this.refs.submitButton.getDOMNode().removeAttribute('disabled');
        var tmp = _this.state.attachments;
        tmp.push(attach);
        _this.setState({attachments: tmp});
        _this.setState({loadingAttach: false});
      });
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
          _this.refs.text.getDOMNode().value = '';
          _this.setState({attachments: []});
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
        if ( (area.selectionStart) || (area.selectionStart == '0') ) {
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
    },

    handleAddFile: function (e) {
      this.refs.attachment.getDOMNode().click();
    },

    handleFileSelect: function (e) {
      e.preventDefault();
      var file = e.target.files[0];
      this.setState({selectedFile: file});
      var name = localStorage.userName + (new Date()).getTime().toString();
      if (!this.state.loadingAttach && this.state.attachments.length < 5 &&
        file && file.size <= 10485760 && window.File && window.FileReader) {
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
          filename: file.name.replace(/^\.+/, '')
        });
      }
      if (file) {
        if (this.state.loadingAttach) {
          ErrorActions.addError('Файл еще грузиться. Пожалуйста, подождите.');
        }
        if (file.size > 10485760) {
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

      var tmp = _this.state.attachments.filter(function (attach) {
        return attach.name !== e.target.dataset.attach;
      });
      this.setState({attachments: tmp});
    },

    render: function () {
      var _this = this;
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
                <i className="fa fa-remove fa-lg" data-attach={attach.name} onClick={_this.handleRemoveAttach}></i>
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
                return <PluginComponent />;
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

  var MessageDate = React.createClass({
    render: function () {
      var localDate = new Date(this.props.date);
      var hour = localDate.getHours();
      var minutes = localDate.getMinutes();
      var date = ('0' + hour).slice(-2) + ':' + ('0' + minutes).slice(-2);
      var day = localDate.getDate();
      var month = localDate.getMonth();
      var fullDate = date + ' ' + ('0' + day).slice(-2) + '/' +
        ('0' + month).slice(-2) + '/' + localDate.getFullYear();
      return (
        <span className='msg__date' title={fullDate}>{date}</span>
      )
    }
  });

  return ChatBox;
};

module.exports = ChatComponent;
