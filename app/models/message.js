var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Attachments = new Schema({
  type: {
    type: String,
    require: true,
    default: 'file'
  },
  url: {
    type: String,
    require: true
  },
  name: {
    type: String
  },
  s3_key: {
    type: String
  }
});

var Message = new Schema({
  username: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  raw: {
    type: String
  },
  type: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  attachments: [Attachments]
});

module.exports = mongoose.model('Message', Message);
