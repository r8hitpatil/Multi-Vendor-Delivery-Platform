importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey:"AIzaSyAC0vcx20lgJWPR5weMkaJ6VLawYeb49Po",
  authDomain:"delivery-karwo.firebaseapp.com",
  projectId:"delivery-karwo",
  storageBucket:"delivery-karwo.firebasestorage.app",
  messagingSenderId:"590558065000",
  appId:"1:590558065000:web:cb0adf605cc3cc3d97a6dd",
  measurementId:"G-3EC6258C4Z"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(`[firebase-messaging-sw.js] Received background message ${payload}`);
    const title = payload.notification.title;
    const options = {
        body : payload.notification.body || "You have a new order",
        icon : '/file.svg',
        data : payload.data,
    };

    return self.registration.showNotification(title,options);
})