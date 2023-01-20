# tracker
Web app where user can create his project's descriptions with images and then if needed export it to excel and download images as ZIP file. It can be useful for people running small buisnesses and have about dozen employees or so, that are working on their projects. The app is meant to keep track of all the projects that employees are working on.


#About this app:
tracker takes the text data provided by user and seves it into Firestore database. Images are saved in Firebase Storage, but links to them are saved inside Firestore,
to avoid saving large amounts of data into Firestore, which aims to reduce costs.

traker has been written using node.js, express and firebase, but also a number of libraries from npm.
The authentication in the app is done with using passport library and local strategy in conjunction with express-session library and Firestore-store npm library to 
store user sessions at firestore.
It handles the process of adding text data to firestore by using Firestore API. For image uploads was used multer-firebase-storage library.
Be careful with firebase storage security rules, because unfortunately you must set it to unrestricted access unless you will perform firebase authentication for users
inside the app or rewrite the code and make the app to communicate with google cloud storage directly (then admin SDK will work). That is because tracker uses client SDK
for firebase storage, which demands a user authentication or using an admin-SDK and google cloud storage directly if you want to restrict access to it in security rules.
The above problem with security rules concerns only Firebase Storage, because the app will override security rules for Firestore using service-account.json
no matter what you've set. For example, if you will set: "allow read and write: if false" for Firestore, the app will still work fine, but if you will set the exact same
rule for firbase storage - you will not be able to load images inside the app.

#How to make it work:
1. You must create a firebase project and firebase app binded to this project.
2. Create a .env file which must consist the folowing environment variables:
PORT=    (for local testing and development, in most cases not necessary for deployment)

#Firebase variables. You must get the values from your firebase project.
API_KEY=

AUTH_DOMAIN=
PROJECT_ID=
STORAGE_BUCKET=
MESSAGING_SENDER_ID=
APP_ID=

#Firebase service account.
You must issue a service-account.json file in your Firebase project settings -> Service Accounts -> Generate new private key.
To store it as an environment variable you must convert your service-account.json file to a base64 encoded string.
You can do it in your node.js app like so:

const serviceAccVar = Buffer.from(JSON.stringify("copy your service-account.json contents here")).toString('base64')
console.log(serviceAccVar)

Copy the result from the console which will be a string, and then paste it as a value for below variable:

GOOGLE_CREDS_BASE64="result of conversion JSON to base64 string"

You can read more about it here: https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit

Once you've done the above, please delete the code you've used to generate the string for the sake of safety. You cannot leave your service account data anywhere in code,
because it will make your firebase project vaulnerable to attacks.

# Authentication configuration
SECRET=   (secret for express-session module)
ITER=     (number of iterations when hashing the user password)
KEYLEN=   (length of the generated hash from user password)
ALG=      (algorithm used for generating the hash (for example 'sha512')
3. Run "npm install" at terminal in your project folder.
Once the above is done app must run. 
