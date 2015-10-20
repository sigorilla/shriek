var SearchResultComponent = function (socket) {

  var ChannelsStore = require('./../../stores/ChannelsStore')(socket); // подключаем стор
  var MessagesActions = require('./../../actions/MessagesActions'); // подключаем экшены

  var ModalComponent = require('../../views/components/modal.jsx');

  var SearchResultList = React.createClass({
    getInitialState: function () {
      return {};
    },

    handleClose: function() {
      this.props.handleClose();
    },

    render: function () {
      var _this = this;
      var Messages = (<div>Загрузка сообщений...</div>);
      if (this.props.messages) {
        Messages = this.props.messages.map(function (message) {
          return (<SearchResult
            message={message}
            key={'search' + message._id}
            handleClose={_this.handleClose} />
          );
        });
      }
      return (
        <div className='search-results'>
          {Messages}
        </div>
      );
    }
  });

  var SearchResult = React.createClass({
    handleJump: function (e) {
      e.preventDefault();

      var dataset = e.currentTarget.dataset;
      var id = dataset.id;

      socket.activeChannel = dataset.channel;
      socket.emit('channel get',
        {
          channel: dataset.channel,
          date: dataset.date,
          limit: -1,
          rtl: 'gte',
          force: true,
          scrollAfter: false
        }
      );
      setTimeout(function () {
        socket.emit('channel get',
          {
            channel: dataset.channel,
            date: dataset.date,
            limit: 20,
            scrollAfter: false
          }
        );
        setTimeout(function () {
          MessagesActions.highlightMessage(id);
          $('.msg__list').scrollTop($('.msg__searched').offset().top - 500);
        }, 1000)
      }, 500);

      this.props.handleClose();
    },

    render: function () {
      var _this = this;
      var localDate = new Date(this.props.message.created_at);
      var hour = localDate.getHours();
      var minutes = localDate.getMinutes();
      var date = ('0' + hour).slice(-2) + ':' + ('0' + minutes).slice(-2);
      var day = localDate.getDate();
      var month = localDate.getMonth();
      var fullDate = date + ' ' + ('0' + day).slice(-2) + '/' +
        ('0' + month).slice(-2) + '/' + localDate.getFullYear();

      var currChannel = ChannelsStore.getState().channels.filter(function (channel) {
        return channel.slug === _this.props.message.channel;
      })[0].name;

      return (
        <div
          className='search-result'
          onClick={this.handleJump}
          data-id={this.props.message._id}
          data-channel={this.props.message.channel}
          data-date={this.props.message.created_at}>
          <span className='search-result__author'>{this.props.message.username} в {currChannel}</span>
          <span className='search-result__date'>{fullDate}</span>
          <div
            className='search-result__text'
            dangerouslySetInnerHTML={{
              __html: this.props.message.text
            }} />
        </div>
      );
    }
  });

  var SearchModel = React.createClass({

    getInitialState: function () {
      return {
        showSearchResult: false,
        messages: []
      };
    },

    componentWillMount: function () {
      var _this = this;

      socket.on('search text', function (data) {
        if (data.status === 'ok') {
          _this.setState({showSearchResult: true});
          _this.setState({messages: data.messages})
        }
      });
    },

    handleSearch: function (e) {},

    handleClose: function (e) {
      this.setState({showSearchResult: false});
    },

    render: function () {
      var body = (
        <SearchResultList messages={this.state.messages} handleClose={this.handleClose} />
      );
      var footer = (
        <div>
          <button className="btn" onClick={this.handleClose} type="button">Закрыть</button>
        </div>
      );
      return (
        <div>
          {this.state.showSearchResult == true && (
            <ModalComponent header="Результат поиска" body={body} footer={footer} />
          )}
        </div>
      );
    }
  });

  return SearchModel;
};

module.exports = SearchResultComponent;
