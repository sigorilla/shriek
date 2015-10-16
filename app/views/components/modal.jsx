var ModalComponent = React.createClass({

  render: function() {
    return (
      <div className="modal">
        <div className="modal__content">
          <div className="modal__header">{this.props.header}</div>
          <div className="modal__body">{this.props.body}</div>
          <div className="modal__footer">{this.props.footer}</div>
        </div>
      </div>
    );
  }

});

module.exports = ModalComponent;
