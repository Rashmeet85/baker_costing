# Baker Costing

Production-ready mobile-first PWA for baker costing, pricing, sales tracking, and lightweight business insights.

## Stack

- React + Vite
- Firebase Auth + Firestore
- Vite PWA plugin
- Vercel static deployment

## Setup

1. Copy `.env.example` to `.env`.
2. Use the `recipiebookjs` Firebase web app credentials.
3. Enable Google sign-in in Firebase Auth.
4. Deploy Firestore rules and indexes.
5. Install dependencies and run the app.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Firestore collections

- `recipes`: existing companion app collection, fetched by `recipeId`
- `recipes`: existing companion recipe data
- `roles`: existing email-based access control shared by both apps
- `costings`: costing snapshots for the business app
- `sales`: shared sales entries with offline sync
- `ingredients`: shared ingredient price memory
- `users`: per-user profile state for the business app
- `bakeries`: brand metadata for the business app shell

## Assumptions

- Existing `recipes` documents expose a title/name plus ingredients array with quantity and unit fields.
- Recipes are read from the existing shared `recipes` collection and can be deep-linked with `/calc?recipeId=...`.
- Roles are managed through the existing `roles/{email}` documents so the recipe app and costing app stay in sync.
