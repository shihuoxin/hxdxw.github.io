export const WALLPAPER_OPTIONS = [
  { value: 'auto', label: '跟随天气-自动动态壁纸' },
  { value: 'clear', label: '晴天背景-暖阳晴空' },
  { value: 'cloudy', label: '多云背景-流云漫卷' },
  { value: 'overcast', label: '阴天背景-薄雾青灰' },
  { value: 'fog', label: '雾天背景-雾漫山野' },
  { value: 'rain', label: '雨天背景-雨落微光' },
  { value: 'snow', label: '雪天背景-初雪轻落' },
  { value: 'storm', label: '雷雨背景-远山雷光' },
]

export const WEATHER_MUSIC_THEMES = {
  clear: 'xf-orange-theme',
  cloudy: 'xf-sky-theme',
  overcast: 'xf-sky-theme',
  fog: 'xf-dark-green-theme',
  rain: 'xf-sky-theme',
  snow: 'xf-pink-theme',
  storm: 'xf-sky-theme',
  neutral: 'xf-wine-theme',
}

const weatherTypes = new Set(WALLPAPER_OPTIONS.slice(1).map((option) => option.value))

export function normalizeWeatherType(type) {
  return weatherTypes.has(type) ? type : 'neutral'
}

export function resolveWeatherType(weather, wallpaperMode = 'auto') {
  if (wallpaperMode !== 'auto') return normalizeWeatherType(wallpaperMode)

  const label = String(weather?.label || '')

  if (label.includes('雷')) return 'storm'
  if (label.includes('雪') || label.includes('雹')) return 'snow'
  if (label.includes('雨') || label.includes('毛毛')) return 'rain'
  if (label.includes('雾') || label.includes('霾') || label.includes('沙')) return 'fog'
  if (label.includes('阴')) return 'overcast'
  if (label.includes('云') || label.includes('大致晴朗')) return 'cloudy'
  if (label.includes('晴')) return 'clear'
  return 'neutral'
}
