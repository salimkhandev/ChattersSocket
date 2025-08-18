    // Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
    import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDFuiAp6zexGw8xh81NgnZlMO0JDkDUIdY",
    authDomain: "chattersocket.firebaseapp.com",
    projectId: "chattersocket",
    storageBucket: "chattersocket.firebasestorage.app",
    messagingSenderId: "1027720984076",
    appId: "1:1027720984076:web:658de7e82a0e01f1b36029",
    measurementId: "G-XXLJJF6CE5"
};


    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    export const messaging = getMessaging(app);

// import { getMessaging, getToken } from "firebase/messaging";

export const generateToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        console.log("permission", permission);

        if (permission === "granted") {
            const token = await getToken(getMessaging(), {
                vapidKey: "BIcC4lohkB34qJ0ZZk3TvsGgsFO7eMBh12vY8a-l0NlOObn8WjD6uO6ON6PXj5Mfy3-jEL4R3C_MKEouU5SEN2g"
            });

            if (token) {
                console.log("FCM token:", token);
                return token;
            } else {
                console.warn("No registration token available. Request permission to generate one.");
            }
        } else {
            console.warn("Permission not granted for notifications.");
        }
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
    }
};
