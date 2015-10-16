var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

try {
  var configPs = require('../../configs/passport_configs.json');
} catch (err) {
  var configPs = {};
}
var UserModel = require('../../models/user');

module.exports = function (app, domain) {
  var psUser;
  var firstTime = false;

  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_KEY || configPs.twitter.key,
    consumerSecret: process.env.TWITTER_SECRET || configPs.twitter.secret,
    callbackURL: 'http://' + domain + '/auth/twitter/callback'
  }, function (token, tokenSecret, profile, done) {
    UserModel.findOne({
      username: profile.username
    }, function (err, user) {
      psUser = profile.username;
      if (err) {
        return done(err);
      }
      if (!user) {
        firstTime = true;
        user = new UserModel({
          username: profile.username,
          twitterId: profile.id,
          setting: {
            image: profile.photos[0].value
          }
        });
        user.save(function (err) {
          if (err) {
          }
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });
  }));

  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/failure'
  }), function (req, res) {
    res.cookie('psUser', psUser, {maxAge: 10000, httpOnly: false});
    if (firstTime) {
      res.cookie('psInit', 'yes', {maxAge: 10000, httpOnly: false});
      firstTime = false;
    }
    res.redirect('/');
  });
};
