var SearchComponent = function (socket) {

var ChannelsStore = require('./../../stores/ChannelsStore')(socket); // подключаем стор

  var SearchBlock = React.createClass({

    getInitialState: function () {
      return {
        query: ''
      };
    },

    handleSearch: function (e) {
      var _this = this;

      if (_this.state.query) {
        var channelList = ChannelsStore.getState().channels.map(function (channel) {
          return channel.slug;
        });

        socket.emit('search text', {
          channels: channelList,
          text: _this.state.query
        });
        _this.setState({query: ''});
      }
    },

    handleKeyDown: function (e) {
      if (e.keyCode === 13) {
        this.handleSearch(e);
      }
    },

    handleChange: function (e) {
      this.setState({query: e.target.value.trim()});
    },

    render: function () {
      return (
        <div className='search'>
          <div className='form__row'>
            <label className='form__label' htmlFor='search' onClick={this.handleSearch}>
              <i className='fa fa-search'></i>
            </label>
            <input className='form__text' type='text' id='search' ref='search' onChange={this.handleChange} onKeyDown={this.handleKeyDown} value={this.state.query} />
          </div>
        </div>
      );
    }
  });

  return SearchBlock;
};

module.exports = SearchComponent;
