importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "PUT_API_KEY",
  authDomain: "PUT_AUTH_DOMAIN",
  projectId: "PUT_PROJECT_ID",
  storageBucket: "PUT_STORAGE_BUCKET",
  messagingSenderId: "PUT_SENDER_ID",
  appId: "PUT_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "إشعار";
  const options = {
    body: payload?.notification?.body || "",
  };
  self.registration.showNotification(title, options);
});
