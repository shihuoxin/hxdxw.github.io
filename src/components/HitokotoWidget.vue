<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-vue-next'
import { getHitokoto } from '../services/hitokoto.js'

const quote = ref({ text: '正在准备一句话…' })
const loading = ref(true)
const copied = ref(false)
const copyMessage = ref('')
let copyTimer
let activeRequest = 0

async function refreshQuote() {
  const requestId = ++activeRequest
  loading.value = true
  // 只应用最后一次请求，避免连续点击刷新时旧响应覆盖新内容。
  const nextQuote = await getHitokoto()
  if (requestId !== activeRequest) return
  quote.value = nextQuote
  loading.value = false
}

async function copyQuote() {
  window.clearTimeout(copyTimer)
  try {
    await navigator.clipboard.writeText(quote.value.text)
    copied.value = true
    copyMessage.value = '已复制'
  } catch {
    copied.value = false
    copyMessage.value = '复制失败'
  }
  // 反馈只保留短暂时间，避免长期占据页面空间。
  copyTimer = window.setTimeout(() => {
    copied.value = false
    copyMessage.value = ''
  }, 1600)
}

function searchQuote() {
  const url = `https://www.baidu.com/s?wd=${encodeURIComponent(quote.value.text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(refreshQuote)
onBeforeUnmount(() => window.clearTimeout(copyTimer))
</script>

<template>
  <section class="fixed bottom-[26px] left-1/2 z-30 w-fit max-w-[calc(100vw-32px)] -translate-x-1/2 sm:bottom-[34px]" aria-label="一言">
    <div class="quote-strip">
      <div class="quote-content" :class="{ 'is-loading': loading }">
        <p class="quote-text">
          「{{ quote.text }}」
        </p>
      </div>
      <div class="hitokoto-actions flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button type="button" class="grid size-8 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf725e]/35" :aria-label="copied ? '已复制一言' : '复制一言'" :title="copied ? '已复制' : '复制'" @click="copyQuote">
          <Check v-if="copied" :size="15" class="text-[#5d8c70]" />
          <Copy v-else :size="15" :stroke-width="1.8" />
        </button>
        <button type="button" class="grid size-8 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf725e]/35" aria-label="刷新一言" title="换一句" :disabled="loading" @click="refreshQuote">
          <RefreshCw :size="15" :stroke-width="1.8" :class="{ 'animate-spin': loading }" />
        </button>
        <button type="button" class="grid size-8 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf725e]/35" aria-label="搜索这句话" title="搜索" @click="searchQuote">
          <ExternalLink :size="15" :stroke-width="1.8" />
        </button>
      </div>
    </div>
    <Transition name="fade-rise">
      <span v-if="copyMessage" role="status" class="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 rounded-full bg-[#34433b] px-3 py-1.5 text-xs text-white shadow-lg">{{ copyMessage }}</span>
    </Transition>
  </section>
</template>
