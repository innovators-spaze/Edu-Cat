# Phonics Fun 🎵

A children's phonics learning app with Firebase Authentication.

## Setup

### 1. Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Go to Project Settings → Your apps → Add Web App → Copy the config

### 2. Add Firebase Config
Open `frontend/public/index.html` and replace the placeholder config:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Install & Run Backend
```bash
cd backend
npm install
npm start
```
Server runs on http://localhost:3000 and also serves the frontend.

## Project Structure
```
phonics-fun/
├── backend/
│   ├── server.js              # Express API (questions + progress)
│   ├── generate-questions.js  # Question bank (3 chapters × 30 levels × 10 questions)
│   └── package.json
└── frontend/public/
    ├── index.html             # Full SPA with Firebase Auth
    ├── style.css              # Children-specific bubbly UI
    ├── images/                # cat.png, dog.png, ball.png, etc.
    └── sounds/                # meow.mp3, pop.mp3, wrong.mp3
```

## Features
- 🐱 Animated cat splash screen with "meow"
- 🔐 Firebase Email/Password Auth (register + login)
- 🫧 Bubble buttons with pop animation
- 🍬 Candy shower on correct answers
- 🌊 Realistic sinking water on wrong answers
- 📖 Chapter 1: Phonics (30 levels × 10 questions)
- ✏️ Chapter 2: Letter tracing (30 levels × 10 questions)
- 🖼️ Chapter 3: Pictorial word building (30 levels × 10 questions)
- ◀ Previous / Next ▶ navigation
