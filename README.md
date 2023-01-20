# tracker
Web app where user can create his project descriptions with images and then if needed export it to excel and download images as ZIP file. It can be useful for people running small buisnesses and have about dozen employees or so, that are working on separate projects. The app is meant to keep track of all the projects that employees are working on.


# About this app:
tracker takes text data provided by user and saves it to Firestore database. Images are saved in Firebase Storage, but links to them are saved in Firestore, this allows to avoid saving large amounts of data into Firestore, which aims to reduce costs.


traker has been written using node.js, express and firebase, but also a number of libraries from npm.
The authentication in the app is done with using passport library and local strategy in conjunction with express-session library and Firestore-store npm library to 
store user sessions at firestore.


It handles the process of adding text data to Firestore by using Firestore API. For image uploads multer-firebase-storage library was used.


Be careful with firebase storage security rules, because unfortunately you must set it to unrestricted access unless you will perform firebase authentication for users
inside the app or rewrite the code and make the app to communicate with google cloud storage directly (then admin SDK will work). That is because tracker uses client SDK for firebase storage, which demands a user authentication or using an admin-SDK and google cloud storage directly if you want to restrict access to your storage bucket in security rules. If you define your security rules for Firebase Storage as "allow read and write: if true;" the app will work just fine without modifications, but be aware that this allows anyoone to read and change data in your storage bucket. 


The above problem with security rules concerns only Firebase Storage, because the app will override security rules for Firestore using service-account.json
no matter what you've set. For example, if you will set: "allow read and write: if false" for Firestore, the app will work just fine, and nobody will have access to your Firestore instance except the app.


After creation of project you can download text data to excel file, download images to your local machine as ZIP file, modify project, add new images or delete the project. It's handy for let's say for making reports and creating official documentation for projects the company is working on. 


# How to make it work:
1. You must create a firebase project and firebase app binded to this project.


2. There is no registration logic, because the idea was that only administrator can add and delete users, because it's not a public app. You have two options: create your own registration logic or add the first user manually to Firestore. If you will go with the second option you must create a "Users" collection inside your Firestore and then manually create the following fields:


username:   (if you will pick username "cartman" then that user will not have a delete button, and no one will able to delete it using the UI)


hash:   (hash generated from your password. You can use functions in "passwordUtils" folder inside the app with simple console logging)


salt:   (salt generated for hashing your password. Again you can use functions in "passwordUtils" folder)


position:   (value is optional)


admin:true  (if set to false - user will not see the whole content, such as "Employees" page and won't be able to delete projects.  Set this option to true only for administrator accounts)

3. Create a .env file which must consist the folowing environment variables:


Local delepment and testing variables


PORT=    (for local testing and development, in most cases not necessary for deployment)


Firebase authentication variables. You must get the values from your firebase project.


API_KEY=


AUTH_DOMAIN=


PROJECT_ID=


STORAGE_BUCKET=


MESSAGING_SENDER_ID=


APP_ID=

App authentication variables


SECRET=   (secret for express-session module, just a random string)


ITER=   (number of iterations when hashing the user password)


KEYLEN=   (length of the generated hash from user password)


ALG=    (algorithm used for generating the hash (for example 'sha512')


# Firebase service account.
You must issue a service-account.json file in your Firebase project settings -> Service Accounts -> Generate new private key.
To store it as an environment variable you must convert your service-account.json file to a base64 encoded string.
You can do it in your node.js app like so:


const serviceAccVar = Buffer.from(JSON.stringify("copy your service-account.json contents here")).toString('base64')
console.log(serviceAccVar)


Copy the result from the console which will be a string, and then paste it as a value for below variable:


GOOGLE_CREDS_BASE64="result of conversion service-account.json to base64 string"


You can read more about it here: https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit


Once you've done the above, please delete the code you've used to generate the string for the sake of safety. You cannot leave your service-account data anywhere in code, because it will make your firebase project vaulnerable to attacks.
