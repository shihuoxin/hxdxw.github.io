import { fetchJsonWithTimeout } from '../utils/http.js'

const FALLBACK_QUOTES = [
  '慢慢来，比较快。',
  '把普通的日子过得浪漫一些。',
  '山高路远，看世界，也找自己。',
  '愿你走出半生，归来仍是少年。',
  '生活明朗，万物可爱。',
]

let previousText = ''
let lastRequestAt = 0

function chooseFallback() {
  const choices = FALLBACK_QUOTES.filter((text) => text !== previousText)
  const text = choices[Math.floor(Math.random() * choices.length)]
  previousText = text
  return { text }
}

export async function getHitokoto() {
  const now = Date.now()
  // 限制刷新频率，接口短时间不可用时直接使用本地句子。
  if (now - lastRequestAt < 2200) return chooseFallback()
  lastRequestAt = now

  try {
    const data = await fetchJsonWithTimeout('https://v1.hitokoto.cn/?encode=json&c=i', 6500)
    if (!data.hitokoto) throw new Error('一言服务返回了空内容')

    previousText = data.hitokoto
    return { text: data.hitokoto }
  } catch {
    return chooseFallback()
  }
}
