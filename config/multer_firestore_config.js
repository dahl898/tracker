'use strict'
require('dotenv').config();
const Multer = require('multer');
const FirebaseStorage = require('multer-firebase-storage');
const fbAdmin = require('firebase-admin');

const serviceAccount = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS_BASE64, 'base64').toString('ascii'))


const multer = Multer({
  storage: FirebaseStorage({
      bucketName: process.env.STORAGE_BUCKET,
      credentials: fbAdmin.credential.cert(serviceAccount),
      public: true,
      hooks: {
        beforeUpload: async (req, file) => {
          if(req.body.agreementID) {
            file.originalname = `${req.body.agreementID}/` + file.originalname;
          }else{
            file.originalname = `${req.params.agreementID}/` + file.originalname;
          }
        }
      }
    })
  });




module.exports = {multer};