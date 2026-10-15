import { fetchJsonWithTimeout, fetchTextWithTimeout } from '../utils/http.js'

// 中国 IP 库优先，备用接口只在中国源暂时不可达时使用，避免天气卡片因单点故障失效。
const IP_LOCATION_ENDPOINTS = [
  {
    url: 'https://whois.pconline.com.cn/ipJson.jsp?json=true',
    parse(data) {
      if (data.err) throw new Error(data.err)
      return {
        name: data.city || data.region || data.pro,
        latitude: Number(data.lat),
        longitude: Number(data.lng),
      }
    },
  },
  {
    url: 'https://ip.zxinc.org/api.php?type=json',
    parse(data) {
      const result = data.data || data
      return {
        name: result.city || result.region || result.province,
        latitude: Number(result.latitude || result.lat),
        longitude: Number(result.longitude || result.lng || result.lon),
      }
    },
  },
  // 公开备用源，主要为海外访问或中国 IP 库暂时不可用时提供降级。
  {
    url: 'https://ipapi.co/json/',
    parse(data) {
      if (data.error) throw new Error(data.reason || 'IP 定位失败')
      return {
        name: data.city || data.region,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      }
    },
  },
]

// 常用城市目录作为搜索接口的离线兜底，城市代码来自中国天气网公开城市编码。
const COMMON_CITIES = [
  ['101010100', '北京', '北京市', 39.9042, 116.4074],
  ['101020100', '上海', '上海市', 31.2304, 121.4737],
  ['101280101', '广州', '广东省', 23.1291, 113.2644],
  ['101280601', '深圳', '广东省', 22.5431, 114.0579],
  ['101210101', '杭州', '浙江省', 30.2741, 120.1551],
  ['101190101', '南京', '江苏省', 32.0603, 118.7969],
  ['101190401', '苏州', '江苏省', 31.2989, 120.5853],
  ['101270101', '成都', '四川省', 30.5728, 104.0668],
  ['101281601', '东莞', '广东省', 23.0207, 113.7518],
  ['101120201', '青岛', '山东省', 36.0671, 120.3826],
  ['101120101', '济南', '山东省', 36.6512, 117.1201],
  ['101070101', '沈阳', '辽宁省', 41.8057, 123.4315],
  ['101070201', '大连', '辽宁省', 38.9140, 121.6147],
  ['101180101', '郑州', '河南省', 34.7466, 113.6254],
  ['101200101', '武汉', '湖北省', 30.5928, 114.3055],
  ['101110101', '西安', '陕西省', 34.3416, 108.9398],
  ['101230201', '厦门', '福建省', 24.4798, 118.0894],
  ['101230101', '福州', '福建省', 26.0745, 119.2965],
  ['101250101', '长沙', '湖南省', 28.2282, 112.9388],
  ['101290101', '昆明', '云南省', 25.0389, 102.7183],
  ['101190201', '无锡', '江苏省', 31.4912, 120.3119],
]

const COMMON_CITY_RESULTS = COMMON_CITIES.map(([id, name, detail, latitude, longitude]) => ({
  id,
  cityId: id,
  name,
  detail,
  latitude,
  longitude,
}))

export const DEFAULT_BEIJING_PLACE = Object.freeze(COMMON_CITY_RESULTS[0])

function normalizeCityName(name = '') {
  return String(name).replace(/[市区县]$/, '')
}

function assertPlace(place) {
  const name = normalizeCityName(place?.name || '')
  if (!name) throw new Error('定位服务没有返回有效城市')
  return {
    ...place,
    name,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
  }
}

export async function locateByIp() {
  let lastError

  for (const endpoint of IP_LOCATION_ENDPOINTS) {
    try {
      const data = await fetchJsonWithTimeout(endpoint.url, 5500)
      const place = assertPlace(endpoint.parse(data))
      try {
        const chinaCities = await searchChinaWeatherCities(place.name)
        if (chinaCities.length) {
          const city = chinaCities[0]
          return {
            ...place,
            ...city,
            latitude: Number.isFinite(city.latitude) ? city.latitude : place.latitude,
            longitude: Number.isFinite(city.longitude) ? city.longitude : place.longitude,
          }
        }
      } catch {
        // 海外 IP 或城市检索暂不可用时，保留经纬度交给备用天气服务。
      }
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        throw new Error('定位服务没有返回可用经纬度')
      }
      return place
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(lastError?.message || 'IP 定位暂不可用')
}

export async function locateByBrowser() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('当前浏览器不支持定位')
  }

  const coordinates = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const messages = {
          1: '浏览器未授权定位，请检查站点权限',
          2: '暂时无法获取设备位置',
          3: '浏览器定位超时，请重试',
        }
        reject(new Error(messages[error.code] || '浏览器定位失败'))
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 },
    )
  })

  if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
    throw new Error('浏览器没有返回有效坐标')
  }

  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    language: 'zh',
    format: 'json',
  })

  let city
  try {
    const data = await fetchJsonWithTimeout(`https://geocoding-api.open-meteo.com/v1/reverse?${params}`, 6500)
    city = data.results?.[0]
  } catch {
    // 城市名称反查失败时仍使用浏览器返回的有效坐标。
  }
  return {
    id: `browser-${coordinates.latitude}-${coordinates.longitude}`,
    name: normalizeCityName(city?.name || city?.city || '当前位置'),
    detail: [city?.admin1, city?.country].filter(Boolean).join(' · ') || '浏览器定位',
    ...coordinates,
  }
}

function parseJsonOrJsonp(text) {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/^[^(]+\((.*)\)\s*;?$/s)
    if (!match) throw new Error('城市检索返回了无法识别的数据')
    return JSON.parse(match[1])
  }
}

function normalizeCityResult(item) {
  if (typeof item === 'string') {
    const fields = item.split('|').map((field) => field.trim())
    const cityId = fields.find((field) => /^\d{6,12}$/.test(field))
    if (!cityId) return null
    const name = normalizeCityName(fields[1] || fields[0])
    return {
      id: cityId,
      cityId,
      name,
      detail: fields.slice(2, 4).filter(Boolean).join(' · '),
    }
  }

  if (!item || typeof item !== 'object') return null
  const cityId = String(item.id || item.cityid || item.cityId || item.code || item.areaid || '')
  const name = normalizeCityName(item.name || item.city || item.district || '')
  if (!/^\d{6,12}$/.test(cityId) || !name) return null
  return {
    id: cityId,
    cityId,
    name,
    detail: [item.province, item.admin1, item.country].filter(Boolean).join(' · '),
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
  }
}

async function searchChinaWeatherCities(name) {
  const query = encodeURIComponent(name)
  const text = await fetchTextWithTimeout(`https://toy1.weather.com.cn/search?cityname=${query}`, 6500)
  const payload = parseJsonOrJsonp(text)
  const items = Array.isArray(payload) ? payload : payload.data || payload.results || []
  return items.map(normalizeCityResult).filter(Boolean)
}

async function searchOpenMeteoCities(name) {
  const params = new URLSearchParams({ name, count: '5', language: 'zh', format: 'json' })
  const data = await fetchJsonWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  return (data.results || []).map((place) => ({
    id: `${place.id}-${place.latitude}-${place.longitude}`,
    name: place.name,
    detail: [place.admin1, place.country].filter(Boolean).join(' · '),
    latitude: place.latitude,
    longitude: place.longitude,
  }))
}

export async function searchCities(name) {
  const query = normalizeCityName(String(name ?? '').trim())
  if (!query) return []

  // 先命中本地常用城市，再访问中国天气网，最后才使用坐标检索备用源。
  const localResults = COMMON_CITY_RESULTS.filter((place) => `${place.name}${place.detail}`.includes(query))
  if (localResults.length) return localResults.slice(0, 5)

  try {
    const results = await searchChinaWeatherCities(query)
    if (results.length) return results.slice(0, 5)
  } catch {
    // 中国天气网检索节点不可用时，继续使用备用检索。
  }

  try {
    return await searchOpenMeteoCities(query)
  } catch {
    return []
  }
}

function describeChineseWeather(label = '') {
  const text = String(label)
  if (text.includes('雷')) return '雷雨'
  if (text.includes('雪') || text.includes('雹')) return '有雪'
  if (text.includes('雨')) return '有雨'
  if (text.includes('雾') || text.includes('霾') || text.includes('沙')) return text
  if (text.includes('阴')) return '阴天'
  if (text.includes('云')) return '多云'
  if (text.includes('晴')) return '晴朗'
  return text || '天气未知'
}

function describeOpenMeteoWeather(code, isDay) {
  if (code === 0) return isDay ? '晴朗' : '晴夜'
  if (code === 1) return '大致晴朗'
  if ([2, 3].includes(code)) return '多云'
  if ([45, 48].includes(code)) return '有雾'
  if ([51, 53, 55, 56, 57].includes(code)) return '毛毛雨'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '有雨'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '有雪'
  if ([95, 96, 99].includes(code)) return '雷雨'
  return '天气未知'
}

function toTemperature(value) {
  const temperature = Number.parseFloat(String(value).replace(/[^\-\d.]/g, ''))
  return Number.isFinite(temperature) ? Math.round(temperature) : null
}

async function getWeatherFromChinaWeather(place) {
  const cityId = String(place.cityId || place.id || '')
  if (!/^\d{6,12}$/.test(cityId)) throw new Error('城市缺少中国天气网编码')

  const [cityInfo, currentInfo] = await Promise.all([
    fetchJsonWithTimeout(`https://www.weather.com.cn/data/cityinfo/${cityId}.html`, 7000),
    fetchJsonWithTimeout(`https://www.weather.com.cn/data/sk/${cityId}.html`, 7000),
  ])
  const forecast = cityInfo.weatherinfo || {}
  const current = currentInfo.weatherinfo || {}
  const temperature = toTemperature(current.temp || forecast.temp)
  if (temperature === null) throw new Error('中国天气网没有返回当前温度')
  const description = describeChineseWeather(forecast.weather || current.weather)
  return {
    name: normalizeCityName(current.city || forecast.city || place.name),
    label: description,
    temperature,
  }
}

async function getWeatherFromItboy(place) {
  const cityId = String(place.cityId || place.id || '')
  if (!/^\d{6,12}$/.test(cityId)) throw new Error('城市缺少天气编码')
  const data = await fetchJsonWithTimeout(`https://t.weather.itboy.net/api/weather/city/${cityId}`, 7000)
  if (Number(data.status) !== 200 || !data.data) throw new Error('备用天气服务没有返回有效数据')
  const temperature = toTemperature(data.data.wendu)
  if (temperature === null) throw new Error('备用天气服务没有返回当前温度')
  const description = describeChineseWeather(data.data.forecast?.[0]?.type)
  return {
    name: normalizeCityName(data.cityInfo?.city || place.name),
    label: description,
    temperature,
  }
}

async function getWeatherFromOpenMeteo(place) {
  if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) throw new Error('城市缺少经纬度')
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,is_day,weather_code',
    timezone: 'auto',
  })
  const data = await fetchJsonWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`)
  const current = data.current
  const temperature = toTemperature(current?.temperature_2m)
  if (!current || temperature === null || typeof current.weather_code !== 'number') {
    throw new Error('备用天气服务返回了无效数据')
  }
  return {
    name: place.name,
    label: describeOpenMeteoWeather(current.weather_code, current.is_day === 1),
    temperature,
    isDay: current.is_day === 1,
  }
}

export async function getCurrentWeather(place) {
  const normalizedPlace = assertPlace(place)
  try {
    // 两个中国天气接口并行请求，优先使用先返回的中国源，避免单个节点拖慢切换城市。
    return await Promise.any([
      getWeatherFromChinaWeather(normalizedPlace),
      getWeatherFromItboy(normalizedPlace),
    ])
  } catch (primaryError) {
    if (!Number.isFinite(normalizedPlace.latitude) || !Number.isFinite(normalizedPlace.longitude)) {
      throw new Error('中国天气服务暂不可用，请稍后重试')
    }
    try {
      return await getWeatherFromOpenMeteo(normalizedPlace)
    } catch (fallbackError) {
      throw new Error(fallbackError?.message || primaryError?.message || '天气服务暂不可用')
    }
  }
}
