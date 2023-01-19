require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const {multer} = require('./config/multer_firestore_config.js');
const {
  addNewProject, 
  getSingleProjectFromDB, 
  getAllProjectsFromDB, 
  checkIfAlreadyExists, 
  getAllUsersFromDB, 
  isAuth,
  isAdmin,
  checkIfUserAlreadyExists} = require('./lib/middlewares.js');
const {storage} = require('./config/firebase_storage_config.js');
const {ref, getDownloadURL, deleteObject} = require('firebase/storage');
const db = require('./config/firestore_config.js');
const methodOverride = require('method-override');
const compression = require('compression');
const {exportData} = require('./config/exceljs.js');
const session = require('express-session');
const FirestoreStoreImport = require('firestore-store');
const { genPassword } = require('./lib/passwordUtils.js');
const {randomBytes} = require('crypto');
const JSZip = require('jszip');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const {deleteUserSessionsFromDB, fireErrHandler} = require('./lib/databaseUtils.js');

const FirestoreStore = FirestoreStoreImport(session);
const app = express(); 

app.set('view engine', 'ejs');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
    "default-src": ["'self'", "https://kit.fontawesome.com/", "https://ka-f.fontawesome.com/"],
    "script-src": ["'self'", "https://kit.fontawesome.com/","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js", "https://ka-f.fontawesome.com/"],
    "style-src": ["'self'", "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js", "https://kit.fontawesome.com/", "bootstrap.min.css/", "https://ka-f.fontawesome.com/", "'sha256-uFa61qf/4W07oOoNbG/gUmOF69EeWJou+8v5c4bp6kA='", "'sha256-4Cqrb9+UVnxYYbmkWOWFDIDtOh5RSNjO41psqDRsOhw='", "'sha256-PlTkgCr7abMkWLmLhbsMIx5IZAK+f/mrWppZJA1W79M='", "'sha256-slyjg7AL1/N0IDV9hPfojVARaaH5aG3D9Ld82aW/O9Y='"],
    "img-src": ["'self'", "https: data:", "https://kit.fontawesome.com/", "https://firebasestorage.googleapis.com/", "bootstrap.min.css/", "https://ka-f.fontawesome.com/", "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"],
    "object-src": ["'self'", "https://firebasestorage.googleapis.com/"],
    "font-src": ["'self'", "https://kit.fontawesome.com/", "https://ka-f.fontawesome.com/"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: { policy: "credentialless" }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(compression());
app.use(session({
  name: 'bread',
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: new FirestoreStore({
    database: db
  }),
  cookie: {maxAge: 1000 * 60 * 60 * 24}
}));

require('./config/passport.js');


app.use(passport.initialize());
app.use(passport.session());


//Get routes

//Renders the login page
app.get('/login', (req, res) => {
  res.render('login');
});

//Renders the notAuthorized page when user is trying to reach the page without necessary permissions
app.get('/notAuthorized', isAuth, (req, res) =>{
  res.render('notAuthorized');
});


//Renders the home page
app.get('/', isAuth, (req, res) => {
  res.render('home');
});


//Renders projects page
app.get('/projects', isAuth, getAllProjectsFromDB, (req, res) => {
  const docsArray = req.snapshot.docs;
  res.render('allPosts', {docsArray: docsArray});
});

//Renders a single project data
app.get('/projects/:_id', getSingleProjectFromDB, async (req, res) => {
  try {
    const imageLinksArray = await Promise.all(req.docData.imageRefs.map(async (imageName) => {
    const pathReference = ref(storage, `${imageName}`);
    let imageLink;
      await getDownloadURL(pathReference)
      .then((url) => {
        imageLink = url;
      })
      .catch((error) => {
        throw(error.code);
      });
    return imageLink;
    }));
  res.render('singlePost', {imageLinksArray: imageLinksArray, textDataObject: req.docData, isAdmin: req.user.admin});}
  catch (error) {
    const message = fireErrHandler(error);
    res.render('operationFailure', {message: message});
  }
});


//Renders an edit page for the particular project
app.get('/edit/:_id', isAuth, getSingleProjectFromDB, async (req, res) => {
  const imageLinksArray = await Promise.all(req.docData.imageRefs.map(async (imageName) => {
  const pathReference = ref(storage, `${imageName}`);
  let imageLink;
    await getDownloadURL(pathReference)
    .then((url) => { 
      imageLink = url;
    })
    .catch((error) => {
      console.log(error);
    });
  return imageLink;
  }));
res.render('edit', {imageLinksArray: imageLinksArray, textDataObject: req.docData});
});


//Renders this page when user tries to create a new project. The purpose of it is to check if the project with the same ID already exists.
//If it does exist, then user will see the page that tells him that he cannot create two projects with the same ID and encourages him to edit an existing project. If it doesn't exist, then user will see the page for creation a new project
app.get('/check', isAuth, (req, res) => {
  res.render('check');
});

//Renders the page that tells user that project cannot be created, because it already exists in the database (mentiooned above)
app.get('/docAlreadyExists', isAuth, (req, res) => {
   res.render('docAlreadyExists')
});

//Renders users page
app.get('/users', isAuth, isAdmin, getAllUsersFromDB, (req, res) => {
  const docsArray = req.snapshot.docs;
  const cartmanObj = docsArray.find((doc) => {
    return doc._fieldsProto.username.stringValue === 'cartman'
  });
  res.render('users', {docsArray: docsArray, cartman: cartmanObj});
});


//Renders page "userCheck" for checking if the user already exists in the database (the same logic of checking as with creating new projects)
app.get('/users/create', isAdmin, (req, res) => {
  res.render('userCheck');
});

//Renders the page for adding new images to an existing project
app.get('/projects/:_id/:agreementID/images', isAuth, (req, res) => {
  res.render('addImages', {_id: req.params._id, agreementID: req.params.agreementID});
});

//POST routes

//Performs passport authentication using local strategy when user tries to log in
app.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}), (req, res, next) => {});


//Performs log out operation
app.post('/logout', (req, res) => {
  req.logout(function(err){
    if(err){
      return res.render('operationFailure');
    }else{
      res.redirect('/');
    }
  });
})

//Checks if project with the same ID already exists in the database
app.post('/check', isAuth, checkIfAlreadyExists, (req, res) => {
  res.render('compose', {agreementID: req.body.agreementID})
});

//Adds new project to the firestore and images to the firebase storage
app.post('/compose', isAuth, multer.array('files'), addNewProject, (req, res) => {
  res.render('operationSuccess', {message: `Project with ID: ${req.body.agreementID} has been created. Go to "Projects" to see it on a project list!`})
});

//Updates the existing project's data in firestore
app.post('/edit/:_id', isAuth, async (req, res) => {
  const dateObj = new Date();
  const dateOptions = {day: 'numeric', month: 'numeric', year: 'numeric'};
  const timeOptions = {timeZone: 'Europe/Warsaw'};
  const dateModified = dateObj.toLocaleDateString('pl-PL', dateOptions);
  const timeModified = dateObj.toLocaleTimeString('pl-PL', timeOptions);
  const projectRef = db.collection('Projects').doc(`${req.body.agreementID}`);

  const updateAction = await projectRef.update({
    investorFirstName: req.body.investorFirstName,
    investorLastName: req.body.investorLastName,
    investorLocationCity: req.body.investorLocationCity,
    investorPostCode: req.body.investorPostCode,
    investorStreet: req.body.investorStreet,
    agreementID: req.body.agreementID,
    date: req.body.date,
    photosCount: req.body.photosCount,
    photosType: req.body.photosType,
    description: req.body.description,
    estimatedPrice: req.body.estimatedPrice,
    paymentStatus: req.body.paymentStatus,
    contractorCompanyName: req.body.contractorCompanyName,
    contractorLocationCity: req.body.contractorLocationCity,
    contractorPostCode: req.body.contractorPostCode,
    contractorStreet: req.body.contractorStreet,
    creationDate: req.body.creationDate,
    creationTime: req.body.creationTime,
    initiator: req.body.initiator,
    modifier: req.session.passport.user.username,
    dateModified: dateModified,
    timeModified: timeModified
  });
  res.render('operationSuccess', {message: `Project with ID: ${req.body.agreementID} has been successfully modified.`});
});

//Handles the process of creating a new employee account
app.post('/register', isAuth, async (req, res) => {
  const _id = randomBytes(16).toString('hex');
  const hashSalt = genPassword(req.body.password);
  const User = {
    _id: _id,
    username: req.body.username,
    hash: hashSalt.hash,
    salt: hashSalt.salt,
    position: req.body.position
  };
  if (req.body.admin) {
    User.admin = true;
  }else{
    User.admin = false;
  }
  const newUser = await db.collection('Users').doc(`${_id}`).set(User);
  res.render('operationSuccess', {message: `Account for user "${User.username}" has been created.`});
});

//Exports project data to excel (only text, not images)
app.post('/projects/export', isAuth, (req, res) => {
  try {
  const firstForm = [
    {dataLabel: 'Customer (first and last name):', dataValue: `${req.body.investorFirstName} ${req.body.investorLastName}`},
    {dataLabel: 'Customer address:', dataValue: `${req.body.investorLocationCity} ${req.body.investorPostCode} ${req.body.investorStreet}`}
  ]
  const secondForm = [
    {dataLabel: 'Project ID:', dataValue: `${req.body.agreementID}`},
    {dataLabel: 'Date:', dataValue: `${req.body.date}`},
    {dataLabel: 'Number of photos:', dataValue: `${req.body.photosCount}`},
    {dataLabel: 'Type of photos:', dataValue: `${req.body.photosType}`},
    {dataLabel: 'Brief description of desired content:', dataValue: `${req.body.description}`},
    {dataLabel: 'Estimated price:', dataValue: `${req.body.estimatedPrice}`},
    {dataLabel: 'Payment received?', dataValue: `${req.body.paymentStatus}`}
  ]
  const thirdForm = [
    {dataLabel: 'Contractor company name:', dataValue: `${req.body.contractorCompanyName}`},
    {dataLabel: 'Contractor company address:', dataValue: `${req.body.contractorLocationCity} ${req.body.contractorPostCode} ${req.body.contractorStreet}`},
    {dataLabel: 'Project created by:', dataValue: `${req.body.initiator}`}
  ]
  const workbook = exportData(firstForm, secondForm, thirdForm);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + `${req.body.investorFirstName}_${req.body.investorLastName}.xlsx`
  );
  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
}catch(error){
  res.render('operationFailure', {message: "Please make sure that fields 'Customer First Name' and 'Customer Last Name' do not consist any special characters, spaces, numbers and letters from other alphabets than the latin one. If needed edit those fields and try again"})
}
});


//Downloads images of particular project as ZIP file
app.post('/projects/download/:_id', isAuth, getSingleProjectFromDB, async (req, res) => {
  const zip = new JSZip();
  const imageDownload = await Promise.all(req.docData.imageRefs.map(async (imageName) => {
    const pathReference = ref(storage, `${imageName}`);
      await getDownloadURL(pathReference)
      .then(async (url) => { 
        const singleImage = await fetch(url).then((response) => response.arrayBuffer());
        zip.file(`${imageName}`, singleImage);
      })
      .catch((error) => {
        console.log(error);
      });
    }));
  res.setHeader(
      "Content-Type",
      "application/zip"
    );
  res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `${req.docData.agreementID}.zip`
    );
  const item = zip.generateNodeStream({type:'nodebuffer', streamFiles:true})
  item.pipe(res);
  item.on('error', (err) => {
    console.log(err);
    res.render('operationFailure')
  });
});

//Adds new images to existing project
app.post('/projects/:_id/:agreementID/images', isAuth, multer.array('files'), getSingleProjectFromDB, async (req, res) => {
  const docRef = db.collection('Projects').doc(`${req.docData.agreementID}`);
  const fileRefsArray = req.files;
//This one pushes new images to the existing array of images. Array of existing images was fetched by "getSingleProjectFromDB" middleware
  await fileRefsArray.forEach(file => {
      req.docData.imageRefs.push(file.originalname);
    });
//Filter function prevents adding duplicates to the Firestore. Firebase storage does this automatically.
  const fileRefsArrayDupFree = await req.docData.imageRefs.filter((imageRef, index) => {
    return (req.docData.imageRefs.indexOf(imageRef) === index);
  })
  await docRef.update({
    imageRefs: fileRefsArrayDupFree
  });
  res.render('operationSuccess', {message: `Additional photos for project with ID: ${req.docData.agreementID} have been added.`})
});

//Renders "newUser" page if username is available (user with provided username does not exist in database)
app.post('/user/check', isAdmin, checkIfUserAlreadyExists, (req, res) => {
  res.render('newUser', {username: req.body.username});
});


//DELETE routes

//Deletes the whole project from firestore and all images from firebase storage.
app.delete('/projects/:_id', isAdmin, getSingleProjectFromDB, async (req, res) => {
  if (req.docData.imageRefs) {
    //Creates a reference to image folder, then deletes images one by one using the reference
    //I didn't find an option in documentation to delete the whole folder at once, so I've had to do it this way
    await Promise.all(req.docData.imageRefs.map(async (imageName) => {
      const imageRef = ref(storage, `${imageName}`);
      await deleteObject(imageRef)
      .catch((error) => {
        console.log(error)
        res.render('operationFailure');
      });
    }));
  }
  //Deletes project document from firestore
  await db.collection('Projects').doc(`${req.docData.agreementID}`).delete();
  res.render('operationSuccess', {message: `Project with ID: ${req.docData.agreementID} has been deleted from the database.`});
});

//Deletes a user from firestore
app.delete('/users/:_id', isAdmin, async (req, res) => {
  const userRef = db.collection('Users').doc(`${req.params._id}`);
  const doc = await userRef.get();
  if (!doc.exists) {
    res.render('operationFailure');
  } else {
    const docData = doc.data();
    await db.collection('Users').doc(`${req.params._id}`).delete();
    //This will delete all sessions of that user from the database. This aims to logout the deleted user immediately after deletion.
    await deleteUserSessionsFromDB(`${docData.username}`);
    res.render('operationSuccess', {message: `User account "${docData.username}" has been deleted. It will no longer be possible to log into the application from this account.`});
  }
});


const port = process.env.PORT;
app.listen(port, () => {
  console.log('Server has been started')
})

