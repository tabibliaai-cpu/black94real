/**
 * store/useAppStore.ts — Re-export from stores/app.ts
 *
 * Bridge file for screens that import from '../store/useAppStore'.
 */

export { useAppStore, hydrateToken } from '../stores/app';
export type { User, Chat, Message, Post, Comment, Article, Lead, Notification, Black94Notification, Story } from '../stores/app';
