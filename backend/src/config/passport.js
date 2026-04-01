/**
 * Passport Google OAuth Config
 * 
 * Flow:
 * - User đã có tài khoản (googleId hoặc email trùng): đăng nhập bình thường, giữ nguyên role
 * - User mới hoàn toàn: trả về isNewUser=true + thông tin tạm, KHÔNG tạo tài khoản ngay
 *   → Frontend sẽ hiện modal chọn role → gọi POST /auth/google/complete để tạo tài khoản
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
    // 1. Tìm user theo googleId (đã từng đăng nhập Google)
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      return done(null, user);
    }

    // 2. Tìm theo email (đã đăng ký email/pass hoặc đã OAuth trước đó)
    user = await User.findOne({ email: profile.emails?.[0]?.value });
    if (user) {
      // Liên kết Google account vào tài khoản hiện có, giữ nguyên role
      user.googleId = profile.id;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
      return done(null, user);
    }

    // 3. User mới hoàn toàn — KHÔNG tạo tài khoản, trả thông tin tạm để frontend hỏi role
    const tempProfile = {
      isNewUser: true,
      googleId: profile.id,
      email: profile.emails[0].value,
      fullName: profile.displayName,
      avatar: profile.photos?.[0]?.value || '',
    };

    // Trick: pass như một object "user giả" có flag isNewUser
    // Controller sẽ kiểm tra flag này và redirect khác
    return done(null, tempProfile);
  } catch (error) {
    done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id || user.googleId));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
