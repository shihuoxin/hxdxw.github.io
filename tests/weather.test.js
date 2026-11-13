import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCurrentWeather, locateByIp, searchCities } from '../src/services/weather.js'

const ZXINC_URL = 'https://ip.zxinc.org/api.php?type=json'
const IPWHO_URL = 'https://ipwho.is/?lang=zh-CN'
const IPAPI_URL = 'https://ipapi.co/json/'

function mockNetwork(t, routes = {}) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = String(input)
    calls.push(url)
    if (!Object.hasOwn(routes, url)) throw new Error(`模拟网络不可达: ${url}`)
    const payload = routes[url]
    return {
      ok: true,
      status: 200,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    }
  })
  return calls
}

test('ZXINC 的地区描述能定位郑州，并直接取得本地城市编码', async (t) => {
  const calls = mockNetwork(t, {
    [ZXINC_URL]: {
      code: 0,
      data: { country: '中国–河南–郑州', location: '中国–河南–郑州 移动' },
    },
  })

  const place = await locateByIp()

  assert.equal(place.name, '郑州')
  assert.equal(place.cityId, '101180101')
  assert.equal(calls.some((url) => url.startsWith('https://toy1.weather.com.cn/')), false)
  assert.equal(calls.some((url) => url.includes('geocoding-api.open-meteo.com')), false)
})

test('只有省份的 ZXINC 地区描述不能被当成城市', async (t) => {
  mockNetwork(t, {
    [ZXINC_URL]: {
      code: 0,
      data: { country: '中国–河南', location: '中国–河南 移动' },
    },
  })

  await assert.rejects(locateByIp())
})

test('IP 已有明确城市时，补充城市资料的接口失败仍保留城市', async (t) => {
  const calls = mockNetwork(t, {
    [ZXINC_URL]: { code: 0, data: { city: '赣州市', province: '江西省' } },
  })

  const place = await locateByIp()

  assert.equal(place.name, '赣州')
  assert.ok(calls.some((url) => url.includes('geocoding-api.open-meteo.com')))
})

test('ipwho 备用源可返回城市及坐标，并与其他 IP 源一起启动', async (t) => {
  const calls = mockNetwork(t, {
    [IPWHO_URL]: {
      success: true,
      city: 'Paris',
      region: 'Île-de-France',
      latitude: 48.8566,
      longitude: 2.3522,
    },
  })

  const place = await locateByIp()

  assert.equal(place.name, 'Paris')
  assert.equal(place.latitude, 48.8566)
  assert.equal(place.longitude, 2.3522)
  assert.deepEqual(new Set(calls.slice(0, 3)), new Set([ZXINC_URL, IPWHO_URL, IPAPI_URL]))
})

test('ipwho success:false 即使带城市字段也不能视为定位成功', async (t) => {
  mockNetwork(t, {
    [IPWHO_URL]: {
      success: false,
      message: 'Rate limit exceeded',
      city: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
    },
  })

  await assert.rejects(locateByIp())
})

test('所有 IP 源都不可达时拒绝定位', async (t) => {
  const calls = mockNetwork(t)

  await assert.rejects(locateByIp(), { name: 'Error' })
  assert.deepEqual(new Set(calls), new Set([ZXINC_URL, IPWHO_URL, IPAPI_URL]))
})

test('IP 源缺少经纬度时继续补充城市坐标，不能将 null 当作 0', async (t) => {
  const geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=Paris&count=5&language=zh&format=json'
  const calls = mockNetwork(t, {
    [IPWHO_URL]: {
      success: true,
      city: 'Paris',
      latitude: null,
      longitude: null,
    },
    [geocodingUrl]: {
      results: [{ id: 2988507, name: 'Paris', latitude: 48.8566, longitude: 2.3522 }],
    },
  })

  const place = await locateByIp()

  assert.equal(place.latitude, 48.8566)
  assert.equal(place.longitude, 2.3522)
  assert.ok(calls.includes(geocodingUrl))
})

test('无效坐标不会触发备用源查询，合法的零坐标仍可使用', async (t) => {
  const fallbackUrl = 'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m%2Cis_day%2Cweather_code&timezone=auto'
  const calls = mockNetwork(t, {
    [fallbackUrl]: { current: { temperature_2m: 25, is_day: 1, weather_code: 0 } },
  })

  for (const [latitude, longitude] of [[null, null], ['', ' '], [91, 0], [0, 181]]) {
    await assert.rejects(getCurrentWeather({ name: '测试城市', latitude, longitude }), /中国天气服务暂不可用/)
  }
  assert.equal(calls.length, 0)

  const weather = await getCurrentWeather({ name: '测试城市', latitude: 0, longitude: 0 })
  assert.equal(weather.temperature, 25)
  assert.deepEqual(calls, [fallbackUrl])
})

test('中国天气网返回数值 0°C 时保留实时温度，不误用预报温度', async (t) => {
  mockNetwork(t, {
    'https://www.weather.com.cn/data/cityinfo/101010100.html': {
      weatherinfo: { city: '北京', weather: '晴', temp: '8℃' },
    },
    'https://www.weather.com.cn/data/sk/101010100.html': {
      weatherinfo: { city: '北京', temp: 0 },
    },
  })

  const weather = await getCurrentWeather({ name: '北京', cityId: '101010100' })

  assert.equal(weather.temperature, 0)
  assert.equal(weather.label, '晴朗')
})

test('本地常用城市搜索不依赖网络，空查询不请求接口', async (t) => {
  const calls = mockNetwork(t)

  assert.deepEqual(await searchCities('  '), [])
  const results = await searchCities(' 北京市 ')

  assert.equal(results[0].name, '北京')
  assert.equal(results[0].cityId, '101010100')
  assert.equal(calls.length, 0)
})
