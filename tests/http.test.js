import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchJsonWithTimeout, fetchTextWithTimeout } from '../src/utils/http.js'

const URL = 'https://example.test/data'
const TIMEOUT_MESSAGE = '请求超时，请检查网络后重试'

test('JSON 和文本请求无需 window，解析成功后释放定时器', async (t) => {
  const clearTimer = t.mock.method(globalThis, 'clearTimeout')
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    assert.equal(signal.aborted, false)
    return {
      ok: true,
      json: async () => ({ city: '北京' }),
      text: async () => 'callback([]);',
    }
  })

  assert.deepEqual(await fetchJsonWithTimeout(URL), { city: '北京' })
  assert.equal(await fetchTextWithTimeout(URL), 'callback([]);')
  assert.equal(clearTimer.mock.callCount(), 2)
})

test('HTTP 错误包含状态码，不继续解析响应体并释放定时器', async (t) => {
  const clearTimer = t.mock.method(globalThis, 'clearTimeout')
  const parse = t.mock.fn()
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503, json: parse }))

  await assert.rejects(fetchJsonWithTimeout(URL), { message: '请求失败（503）' })
  assert.equal(parse.mock.callCount(), 0)
  assert.equal(clearTimer.mock.callCount(), 1)
})

test('响应解析失败保留原始错误并释放定时器', async (t) => {
  const error = new SyntaxError('无效 JSON')
  const clearTimer = t.mock.method(globalThis, 'clearTimeout')
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => { throw error },
  }))

  await assert.rejects(fetchJsonWithTimeout(URL), (reason) => reason === error)
  assert.equal(clearTimer.mock.callCount(), 1)
})

for (const error of [new TypeError('网络不可达'), null]) {
  test(`请求失败保留原始原因：${error?.message ?? 'null'}`, async (t) => {
    const clearTimer = t.mock.method(globalThis, 'clearTimeout')
    t.mock.method(globalThis, 'fetch', async () => { throw error })

    await assert.rejects(fetchJsonWithTimeout(URL), (reason) => reason === error)
    assert.equal(clearTimer.mock.callCount(), 1)
  })
}

test('请求超时会中止网络并返回中文错误', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let requestSignal
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => {
    requestSignal = signal
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  })

  const rejection = assert.rejects(fetchJsonWithTimeout(URL, 50), { message: TIMEOUT_MESSAGE })
  t.mock.timers.tick(50)

  await rejection
  assert.equal(requestSignal.aborted, true)
})

test('收到响应头后，读取响应体仍受超时保护', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let startParsing
  const parsingStarted = new Promise((resolve) => { startParsing = resolve })
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      startParsing()
    }),
  }))

  const rejection = assert.rejects(fetchJsonWithTimeout(URL, 50), { message: TIMEOUT_MESSAGE })
  await parsingStarted
  t.mock.timers.tick(50)

  await rejection
})
