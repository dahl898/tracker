'use strict'
const {initializeApp, cert } = require ('firebase-admin/app');
const { getFirestore } = require ('firebase-admin/firestore');

const serviceAccount = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS_BASE64, 'base64').toString('ascii'))

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

module.exports = db;
