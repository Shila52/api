// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const admin = require("firebase-admin");


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxct_-uPjAI-Fl_5Bns1re_oFg8khR7rE",
  authDomain: "newone-e378f.firebaseapp.com",
  databaseURL: "https://newone-e378f-default-rtdb.firebaseio.com",
  projectId: "newone-e378f",
  storageBucket: "newone-e378f.appspot.com",
  messagingSenderId: "785873579144",
  appId: "1:785873579144:web:ac4f4313a938d2c361c33d",
  measurementId: "G-FHZS1L963L",
};
// Initialize Firebase

const Admin = admin.initializeApp(firebaseConfig);





module.exports = {
 
  Admin,
};
