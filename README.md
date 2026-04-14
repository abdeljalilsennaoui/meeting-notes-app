# Ambiguity to Action

Transforms ambiguous meeting notes into structured, actionable tasks.

## Live prototype

**https://meeting-notes-app-wine.vercel.app**

Sign in with the demo account credentials listed in the project report. The account already has sample data so you can go straight to the dashboard.

## Demo Video 

**https://drive.google.com/drive/folders/1HF4zPvrIt1NcKiL4GegVK0N3eqHksC8z?usp=sharing**

The video has sound!

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 6 |
| Routing | React Router DOM v6 |
| Animations | Motion (Framer Motion) v12 |
| Icons | Lucide React |
| Backend / Auth | Firebase (Auth + Firestore + App Check) |
| Hosting | Vercel |

## Running locally (optional)

Only needed if you want to run the project outside the live link. The hosted version already has everything.

1. Create a Firebase project and enable **Email/Password auth** + **Firestore**.
2. Copy your web app config into a `.env` file at the project root:

    ```
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

3. Deploy the Firestore rules and indexes shipped in this repo:

    ```bash
    firebase deploy --only firestore:rules,firestore:indexes
    ```

4. Install and run:

    ```bash
    npm install
    npm run dev
    ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
