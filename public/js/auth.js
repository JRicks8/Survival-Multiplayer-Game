const auth = firebase.auth();
const storage = firebase.firestore();
const database = firebase.database();
if (location.hostname === "localhost") {
  auth.useEmulator("http://localhost:9099");
  storage.useEmulator("localhost", 8080);
  database.useEmulator("localhost", 9000);
}

const authSwitchLinks = document.querySelectorAll(".switch");
const authModals = document.querySelectorAll(".auth .modal");
const authWrapper = document.querySelector(".auth");
const registerForm = document.querySelector(".register");
const loginForm = document.querySelector(".login");
const signInOut = document.querySelector(".sign-inout");
const playAnon = document.querySelector(".play-anon");

let loggingOut = false;

// toggle auth modals
authSwitchLinks.forEach(link => {
  link.addEventListener("click", () => {
    authModals.forEach(modal => modal.classList.toggle("active"))
  });
});

// register form
registerForm.addEventListener("submit", e => {
  e.preventDefault();

  const email = registerForm.email.value;
  const password = registerForm.password.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      console.log("registered user", user);
      registerForm.reset();
    })
    .catch(error => {
      registerForm.querySelector(".error").textContent = error.message;
    });
});

// login form
loginForm.addEventListener("submit", e => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      console.log("logged in", user);
      auth.setPersistence(auth.Auth.Persistence.LOCAL);
      loginForm.reset();
    })
    .catch(error => {
      loginForm.querySelector(".error").textContent = error.message;
    });
});

// play anonymously
playAnon.addEventListener("click", () => {
  auth.signInAnonymously()
  .then(user => {
    console.log("logged in anonymously", user);
    auth.setPersistence(firebase.auth().Auth.Persistence.NONE);
    loginForm.reset();
  })
  .catch(error => {
    loginForm.querySelector(".error").textContent = error.message;
  })
});

function removeGameData(user) {
  let updates = {};
  updates[ `characters/${user.uid}` ] = null;
  updates[ `players/${user.uid}` ] = null;
  return database.ref().update(updates);
}

function signOutAndRefresh(user) {
  loggingOut = true;
  removeGameData(user).then(() => {
    auth.signOut().then(() => location.reload());
  });
}

// on clicked sign out
// signs out the user. if the user is anonymous, it also deletes the user.
function doSignOut() {
  const user = auth.currentUser;
  if (user) {
    const docRef = storage.collection("users").doc(`${user.uid}`);
    docRef.get().then((doc) => {
      if (doc.exists && user.isAnonymous) {
        user.delete().then(() => {
          console.log("user deleted");
          signOutAndRefresh(user);
        }).catch(error => {
          console.log(error.message);
        });
      } else {
        signOutAndRefresh(user);
      }
    });
  }
}

// on clicked sign in
function doSignIn() {
  // open login modal
  authWrapper.classList.add("open");
  authModals[ 0 ].classList.add("active");
}

// auth listener
auth.onAuthStateChanged(user => {
  if (user)
  {
    // logged in
    // adjust event listeners
    signInOut.removeEventListener("click", doSignIn, false);
    signInOut.addEventListener("click", doSignOut, false);
    // close auth modals
    authWrapper.classList.remove("open");
    authModals.forEach(modal => modal.classList.remove("active"));
    signInOut.textContent = "Sign Out";
  } else {
    // logged out
    authWrapper.classList.add('open');
    authModals[ 0 ].classList.add('active');
    // adjust event listeners
    signInOut.removeEventListener("click", doSignOut, false);
    signInOut.addEventListener("click", doSignIn, false);
    signInOut.textContent = "Sign In";
  }
});
