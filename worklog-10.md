---
Task ID: 10
Agent: Main Agent
Task: Audit full app structure and fix all broken/stubbed components

Work Log:
- Read entire page.tsx (4285 lines) to map all 30+ views and components
- Identified 6 issues: 2 critical bugs, 4 broken UI features
- Fixed CrmDealsView: setDeads typo -> setDeals (runtime crash on deal move)
- Fixed ProfileView: Stats labels corrected
- Fixed ExploreView: Follow buttons functional with toggle + toast
- Fixed ExploreView: Trending tags navigate to SearchView with query
- Fixed ExploreView: Image grid uses real images instead of placeholders
- Fixed MainLayout: Scroll handler listens on main ref instead of window
- Fixed SearchView: Accepts initial query from viewParams
- Build passes cleanly

Stage Summary:
- 7 fixes applied, all builds pass cleanly
