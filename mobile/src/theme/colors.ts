/**
 * theme/colors.ts — Re-export Colors from theme/index.ts
 *
 * Bridge file for screens that import from '../theme/colors'.
 * Keeps Colors accessible as `colors` (camelCase) for backward compat.
 */

export { Colors as colors } from './index';
export { Colors } from './index';
