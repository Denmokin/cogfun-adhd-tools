export function linearize(channel) {
  const c = channel / 255.0
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function wcagLuminance(hex) {
  if (!hex || hex.length < 7) return 0
  const r = linearize(parseInt(hex.slice(1, 3), 16))
  const g = linearize(parseInt(hex.slice(3, 5), 16))
  const b = linearize(parseInt(hex.slice(5, 7), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastColor(hex) {
  return wcagLuminance(hex) > 0.179 ? '#111118' : '#ffffff'
}

export function withAlpha(hex, alpha) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${hex}${a}`
}

export const COLOR_PALETTE = [
  '#5294e2', '#27ae60', '#e67e22', '#9b59b6',
  '#e74c3c', '#3daee9', '#f39c12', '#1abc9c'
]