/* ── Instagram-style CSS Image Filters ──────────────────────────────────────── */

export interface ImageFilter {
  id: string
  name: string
  css: string
  emoji: string
}

/**
 * Curated set of 14 filters modelled after Instagram's most popular presets.
 * `css` is a valid CSS filter string — can be used both as a CSS `filter`
 * property on <img> elements (for live preview) and as `CanvasRenderingContext2D.filter`
 * when baking the filter into a compressed JPEG via canvas.
 */
export const IMAGE_FILTERS: ImageFilter[] = [
  { id: 'normal',   name: 'Normal',   css: 'none', emoji: '📷' },
  { id: 'clarendon',name: 'Clarendon', css: 'contrast(1.2) saturate(1.35)', emoji: '☀️' },
  { id: 'gingham',  name: 'Gingham',  css: 'brightness(1.05) hue-rotate(-10deg)', emoji: '🌿' },
  { id: 'moon',     name: 'Moon',     css: 'grayscale(1) contrast(1.1) brightness(1.1)', emoji: '🌙' },
  { id: 'lark',     name: 'Lark',     css: 'brightness(1.15) contrast(0.9) saturate(1.2)', emoji: '🐦' },
  { id: 'reyes',    name: 'Reyes',    css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)', emoji: '🎞️' },
  { id: 'juno',     name: 'Juno',     css: 'contrast(1.15) saturate(1.8) brightness(1.1)', emoji: '🌸' },
  { id: 'slumber',  name: 'Slumber',  css: 'saturate(0.66) brightness(1.05) sepia(0.15)', emoji: '😴' },
  { id: 'crema',    name: 'Crema',    css: 'contrast(0.9) brightness(1.05) saturate(0.9) sepia(0.1)', emoji: '☕' },
  { id: 'ludwig',   name: 'Ludwig',   css: 'contrast(1.05) saturate(1.2) brightness(1.05)', emoji: '🏰' },
  { id: 'aden',     name: 'Aden',     css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)', emoji: '🌊' },
  { id: 'perpetua', name: 'Perpetua', css: 'contrast(1.1) brightness(1.25) saturate(1.1)', emoji: '🌲' },
  { id: 'nashville',name: 'Nashville', css: 'sepia(0.25) contrast(1.15) brightness(1.05) saturate(1.2)', emoji: '🎸' },
  { id: 'valencia', name: 'Valencia', css: 'sepia(0.15) brightness(1.1) contrast(1.1)', emoji: '🌅' },
]

export function getFilterById(id: string): ImageFilter {
  return IMAGE_FILTERS.find((f) => f.id === id) ?? IMAGE_FILTERS[0]
}
