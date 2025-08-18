    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');


    firebase.initializeApp({


        apiKey: "AIzaSyDFuiAp6zexGw8xh81NgnZlMO0JDkDUIdY",
        authDomain: "chattersocket.firebaseapp.com",
        projectId: "chattersocket",
        storageBucket: "chattersocket.firebasestorage.app",
        messagingSenderId: "1027720984076",
        appId: "1:1027720984076:web:658de7e82a0e01f1b36029",
        measurementId: "G-XXLJJF6CE5"

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