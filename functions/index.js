// this script holds functions that are run solely on the server.
// not accessible to the client.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// auth trigger (new user signup)
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
  // for background triggers you must return a value/promise
  return admin.firestore().collection("users").doc(user.uid).set({
    email: user.email,
    anonymous: null == user.email,
  });
});

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete((user) => {
  const doc = admin.firestore().collection("users").doc(user.uid);
  return doc.delete();
});

// http callable function (adding a request)
// exports.addRequest = functions.https.onCall((data, context) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError(
//         "unauthenticated",
//         "only authenticated users can add requests",
//     );
//   }
//   if (data.text.length > 30) {
//     throw new functions.https.HttpsError(
//         "invalid-argument",
//         "request must be no more than 30 characters long");
//   }
//   return admin.firestore().collection("requests").add({
//     text: data.text,
//     upvotes: 0,
//   });
// });

// // http request 1
// exports.randomNumber = functions.https.onRequest((request, response) => {
//   const number = Math.round(Math.random() * 100);
//   response.send(number.toString());
// });

// // http request 2
// exports.toTheDojo = functions.https.onRequest((request, response) => {
//   response.redirect("https://www.devdagd.com/ricksj1/main-site/");
// });

// // http callable 1
// exports.sayHello = functions.https.onCall((data, context) => {
//   const name = data.name;
//   return `Hello, ${name}!`;
// });
