// -----------------------------------------------------------------
// FIREBASE CONFIGURATION
// -----------------------------------------------------------------
// To make the Leaderboard truly global, you must connect this game
// to a free Firebase Cloud Firestore database.
//
// 1. Go to https://console.firebase.google.com/
// 2. Create a new Project (e.g. "MAGRUN Leaderboard").
// 3. Add a "Web App" to the project to generate your config keys.
// 4. Copy the keys provided and paste them into the firebaseConfig object below!
// 5. In your Firebase Console, click "Firestore Database" on the left menu.
// 6. Click "Create Database", set location, and start in "Test Mode".
// -----------------------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyCuOkQv0jBWc0I9-HzxVYpLHfMrUi00yms",
    authDomain: "magrun-leaderboard.firebaseapp.com",
    projectId: "magrun-leaderboard",
    storageBucket: "magrun-leaderboard.firebasestorage.app",
    messagingSenderId: "951573268269",
    appId: "1:951573268269:web:a35b5d56fee2ed76c7b5a4",
    measurementId: "G-WWZ3SNQ6L8"
};
// Initialize Firebase only if the dummy key has been replaced
let db = null;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.apiKey !== "") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("🔥 Firebase initialized successfully!");
    } else {
        console.warn("⚠️ Firebase is NOT connected! Global Leaderboard requires you to insert your keys into js/firebase-config.js.");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Export the db reference globally so LeaderboardManager can access it
window.magrunDB = db;
