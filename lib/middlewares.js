'use strict'
const db = require('../config/firestore_config.js');
const {randomBytes} = require('crypto');
const { fireErrHandler } = require('./databaseUtils.js');


async function addNewProject (req, res, next) {
  try{
    const _id = randomBytes(16).toString('hex');
    const dateObj = new Date();
    const dateOptions = {day: 'numeric', month: 'numeric', year: 'numeric'};
    const timeOptions = {timeZone: 'Europe/Warsaw'};
    const creationDate = dateObj.toLocaleDateString('pl-PL', dateOptions);
    const creationTime = dateObj.toLocaleTimeString('pl-PL', timeOptions);

    const projectInst = {
      _id: _id,
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
      imageRefs: [],
      creationDate: creationDate,
      creationTime: creationTime,
      initiator: req.session.passport.user.username
    };
    
    const fileRefsArray = req.files;
    await fileRefsArray.forEach(file => {
      projectInst.imageRefs.push(file.originalname);
    });

    const docRef = db.collection('Projects').doc(`${req.body.agreementID}`);
    await docRef.set(projectInst);
    next(); 
  }
  catch(error){
    console.log(error);
    res.render('operationFailure', {message: 'Something went wrong when tried to push data to Firestore -_-'});
  }
};

async function getSingleProjectFromDB(req, res, next) {
  try {
  const projectsRef = db.collection('Projects');
  const docsArray = await projectsRef.where('_id', '==', `${req.params._id}`).get();
  if (docsArray.empty) {
    return res.render('operationFailure');
  }
  docsArray.forEach(doc => {
    req.docData = doc.data();
  });
  next();}
  catch (error) {
    next(error);
  }
};

async function getAllProjectsFromDB(req, res, next) {
  const projectsRef = db.collection('Projects');
  const snapshot = await projectsRef.get();
  if (snapshot.empty) {
    return res.render('noItems', {items: 'projects'});
  }
  req.snapshot = snapshot;
  next()
};

async function getAllUsersFromDB(req, res, next) {
  const usersRef = db.collection('Users');
  const snapshot = await usersRef.get();
  if (snapshot.empty) {
    return res.render('noItems', {items: 'users'});
  }
  req.snapshot = snapshot;
  next()
};


async function checkIfAlreadyExists (req, res, next) {
  const projectsRef = db.collection('Projects');
  const queryRef = await projectsRef.where('agreementID', '==', `${req.body.agreementID}`).get();
  if (!queryRef.empty) {
    return res.render('docAlreadyExists', {agreementID: req.body.agreementID});
  }else{
    next();
  }
};

async function checkIfUserAlreadyExists (req, res, next) {
  const userRef = db.collection('Users');
  const queryRef = await userRef.where('username', '==', `${req.body.username}`).get();
  if (!queryRef.empty) {
    return res.render('userAlreadyExists', {username: req.body.username});
  }else{
    next();
  }
};

function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  }else{
    res.redirect('/login');
  }
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.admin) {
    next();
  }else{
    res.redirect('notAuthorized');
  }
};

module.exports = {addNewProject, getSingleProjectFromDB, getAllProjectsFromDB, checkIfAlreadyExists, getAllUsersFromDB, isAuth, isAdmin, checkIfUserAlreadyExists};
