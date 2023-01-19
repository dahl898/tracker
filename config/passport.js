const passport = require('passport');
const LocalStrategy = require('passport-local');
const { getSingleUserFromDB } = require('../lib/databaseUtils.js');
const timingSafeCompare = require('tsscmp');
const crypto = require('crypto');


const verifyCallback = async (username, password, cb) => {
  const userData = await getSingleUserFromDB(username, function(err, user){
    if (err) {
      return cb(err);
    }
    if (!user) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    const inputHash = crypto.pbkdf2Sync(password, user.salt, parseInt(process.env.ITER), parseInt(process.env.KEYLEN), 'sha512').toString('hex');
    if(timingSafeCompare(inputHash, user.hash)) {
      return cb(null, user);
    }else{
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
  });
}

const strategy = new LocalStrategy(verifyCallback);


passport.use(strategy);

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, ({id: user._id, username: user.username, admin: user.admin}));
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
