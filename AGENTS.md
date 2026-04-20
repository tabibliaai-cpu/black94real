# Black94 — Agent Rules

## IMPORTANT: READ FIRST
Before making ANY changes to this project, read `/home/z/my-project/PROJECT_MEMORY.md` for complete project documentation.

## Project Location
- **Root**: `/home/z/my-project`
- **Firebase Project**: `black94`
- **GitHub Remote**: `https://github.com/tabibliaai-cpu/black94real.git`

## Absolute Rules — NEVER VIOLATE

### 1. Locked Files — DO NOT MODIFY
These files are permanently locked. Do not read them with intent to modify:
- `src/lib/firebase.ts` — Firebase configuration and auth initialization
- `src/lib/auth.ts` — Authentication utilities (bcrypt, JWT)
- `src/lib/db.ts` — Core Firestore data layer (users, posts, chats, notifications)
- `src/lib/utils.ts` — Utility functions (`cn()`)

### 2. Never Recreate the Project
- Do not delete `/home/z/my-project` and start over
- Do not run `npx create-next-app` or similar scaffolding commands
- Do not `rm -rf node_modules` and reinstall unless absolutely necessary

### 3. Never Delete Existing Files
- Do not delete any `.tsx`, `.ts`, `.css`, `.json` files in the project
- You may ADD new files but never remove existing ones

### 4. Never Change Google Auth
- Do not modify the Google Auth provider configuration
- Do not change `signInWithPopup` to `signInWithRedirect`
- Do not add or remove OAuth scopes
- Do not change the auth state listener logic in `page.tsx`

### 5. Never Change Firebase Config
- Do not change `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
- Do not change `measurementId`

## Code Conventions
1. **Styling**: Use Tailwind CSS classes. Dark theme: `bg-black`, `bg-[#07060b]`, `bg-[#100e18]`, accent `#a3d977`, text `#e8f0dc`
2. **Navigation**: Client-side via Zustand `useAppStore(s => s.navigate)(viewName, params)`. No React Router.
3. **State**: Use Zustand stores in `src/stores/`. Do not use React Context for app state.
4. **Firestore**: Read/write via functions in `src/lib/social.ts` (for interactions) or `src/lib/db.ts` (locked — only import, don't modify)
5. **Components**: Use shadcn/ui components from `src/components/ui/`. Custom components go in `src/components/`.
6. **TypeScript**: Build errors are skipped (`ignoreBuildErrors: true`). Write valid TS but don't worry about strict compliance.
7. **Static Export**: No API routes, no server-side code. Everything runs client-side.

## Git Workflow
```bash
cd /home/z/my-project
git config --global user.email "black94real@gmail.com"
git config --global user.name "black94real"
git remote set-url origin https://github.com/tabibliaai-cpu/black94real.git
git add -A
git commit -m "descriptive message"
git push origin main --force
```
Always commit after making changes. Use `--force` if needed for the initial push.

## Deployment
```bash
# Build
npx next build

# Deploy hosting
export FIREBASE_TOKEN="YOUR_TOKEN"
npx firebase deploy --only hosting --project black94

# Deploy Firestore rules
npx firebase deploy --only firestore:rules --project black94
```

## Adding New Views
1. Create view file in `src/views/{ViewName}View.tsx`
2. Add view name to `AppView` type in `src/stores/app.ts`
3. Import view in `src/app/page.tsx`
4. Add to `ViewRouter` views map in `page.tsx`
5. Add title to `viewTitles` map in `page.tsx`
6. Add navigation link in `SettingsView.tsx` or appropriate location
7. Rebuild and redeploy

## Data Layer Notes
- `social.ts` writes interactions to TOP-LEVEL collections: `post_likes`, `post_comments`, `post_reposts`, `post_bookmarks`
- `db.ts` (locked) has subcollection paths — do not use those for new code
- For new Firestore collections, add rules to `firestore.rules` before deploying
- Use `serverTimestamp()` for all timestamps
- Use `increment()` for atomic counter updates

## Architecture Decisions
- No server-side rendering — all client-side
- No real-time listeners (onSnapshot) for feed — uses fetch + polling
- Optimistic UI updates for interactions (like/repost/bookmark updates state immediately, then syncs with Firestore)
- Mock data used for Business Dashboard, CRM, and Salary views — these should eventually be migrated to real Firestore queries
