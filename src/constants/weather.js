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

const weatherTypes = new Set(WALLPAPER_OPTIONS.slice(1).map((option) => option.value))

export function normalizeWeatherType(type) {
  return weatherTypes.has(type) ? type : 'neutral'
}
