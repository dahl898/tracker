const crypto = require('crypto');

function genPassword(password){
  let salt = crypto.randomBytes(32).toString('hex');
  let genHash = crypto.pbkdf2Sync(password, salt, parseInt(process.env.ITER), parseInt(process.env.KEYLEN), process.env.ALG).toString('hex');

  return {
    hash: genHash,
    salt: salt
  }
};
function validPassword(password, hash, salt){
  let verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(process.env.ITER), parseInt(process.env.KEYLEN), process.env.ALG).toString('hex');
  return hash === verifyHash;
};


module.exports = {genPassword, validPassword};
