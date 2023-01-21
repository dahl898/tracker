# tracker
Web app where user can create his project description with images and then if needed export it to Excel and download images in a ZIP file. It can be useful for people who run small buisnesses and have about a dozen employees working on separate projects. The app is meant to keep track of all the projects that employees are working on.


Please be aware that this app was created only to put to use some knowledge that I've gained. It's not a commercial product in any way.


# About this app
tracker takes text data provided by user and saves it to Firestore database. Images are saved in Firebase Storage, but links to them are saved in Firestore. This allows to avoid saving large amounts of data into Firestore which aims to reduce costs.


traker has been written using node.js with express, ejs view engine and a number of libraries from npm.
The authentication in the app is done using passport library and local strategy in conjunction with express-session library and Firestore-store npm library to 
store user sessions at Firestore.


It handles the process of adding text data to Firestore by using Firestore API. For image uploads multer-firebase-storage library was used.


Be careful with Firebase storage security rules because, unfortunately, you must set it to unrestricted access unless you perform Firebase authentication for users
inside the app or rewrite the code and make the app communicate with Google cloud storage directly (then admin SDK will work). That is because tracker uses client SDK for Firebase storage, which demands a user authentication or using an admin SDK and Google cloud storage directly if you want to restrict access to your storage bucket in security rules. If you define your security rules for Firebase Storage as "allow read and write: if true;" the app will work just fine without modifications, but be aware that this allows anyone to read and change data in your storage bucket. 


The abovementioned problem with security rules concerns only Firebase Storage because the app will override security rules for Firestore using service-account.json
no matter what you've set. For example, if you set "allow read and write: if false;" for Firestore, the app will work fine and nobody will have access to your Firestore instance except the app.


After creating a project you can download text data to Excel file, download images to your local machine in ZIP files, modify the project, add new images or delete the project. It's handy for making reports and creating official documentation for projects the company is working on. 


# How to make it work:
1. You must create a Firebase project and a Firebase app binded to this project.


2. There is no registration logic because the idea was that only administrator can add and delete users since it's not a public app. You have two options: create your own registration logic or add the first user manually to Firestore. If you decide to go with the second option, you must create a "Users" collection inside your Firestore and then manually create the following fields:


username:   (if you pick username "cartman" then that user will not have a delete button, and no one will able to delete it using the UI)


hash:   (hash generated from your password. You can use functions in "passwordUtils" folder inside the app with simple console logging)


salt:   (salt generated for hashing your password. Again, you can use functions in "passwordUtils" folder)


position:   (value is optional)


admin:true  (if set to false, user will not see the whole content, such as "Employees" page, and won't be able to delete projects. Set this option to true only for administrator accounts)

3. Create an .env file which will consist the folowing environment variables:


Local development and testing variables


PORT=    (for local testing and development, in most cases not necessary for deployment)


Firebase authentication variables. You must get the values from your Firebase project.


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


# Firebase service account
You must issue a service-account.json file in your Firebase project settings -> Service Accounts -> Generate new private key.
To store it as an environment variable you must convert your service-account.json file to a base64 encoded string.
You can do it in your node.js app in such a way:


const serviceAccVar = Buffer.from(JSON.stringify("copy your service-account.json contents here")).toString('base64')


console.log(serviceAccVar)


Copy the result from the console which will be a string, and then paste it as a value for the variable below:


GOOGLE_CREDS_BASE64="result of conversion service-account.json to base64 string"


You can read more about it here: https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit


Once you've done the steps above, please delete the code you've used to generate the string for the sake of safety. You cannot leave your service-account data anywhere in the code because it will make your Firebase project vaulnerable to attacks.
