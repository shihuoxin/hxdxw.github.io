import assert from 'node:assert/strict'
import { test } from 'node:test'
import { locateByIp } from '../src/services/weather.js'

const ZXINC_URL = 'https://ip.zxinc.org/api.php?type=json'
const IPWHO_URL = 'https://ipwho.is/?lang=zh-CN'
const IPAPI_URL = 'https://ipapi.co/json/'

function mockNetwork(t, routes = {}) {
  const calls = []
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { setTimeout, clearTimeout },
  })
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else delete globalThis.window
  })
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
