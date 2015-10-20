var MessageModel = require('../models/message');
var fs = require('fs');
var crypto = require('crypto');
var aws = require('aws-sdk');

aws.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  signatureVersion: 'v4',
  region: 'eu-central-1'
});

var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var S3_BUCKET = process.env.S3_BUCKET_NAME;

var files = {};

var typeOfFiles = {
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'pdf': 'pdf',
  'php': 'script',
  'js': 'script',
  'jsx': 'script',
  'java': 'script',
  'py': 'script'
};

var shriekPlugins = require('./plugins');

var MessageModule = function(socket) {

  /** Слушаем сообщение с фронта
  * @param data
  * @param data.user string логин юзера
  * @param data.channel string канал в который пишем (не обязательное)
  * @param data.text string текст сообщения
  * @param data.type string не обязательное, по умолчанию text
  */

  socket.on('message send', function (data) {

    // здесь еще нужно проверять на существование чата, если его нет — создавать
    var res = {};
    var newMessage = {
      username: socket.username,
      channel: (data.channel !== undefined ? data.channel : 'general'), // если канал не пришёл, пишем в general
      text: data.text,
      raw: data.text,
      type: (data.type !== undefined ? data.type : 'text'), // если не пришёл тип, то думаем, что это текст
      attachments: data.attachments
    }

    shriekPlugins.reduce(function (prev, plugin) {
      return prev.then(function (data) {
        return new Promise(function (resolve, reject) {
          if (plugin.forEvent === 'channelGet') {
            plugin(data, function (err, result) {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
          } else {
            resolve(data);
          }
        })
          .then(function (result) {
            return result;
          });
      });
    }, Promise.resolve([newMessage])).then(function (result) {
      newMessage = MessageModel(newMessage);

      var setMessage = new Promise(function (resolve, reject) {
        res.status = 'ok';
        res.message = newMessage;
        res.message.created_at = Date.now();
        if (socket.username) {
          socket.emit('message send', res);
        }

        newMessage.save({runValidators: true}, function (err, data) {
          if (!err) {
            var out = {
              status: 'ok',
              message: data // здесь будет запись из БД со всеми полями (см схему)
            };

            resolve(out);
          } else {
            reject('Ошибка создания сообщения');
          }
        });
      });

      setMessage
        .then(function (data) {
          return socket.broadcast.emit('message send', data);
        })
        .catch(function (error) {
          return socket.emit('message send', {
            status: 'error',
            error_message: error
          });
        });
    });
  });

  socket.on('file start', function (data) {
    var name = data.name;
    var filename = data.filename.replace(/^\.+/, '').toLowerCase();
    files[name] = {
      filesize: data.size,
      data: '',
      downloaded: 0,
      ext: (/[.]/.test(filename)) ? (/[^.]+$/.exec(filename)) : '',
      filename: filename,
      type: data.type
    };
    var place = 0;
    try {
      var stat = fs.statSync('upload/' + name);
      if (stat.isFile()) {
        files[name].downloaded = stat.size;
        place = stat.size / 524288;
      }
    } catch (er) {
      //It's a New File
    }
    fs.open('upload/' + name, 'a', 0755, function (err, fd) {
      if (err) {
        socket.emit('file done', {
          status: 'error',
          error_message: 'Файл не загружен. Попробуйте еще раз.'
        });

        delete files[name];
      } else {
        files[name].handler = fd;
        socket.emit('file more', {place: place, percent: 0 });
      }
    });
  });

  socket.on('file upload', function (data) {
    var name = data.name;
    files[name].downloaded += data.data.length;
    files[name].data += data.data;
    if (files[name].downloaded === files[name].filesize) {
      fs.write(files[name].handler, files[name].data, null, 'Binary', function (err, writen) {
        if (err) {
          delete files[name];

          return socket.emit('file done', {
            status: 'error',
            error_message: 'Файл не загружен. Попробуйте еще раз.'
          });
        }
        fs.close(files[name].handler);

        var randomDir = crypto.randomBytes(4).toString('hex');
        var s3File = randomDir + '/' + files[name].filename;

        fs.readFile('upload/' + name, function (err, data) {
          if (err) {
            socket.emit('file done', {
              status: 'error',
              error_message: 'Файл не загружен. Попробуйте еще раз.'
            });

            delete files[name];
          } else {
            var s3 = new aws.S3();

            s3.putObject({
              Body: data,
              Bucket: S3_BUCKET,
              Key: s3File,
              Expires: 60,
              ContentType: files[name].type || '',
              ACL: 'public-read'
            }, function (err, s3_data) {
              if (err) {
                socket.emit('file done', {
                  status: 'error',
                  error_message: 'Файл не загружен. Попробуйте еще раз.'
                });

                delete files[name];
              } else {
                fs.unlink('upload/' + name, function () {
                  socket.emit('file done', {
                    status: 'ok',
                    attach: {
                      url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + s3File,
                      type: typeOfFiles[files[name].ext] || 'other',
                      name: files[name].filename,
                      s3_key: s3File
                    }
                  });

                  delete files[name];
                });
              }
            });
          }
        });
      });
    } else if (files[name].data.length > 10485760) {
      fs.write(files[name].handler, files[name].data, null, 'Binary', function (err, writen) {
        if (err) {
          delete files[name];

          return socket.emit('file done', {
            status: 'error',
            error_message: 'Файл не загружен. Попробуйте еще раз.'
          });
        }
        files[name].data = '';
        var place = files[name].downloaded / 524288;
        var percent = (files[name].downloaded / files[name].filesize) * 100;
        socket.emit('file more', {place: place, percent: percent});
      });
    } else {
      var place = files[name].downloaded / 524288;
      var percent = (files[name].downloaded / files[name].filesize) * 100;
      socket.emit('file more', {place: place, percent: percent});
    }
  });

  socket.on('file remove', function (data) {
    var s3 = new aws.S3();
    var params = {
      Bucket: S3_BUCKET,
      Key: data.key
    };
    s3.deleteObject(params, function (err, s3_data) {});
  });
}

module.exports = MessageModule;
