import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSearchSuggestions } from '../src/services/searchSuggestions.js'

// 用最小 DOM 替身验证 JSONP 的边界和资源释放，测试不依赖外部网络。
function mockJsonp(t, { appendError } = {}) {
  const scripts = []
  const timers = new Map()
  let timerId = 0
  const browser = {
    setTimeout(callback) {
      timers.set(++timerId, callback)
      return timerId
    },
    clearTimeout(id) {
      timers.delete(id)
    },
  }

  for (const [name, value] of Object.entries({
    window: browser,
    document: {
      createElement: () => ({ remove() { this.removed = true } }),
      head: {
        appendChild(script) {
          if (appendError) throw appendError
          scripts.push(script)
        },
      },
    },
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, value })
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous)
      else delete globalThis[name]
    })
  }

  return {
    scripts,
    timers,
    respond(payload) {
      const callback = new URL(scripts[0].src).searchParams.get('JsonCallback')
      browser[callback](payload)
    },
    assertCleaned() {
      assert.equal(timers.size, 0)
      assert.equal(scripts.every((script) => script.removed), true)
      assert.equal(Object.keys(browser).some((key) => key.startsWith('__homepageSuggestions_')), false)
    },
  }
}

test('联想结果过滤无效值、去重，并最多保留六条', async (t) => {
  const jsonp = mockJsonp(t)
  const pending = getSearchSuggestions('  你好  ', { engine: 'google' })

  assert.equal(new URL(jsonp.scripts[0].src).searchParams.get('query'), '你好')
  jsonp.respond(['你好', [' 你好 ', null, '', '你好', '世界', 1, '三', '四', '五', '六', '七']])

  assert.deepEqual(await pending, ['你好', '世界', '三', '四', '五', '六'])
  jsonp.assertCleaned()
})

test('空输入和超长输入不创建 JSONP 请求', async (t) => {
  const jsonp = mockJsonp(t)

  assert.deepEqual(await getSearchSuggestions('  '), [])
  assert.deepEqual(await getSearchSuggestions('字'.repeat(257)), [])
  assert.equal(jsonp.scripts.length, 0)
  jsonp.assertCleaned()
})

test('取消联想请求会释放脚本、回调和定时器', async (t) => {
  const jsonp = mockJsonp(t)
  const controller = new AbortController()
  const pending = getSearchSuggestions('你好', { signal: controller.signal })

  controller.abort()

  await assert.rejects(pending, { name: 'AbortError' })
  jsonp.assertCleaned()
})

test('已取消的信号不会再创建请求', async (t) => {
  const jsonp = mockJsonp(t)
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(getSearchSuggestions('你好', { signal: controller.signal }), { name: 'AbortError' })
  assert.equal(jsonp.scripts.length, 0)
  jsonp.assertCleaned()
})

test('联想超时后拒绝请求并清理资源', async (t) => {
  const jsonp = mockJsonp(t)
  const pending = getSearchSuggestions('你好')

  jsonp.timers.values().next().value()

  await assert.rejects(pending, { name: 'TimeoutError' })
  jsonp.assertCleaned()
})

test('无效联想响应不会留下脚本或回调', async (t) => {
  const jsonp = mockJsonp(t)
  const pending = getSearchSuggestions('你好')

  jsonp.respond({ suggestions: [] })

  await assert.rejects(pending, /Invalid search suggestions response/)
  jsonp.assertCleaned()
})

test('脚本加载失败时清理资源', async (t) => {
  const jsonp = mockJsonp(t)
  const pending = getSearchSuggestions('你好')

  jsonp.scripts[0].onerror()

  await assert.rejects(pending, /Search suggestions unavailable/)
  jsonp.assertCleaned()
})

test('脚本无法插入页面时仍清理已注册的回调和定时器', async (t) => {
  const jsonp = mockJsonp(t, { appendError: new Error('无法插入脚本') })

  await assert.rejects(getSearchSuggestions('你好'), /无法插入脚本/)
  jsonp.assertCleaned()
})
