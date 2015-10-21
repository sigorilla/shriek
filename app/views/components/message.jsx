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

    componentDidUpdate: function () {},

    clickMoreHandler: function() {
      var skip = MessagesStore.getState().skip; // подписываемся на изменения store
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

      return (
        <div className={classes.join(' ')}>
          <MessageDate date={this.props.message.created_at}/>
          <MessageAuthor username={this.props.message.username} />
          <div
            className="msg__text"
            dangerouslySetInnerHTML={{__html: message}} />
          <div className="msg__attachments">
          {this.props.message.attachments.map(function (attach) {
            return (
            <div className="msg__attachments_item" key={'msg_' + attach._id}>
              <a href={attach.url} target="_blank">
                <span className="fa fa-file"></span>
                <span>{attach.name}</span>
              </a>
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
