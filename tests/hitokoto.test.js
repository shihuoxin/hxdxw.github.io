import assert from 'node:assert/strict'
import { test } from 'node:test'

let serviceId = 0

function loadService() {
  // 服务会记录上次请求和句子，每个用例使用独立实例，避免状态相互影响。
  return import(`../src/services/hitokoto.js?test=${++serviceId}`)
}

function jsonResponse(payload) {
  return { ok: true, json: async () => payload }
}

test('一言接口返回的正常文本会移除首尾空白', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ hitokoto: '  认真生活。\n' }))
  const { getHitokoto } = await loadService()

  assert.deepEqual(await getHitokoto(), { text: '认真生活。' })
})

test('非字符串或纯空白的一言内容使用本地句子兜底', async (t) => {
  let payload
  t.mock.method(globalThis, 'fetch', async () => jsonResponse(payload))

  for (payload of [{ hitokoto: 42 }, { hitokoto: {} }, { hitokoto: ' \n ' }, null]) {
    const { getHitokoto } = await loadService()
    const { text } = await getHitokoto()

    assert.equal(typeof text, 'string')
    assert.ok(text.trim().length > 0)
    assert.equal(text, text.trim())
  }
})

test('网络失败后本地句子不重复，冷却结束前不重复请求接口', async (t) => {
  let now = 10_000
  t.mock.method(Date, 'now', () => now)
  t.mock.method(Math, 'random', () => 0)
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('模拟网络不可达')
  })
  const { getHitokoto } = await loadService()

  const first = await getHitokoto()
  now += 100
  const second = await getHitokoto()
  assert.notEqual(first.text, second.text)
  assert.equal(fetchMock.mock.callCount(), 1)

  now += 2200
  await getHitokoto()
  assert.equal(fetchMock.mock.callCount(), 2)
})
