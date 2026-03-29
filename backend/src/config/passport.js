/**
 * Passport Google OAuth Config
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const env = require('./env');
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Tìm user theo googleId
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // Cập nhật thông tin từ Google
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      return done(null, user);
    }

    // Tìm theo email (trường hợp đã đăng ký bằng local nhưng login Google)
    user = await User.findOne({ email: profile.emails?.[0]?.value });
    if (user) {
      // Liên kết Google account
      user.googleId = profile.id;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
      return done(null, user);
    }

    // Tạo user mới từ Google
    user = await User.create({
      email: profile.emails[0].value,
      fullName: profile.displayName,
      googleId: profile.id,
      avatar: profile.photos?.[0]?.value || '',
      role: 'student', // Mặc định SV
      authProvider: 'google',
      isVerified: true,
      isActive: true,
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
