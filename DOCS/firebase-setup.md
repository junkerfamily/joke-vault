# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "joke-vault")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location for your database (choose one close to your users)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (</>) to add a web app
5. Give your app a name (e.g., "Joke Vault Web App")
6. Check "Also set up Firebase Hosting for this app" if you want to use Firebase hosting instead of GitHub Pages
7. Click "Register app"
8. Copy the Firebase configuration object

## Step 4: Update Your Configuration

Replace the placeholder configuration in `app.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-actual-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

## Step 5: Set up Firestore Security Rules (Optional but Recommended)

1. Go to Firestore Database in your Firebase console
2. Click on "Rules" tab
3. For a public joke website, you can use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jokes/{document} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules allow anyone to read and write jokes. For production, you might want to add authentication and more restrictive rules.

## Step 6: Test Your Setup

1. Open `index.html` in a web browser
2. The app should load and automatically populate with 50 knock-knock jokes
3. Try searching and filtering jokes
4. Try adding a new joke

## Troubleshooting

- If you see CORS errors, make sure you're serving the files from a web server, not opening the HTML file directly
- You can use Python's built-in server: `python -m http.server 8000` or `python3 -m http.server 8000`
- Then visit `http://localhost:8000`
