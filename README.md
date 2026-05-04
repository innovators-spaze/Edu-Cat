# Edu-Cat 🐱

A children's phonics learning app built with React, TypeScript, and Node.js.

## Features

- 🔐 Firebase Authentication (Email/Password + Google)
- 📖 Chapter 1: Phonics — letter sounds (30 levels)
- ✏️ Chapter 2: Letter Tracing (30 levels)
- 🖼️ Chapter 3: Pictorial Word Building (30 levels)
- 🤖 AI-generated questions via Groq (with static fallback)

## Project Structure

```
Edu-Cat/
├── frontend/       # React + TypeScript + Vite
├── backend/        # Express API (questions + progress)
└── vercel.json     # Deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Authentication enabled
- Groq API key (optional — static fallback works without it)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # add your GROQ_API_KEY
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### `backend/.env`
```
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

## Deployment

Deployed on Vercel. The `vercel.json` at the root handles both frontend build and API routing.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Firebase Auth
- **Backend**: Node.js, Express, Groq SDK
- **Deployment**: Vercel
