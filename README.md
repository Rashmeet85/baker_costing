# Baker Costing

Production-ready mobile-first PWA for baker costing, pricing, sales tracking, and lightweight business insights.

## Stack

- React + Vite
- Firebase Auth + Firestore
- Vite PWA plugin
- Firebase Hosting

## Local setup

1. Copy `.env.example` to `.env`.
2. Add the `recipiebookjs` Firebase web app credentials.
3. Enable Google sign-in in Firebase Auth.
4. Install dependencies.
5. Run the app locally.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Firebase Hosting deployment

This repo is configured for Firebase Hosting with the default project set to `recipiebookjs`.

### One-time setup

```bash
npm install -g firebase-tools
firebase login
```

### Deploy Firestore config

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Deploy the app

```bash
npm run build
firebase deploy --only hosting
```

### Full deploy

```bash
npm run build
firebase deploy
```

## Important Firebase notes

- The frontend still needs Firebase web config at build time through `.env`.
- After your first Hosting deploy, make sure the Firebase Hosting domain is listed in `Authentication -> Settings -> Authorized domains`.
- SPA routing is already handled through `firebase.json`, so routes like `/calc?recipeId=...` will work after refresh.

## Firestore collections

- `recipes`: existing companion recipe app collection, fetched by `recipeId`
- `roles`: existing email-based access control shared by both apps
- `costings`: costing snapshots for the business app
- `sales`: shared sales entries with offline sync
- `ingredients`: shared ingredient price memory
- `users`: per-user profile state for the business app
- `bakeries`: brand metadata for the business app shell
- `costingRecipes`: custom recipes created inside the costing app

## Assumptions

- Existing `recipes` documents expose a title/name plus ingredients array with quantity and unit fields.
- Recipes are read from the existing shared `recipes` collection and can be deep-linked with `/calc?recipeId=...`.
- Roles are managed through the existing `roles/{email}` documents so the recipe app and costing app stay in sync.
