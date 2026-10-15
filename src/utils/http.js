/**
 * 统一处理公开接口请求的超时、HTTP 状态和 JSON/文本解析，避免每个服务重复实现。
 */
async function fetchWithTimeout(url, parseResponse, timeoutMs) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`请求失败（${response.status}）`)
    return await parseResponse(response)
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('请求超时，请检查网络后重试')
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

export function fetchJsonWithTimeout(url, timeoutMs = 9000) {
  return fetchWithTimeout(url, (response) => response.json(), timeoutMs)
}

// 天气网城市检索可能返回 JSONP，因此保留文本请求入口交给服务层解析。
export function fetchTextWithTimeout(url, timeoutMs = 9000) {
  return fetchWithTimeout(url, (response) => response.text(), timeoutMs)
}
