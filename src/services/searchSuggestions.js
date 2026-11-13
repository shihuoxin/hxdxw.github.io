// 各引擎共用必应联想源，提交搜索时仍跳转到用户选择的引擎。
// 使用 JSONP 以兼容纯静态部署，无需代理或服务端密钥。
const SUGGESTION_ENDPOINT = 'https://api.bing.com/osjson.aspx'
const REQUEST_TIMEOUT = 3500
const MAX_QUERY_LENGTH = 256
let requestNumber = 0

export async function getSearchSuggestions(query, { engine = 'bing', signal } = {}) {
  if (signal?.aborted) throw new DOMException('Search suggestions cancelled', 'AbortError')

  const normalizedQuery = String(query ?? '').trim()
  if (!normalizedQuery || normalizedQuery.length > MAX_QUERY_LENGTH) return []

  const engineNamespace = String(engine).replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'search'
  const callbackName = `__homepageSuggestions_${engineNamespace}_${Date.now().toString(36)}_${++requestNumber}`

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const url = new URL(SUGGESTION_ENDPOINT)
    url.searchParams.set('query', normalizedQuery)
    url.searchParams.set('JsonType', 'callback')
    url.searchParams.set('JsonCallback', callbackName)

    let settled = false
    let timeout

    function finish(error, suggestions) {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
      script.onerror = null
      script.remove()
      // 接口调用前会检查回调是否为函数，删除后晚到的响应也不会再次生效。
      delete window[callbackName]
      if (error) reject(error)
      else resolve(suggestions)
    }

    function abort() {
      finish(new DOMException('Search suggestions cancelled', 'AbortError'))
    }

    window[callbackName] = (payload) => {
      if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
        finish(new Error('Invalid search suggestions response'))
        return
      }

      const suggestions = [...new Set(payload[1]
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean))].slice(0, 6)
      finish(null, suggestions)
    }

    script.async = true
    script.referrerPolicy = 'no-referrer'
    script.src = url.href
    script.onerror = () => finish(new Error('Search suggestions unavailable'))
    signal?.addEventListener('abort', abort, { once: true })
    timeout = window.setTimeout(() => {
      finish(new DOMException('Search suggestions timed out', 'TimeoutError'))
    }, REQUEST_TIMEOUT)
    try {
      document.head.appendChild(script)
    } catch (error) {
      finish(error)
    }
  })
}
