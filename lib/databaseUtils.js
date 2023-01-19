const db = require('../config/firestore_config.js');

async function getSingleUserFromDB (username, callback) {
  try {
    const userRef = db.collection('Users');
    const docsArray = await userRef.where('username', '==', `${username}`).get();
    let docData;
    if (docsArray.empty) {
      return callback(null, false);
    }
    docsArray.forEach(doc => {
     docData = doc.data();
     return callback(null, docData);
    });
  }catch (error) {
      return callback(error);
    }
};


async function deleteUserSessionsFromDB (username) {
  const sessionsRef = db.collection('sessions');
  const sessionsSnapshot = await sessionsRef.get();
  if (sessionsSnapshot.empty) {
    console.log('sessions snapshot is empty')
    return
  }
  sessionsSnapshot.forEach(async (doc) => {
    const singleSessionObject = JSON.parse(doc.data().session);
    if (singleSessionObject.passport) {
      if (singleSessionObject.passport.user.username === `${username}`) {
        await db.collection('sessions').doc(doc.id).delete(); 
      }
    }
  });
}

function fireErrHandler(errorCode){
  switch (errorCode) {
    case 'storage/unauthorized':
      return "Firebase storage authorization failed."
    case 'storage/retry-limit-exceeded':
      return "Storage retry limit has been exceeded. Check your internet connection."
    case 'storage/quota-exceeded':
      return "Storage quota has been exceeded. This is an example version of the app and it's using Firebase free tier, so it's not scaling. Please try again tomorrow."
  }
}


module.exports = {getSingleUserFromDB, deleteUserSessionsFromDB, fireErrHandler};
