# Ambiguity to Action

Transforms ambiguous meeting notes into structured, actionable tasks.

**Live prototype:** https://meeting-notes-app-wine.vercel.app

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Markup | HTML5 |
| Styling | Plain CSS (custom properties, BEM-like naming) |
| Build tool | Vite 6 |
| Routing | React Router DOM v6 |
| Animations | Motion (Framer Motion) v12 |
| Icons | Lucide React |
| Backend / Auth | Firebase (Auth + Firestore) |

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Authentication** — go to Authentication > Sign-in method > enable Email/Password
3. Enable **Firestore Database** — go to Firestore Database > Create database > start in test mode
4. Go to Project Settings > General > Your apps > Add app (Web) and copy the config
5. Create a `.env` file at the project root with your config:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

6. Create the following Firestore composite indexes (Firestore > Indexes > Composite > Add index):

| Collection | Fields |
|---|---|
| `tasks` | `notebookId` ASC, `createdAt` DESC |
| `tasks` | `userId` ASC, `createdAt` DESC |
| `notebooks` | `userId` ASC, `createdAt` ASC |
| `notes` | `notebookId` ASC, `createdAt` DESC |

## Getting Started

```bash
npm install
cp .env.example .env
# Fill .env with your Firebase project credentials
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
