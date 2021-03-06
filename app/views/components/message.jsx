var ChatComponent = function (socket) {
  var MessagesStore = require('./../../stores/MessagesStore')(socket); // подключаем стор
  var MessagesActions = require('./../../actions/MessagesActions'); // подключаем экшены
  var ErrorActions = require('./../../actions/ErrorActions');

  var ChannelsStore = require('./../../stores/ChannelsStore')(socket);
  var ChannelUsers = require('../../views/components/channelUsers.jsx')(socket);
  var MessageAuthor = require('../../views/components/message-author.jsx')(socket);
  var MessageForm = require('../../views/components/message-form.jsx')(socket);

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
        if (data.text.length > 1000) {
          callback('Максимальная длина сообщения — 1000 символов');
        } else {
          var message = {
            username: localStorage.userName,
            channel: socket.activeChannel,
            text: data.text,
            type: 'text',
            attachments: data.attachments
          };

          socket.emit('message send', message);
          callback();
        }
      } else {
        callback('Введите сообщение, пожалуйста!');
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

    componentDidUpdate: function () {},

    clickMoreHandler: function() {
      var skip = MessagesStore.getState().skip;
      MessagesActions.getMessages(socket, skip);
    },

    render: function () {
      var Messages = (<div>Загрузка сообщений...</div>);

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

      var Attachments = this.props.message.attachments.map(function (attach) {
        return (<Attach attach={attach}  key={'msg_' + attach._id} />);
      });

      return (
        <div className={classes.join(' ')}>
          <MessageDate date={this.props.message.created_at}/>
          <MessageAuthor username={this.props.message.username} />
          <div
            className="msg__text"
            dangerouslySetInnerHTML={{__html: message}} />
          <div className="msg__attachments">{Attachments}</div>
        </div>
      );
    }
  });

  var Attach = React.createClass({
    newImage: function () {

    },

    render: function () {
      var attachIcon = ['fa', 'file', this.props.attach.type, 'o']
        .join('-')
        .replace('--', '-');

      return (<div className="msg__attachments_item">
        <a href={this.props.attach.url} target="_blank">
          <span className={['fa', attachIcon].join(' ')}></span>
          <span>{this.props.attach.name}</span>
        </a>
        {this.props.attach.type === 'image' && (
          <AttachImage src={this.props.attach.url} updateLink={this.newImage} />
        )}
      </div>);
    }
  });

  var AttachImage = React.createClass({
    componentDidMount: function () {
      var image = this.refs.image.getDOMNode();
      image.crossOrigin = 'Anonymous';
      image.src = this.props.src;
    },

    handleLoad: function (e) {
      try {
        var canvas = fx.canvas();
      } catch (err) {
        return;
      }

      var image = this.refs.image.getDOMNode();
      var texture = canvas.texture(image);

      canvas.draw(texture).update().replace(image);

      var filters = [
        function (x, y) {
          canvas
            .draw(texture)
            .hexagonalPixelate(0, 0, 3)
            .swirl(x, y, 200, 2)
            .update();
        },
        function (x, y) {
          canvas
            .draw(texture)
            .sepia(0.5)
            .bulgePinch(x, y, 100, -0.5)
            .update();
        },
        function (x, y) {
          canvas
            .draw(texture)
            .unsharpMask(22, 2)
            .swirl(x, y, 100, 1)
            .update();
        },
        function (x, y) {
          canvas
            .draw(texture)
            .vignette(0.9, 0.6)
            .dotScreen(x, y, 0, 4.53)
            .update();
        },
        function (x, y) {
          canvas
            .draw(texture)
            .hueSaturation(-0.4, 0.56)
            .tiltShift(
              $(canvas).width() / 2,
              $(canvas).height() / 2,
              x,
              y,
              15,
              200)
            .update();
        },
        function (x, y) {
          canvas.draw(texture).zoomBlur(x, y, 0.11).update();
        },
      ];

      var n = Math.floor(Math.random() * filters.length);
      filters[n]($(canvas).width() / 2, $(canvas).height() / 2);
      $(canvas).mousemove(function (e) {
        var offset = $(canvas).offset();
        var x = e.pageX - offset.left;
        var y = e.pageY - offset.top;
        filters[n](x, y);
      });

    },

    render: function () {
      return (<img ref="image" onLoad={this.handleLoad} />);
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
