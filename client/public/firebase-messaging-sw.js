    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');


    firebase.initializeApp({
        apiKey: "AIzaSyBitV6MCQj4INcj_yfW4ljILifa-7ziRik",
        authDomain: "pwa-push-notification-8649b.firebaseapp.com",
        projectId: "pwa-push-notification-8649b",
        storageBucket: "pwa-push-notification-8649b.firebasestorage.app",
        // storageBucket: "pwa-push-notification-8649b.appspot.com", // ✅ fixed,

        messagingSenderId: "504230264197",
        appId: "1:504230264197:web:6723b541451cb8fd2498ec",
        measurementId: "G-HL2TYM3QF6"
    });
    const messaging = firebase.messaging();


    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icon.png',
            badge: payload?.webpush?.notification?.badge || '/badge.png',
            image: payload.notification.image
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });