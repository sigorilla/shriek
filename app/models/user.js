var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var User = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: {
    type: String,
    required: false
  },
  salt: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  setting: {
    email: {
      type: String
    },
    image: {
      type: String
    },
    first_name: {
      type: String
    },
    last_name: {
      type: String
    },
    sex: {
      type: String,
      enum: ['female', 'male']
    },
    description: {
      type: String
    }
  }
});

User.methods.encryptPassword = function (password) {
  return crypto.Hmac('sha1', this.salt).update(password).digest('hex');
};

User
  .virtual('userId')
  .get(function () {
    return this.id;
  });

User
  .virtual('password')
  .set(function (password) {
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString('hex');
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this._plainPassword;
  });

User.methods.checkPassport = function (password) {
  if(!this.hashedPassword) {
    this.set('password', password);
    this.save();
  };
};

User.methods.checkPassword = function (password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

User.methods.checkHashedPassword = function (hashedPassword) {
  return hashedPassword === this.hashedPassword;
};

User.path('username').validate(function (v) {
  return v.length > 4 && v.length < 30 && !/[^a-z_\w]+/i.test(v)
}, 'Никнейм не прошел валидацию. От 5 до 30 латинских символов и цифр с нижним подчеркиванием.');

User.path('hashedPassword').validate(function (v) {
  if (this._plainPassword) {
    if (this._plainPassword.length < 6) {
      this.invalidate('password', 'Пароль должен быть от 6 символов.');
    }
  }

  // if (this.isNew && !this._plainPassword) {
  //   this.invalidate('password', 'required');
  // }
}, null);

User
  .virtual('full_name')
  .set(function (full_name) {
    var arr_name = full_name.split(' ');
    this.first_name = arr_name[0];
    this.last_name = arr_name[1];
  })
  .get(function () {
    return [this.first_name, this.last_name].join(' ');
  });

module.exports = mongoose.model('User', User);
