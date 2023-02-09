const firebaseConfig = {
    apiKey: "AIzaSyAUGF6l7e0lRn_tk0QIE8AtOe9MfdIaUeA",
    authDomain: "hskpractice.firebaseapp.com",
    projectId: "hskpractice",
    storageBucket: "hskpractice.appspot.com",
    messagingSenderId: "523016575652",
    appId: "1:523016575652:web:b5d85f3694a4c7e151a431",
    measurementId: "G-QWJSSJJHJ1",
};

let db;

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Firestore
    db = firebase.firestore();
} catch (err) {
    console.error("Firebase failed to initialize");
}
