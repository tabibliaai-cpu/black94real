---
Task ID: 1
Agent: Main Agent
Task: Fix likes, comments, reposts not showing + create PROJECT_MEMORY.md + AGENTS.md + deploy Firestore rules + rebuild/redeploy

Work Log:
- Read all relevant source files: db.ts, social.ts, UserPostCard.tsx, FeedView.tsx, CommentSheet.tsx, app.ts store
- Identified root cause: No Firestore security rules deployed → writes to post_likes/post_comments/post_reposts/post_bookmarks were being blocked silently
- Created comprehensive firestore.rules covering: users, posts, post_likes, post_comments, post_reposts, post_bookmarks, follows, chats, messages, notifications, articles, affiliates, subscriptions, profile_shares
- Added firestore config to firebase.json
- Deployed Firestore rules successfully
- Created PROJECT_MEMORY.md with full project documentation (25 views, data structure, locked files, deployment)
- Created AGENTS.md with strict rules for AI agents working on the project
- Rebuilt Next.js and deployed to Firebase Hosting (49 files)
- Git commit created locally; GitHub push failed due to no SSH/HTTPS credentials in environment

Stage Summary:
- Firestore rules deployed: https://black94.web.app (likes/comments/reposts should now persist)
- PROJECT_MEMORY.md created at /home/z/my-project/PROJECT_MEMORY.md
- AGENTS.md created at /home/z/my-project/AGENTS.md
- firebase.json updated with firestore.rules reference
- Production build deployed to Firebase Hosting
- Git commit ready locally, needs manual push to GitHub (no auth credentials in env)
