<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Check, ChevronDown, Grid2X2, Search, X } from 'lucide-vue-next'
import { getSearchSuggestions } from '../services/searchSuggestions.js'

const searchEngines = [
  { id: 'bing', label: '必应', icon: '/search-engines/bing.png', buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
  { id: 'google', label: 'Google', icon: '/search-engines/google.png', buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}` },
  { id: 'bilibili', label: '哔哩哔哩', icon: '/search-engines/bilibili.png', buildUrl: (query) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(query)}` },
  { id: 'douyin', label: '抖音', icon: '/search-engines/douyin.png', buildUrl: (query) => `https://www.douyin.com/search/${encodeURIComponent(query)}` },
]

const siteLinks = [
  { id: 'mikutap', label: 'Mikutap', href: 'http://ep289690.ep.chost.shop/mikutap/index.html' },
  { id: 'markdown', label: 'MD editor', href: 'http://ep289690.ep.chost.shop/markdown-editor/index.html' },
  { id: 'partition', label: '整G分区工具', href: 'http://ep289690.ep.chost.shop/disk-partition-calculator/index.html' },
  { id: 'aspect', label: '宽高比计算器', href: 'http://ep289690.ep.chost.shop/aspect-ratio-calculator/index.html' },
]

const navRoot = ref(null)
const engineTrigger = ref(null)
const siteTrigger = ref(null)
const searchInput = ref(null)
const suggestionPanel = ref(null)
const nativePopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype
const navigationId = useId()
const query = ref('')
const openMenu = ref(null)
const selectedEngineId = ref('bing')
const selectedEngine = computed(() => searchEngines.find((engine) => engine.id === selectedEngineId.value) || searchEngines[0])
const suggestions = ref([])
const suggestionIndex = ref(-1)
const suggestionsLoading = ref(false)
const isComposing = ref(false)
const suggestionsAbove = ref(false)
const suggestionsMaxHeight = ref(320)
const suggestionAnchor = ref({ left: 0, top: 0, bottom: 0, width: 0 })
const suggestionsVisible = computed(() => openMenu.value === 'suggestions' && suggestions.value.length > 0 && !isComposing.value)
const activeSuggestionId = computed(() => suggestionsVisible.value && suggestionIndex.value >= 0 ? `${navigationId}-suggestion-${suggestionIndex.value}` : undefined)
const suggestionsStyle = computed(() => ({
  maxHeight: `${suggestionsMaxHeight.value}px`,
  ...(nativePopover ? {
    position: 'fixed',
    left: `${suggestionAnchor.value.left}px`,
    right: 'auto',
    top: `${suggestionsAbove.value ? suggestionAnchor.value.top - 10 : suggestionAnchor.value.bottom + 10}px`,
    bottom: 'auto',
    width: `${suggestionAnchor.value.width}px`,
    transform: suggestionsAbove.value ? 'translateY(-100%)' : 'none',
  } : suggestionsAbove.value ? { top: 'auto', bottom: 'calc(100% + 10px)' } : {}),
}))
let siteCloseTimer
let suggestionTimer
let suggestionController
let suggestionRequestId = 0
let suggestionsEnabled = false

function cancelSuggestionRequest() {
  window.clearTimeout(suggestionTimer)
  suggestionRequestId++
  suggestionController?.abort()
  suggestionController = null
  suggestionsLoading.value = false
}

function closeMenu(restoreFocus = false) {
  const trigger = openMenu.value === 'engines' ? engineTrigger.value : openMenu.value === 'sites' ? siteTrigger.value : searchInput.value
  openMenu.value = null
  suggestionIndex.value = -1
  suggestionsEnabled = false
  cancelSuggestionRequest()
  if (restoreFocus) trigger?.focus()
}

async function showMenu(menu, last = false) {
  closeMenu()
  openMenu.value = menu
  await nextTick()
  const items = navRoot.value.querySelectorAll(`[data-menu="${menu}"] [role^="menuitem"]`)
  const selected = Array.from(items).find((item) => item.getAttribute('aria-checked') === 'true')
  const target = last ? items[items.length - 1] : selected || items[0]
  target?.focus()
}

function toggleMenu(menu) {
  if (openMenu.value === menu) closeMenu()
  else showMenu(menu)
}

function handleMenuKeydown(event) {
  const items = Array.from(event.currentTarget.querySelectorAll('[role^="menuitem"]'))
  const index = items.indexOf(document.activeElement)
  let nextIndex
  if (event.key === 'ArrowDown') nextIndex = (index + 1) % items.length
  if (event.key === 'ArrowUp') nextIndex = (index - 1 + items.length) % items.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = items.length - 1
  if (nextIndex === undefined) return
  event.preventDefault()
  items[nextIndex]?.focus()
}

function selectEngine(engineId) {
  selectedEngineId.value = engineId
  openMenu.value = null
  try {
    window.localStorage.setItem('preferred-search-engine', engineId)
  } catch {
    // The search still works when browser storage is unavailable.
  }
  searchInput.value?.focus()
}

function submitSearch() {
  if (isComposing.value) return
  const value = suggestionsVisible.value && suggestionIndex.value >= 0
    ? suggestions.value[suggestionIndex.value]
    : query.value
  searchFor(value)
}

function searchFor(value) {
  const normalizedQuery = value.trim()
  closeMenu()
  if (!normalizedQuery) {
    searchInput.value?.focus()
    return
  }

  query.value = normalizedQuery
  window.open(selectedEngine.value.buildUrl(normalizedQuery), '_blank', 'noopener,noreferrer')
}

function handleDocumentPointerDown(event) {
  if (!navRoot.value?.contains(event.target)) closeMenu()
}

function handleDocumentKeydown(event) {
  if (isComposing.value || event.isComposing || event.keyCode === 229) return
  if (event.key === 'Escape' && (openMenu.value || suggestionsEnabled)) {
    event.preventDefault()
    closeMenu(true)
  }
}

function handleFocusOut(event) {
  if (event.relatedTarget && !navRoot.value?.contains(event.relatedTarget)) closeMenu()
}

function scheduleSiteClose() {
  // Let the anchor finish its native new-tab navigation before removing it.
  window.clearTimeout(siteCloseTimer)
  siteCloseTimer = window.setTimeout(() => closeMenu(), 0)
}

function updateSuggestionPosition() {
  if (!suggestionsVisible.value || !navRoot.value) return
  const rect = navRoot.value.querySelector('.search-bar').getBoundingClientRect()
  suggestionAnchor.value = { left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width }
  const viewport = window.visualViewport
  const viewportTop = viewport?.offsetTop || 0
  const viewportBottom = viewportTop + (viewport?.height || window.innerHeight)
  const below = viewportBottom - rect.bottom - 22
  const above = rect.top - viewportTop - 22
  suggestionsAbove.value = below < 160 && above > below
  suggestionsMaxHeight.value = Math.max(44, Math.min(360, suggestionsAbove.value ? above : below))
}

async function revealSuggestions() {
  openMenu.value = 'suggestions'
  await nextTick()
  updateSuggestionPosition()
  await nextTick()
  // A native popover keeps the list above other floating widgets without moving focus.
  const panel = suggestionPanel.value
  if (nativePopover && panel && !panel.matches(':popover-open')) panel.showPopover()
}

function scheduleSuggestions() {
  cancelSuggestionRequest()
  suggestions.value = []
  suggestionIndex.value = -1
  if (openMenu.value === 'suggestions') openMenu.value = null
  const value = query.value.trim()
  if (!value || !suggestionsEnabled || isComposing.value || document.activeElement !== searchInput.value) return
  if (openMenu.value === 'engines' || openMenu.value === 'sites') return

  const requestId = suggestionRequestId
  suggestionTimer = window.setTimeout(async () => {
    suggestionsLoading.value = true
    const controller = new AbortController()
    suggestionController = controller
    try {
      const results = await getSearchSuggestions(value, { engine: selectedEngineId.value, signal: controller.signal })
      if (requestId !== suggestionRequestId || controller.signal.aborted) return
      suggestions.value = results
      if (results.length && suggestionsEnabled && document.activeElement === searchInput.value) {
        await revealSuggestions()
      }
    } catch {
      // Suggestions are optional; the typed query remains searchable on failure.
    } finally {
      if (requestId === suggestionRequestId) {
        suggestionsLoading.value = false
        suggestionController = null
      }
    }
  }, 220)
}

function handleSearchFocus() {
  closeMenu()
  suggestionsEnabled = true
  scheduleSuggestions()
}

function handleSearchInput() {
  suggestionsEnabled = true
}

function clearQuery() {
  query.value = ''
  suggestionsEnabled = true
  searchInput.value?.focus()
}

function finishComposition() {
  isComposing.value = false
  suggestionsEnabled = true
}

async function handleSearchKeydown(event) {
  if (isComposing.value || event.isComposing || event.keyCode === 229) return
  if (event.key === 'Tab') {
    closeMenu()
    return
  }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !suggestions.value.length) return
  event.preventDefault()
  suggestionsEnabled = true
  const count = suggestions.value.length
  suggestionIndex.value = event.key === 'ArrowDown'
    ? (suggestionIndex.value + 1) % count
    : (suggestionIndex.value < 0 ? count - 1 : (suggestionIndex.value - 1 + count) % count)
  await revealSuggestions()
  document.getElementById(activeSuggestionId.value)?.scrollIntoView({ block: 'nearest' })
}

watch([query, selectedEngineId, isComposing], scheduleSuggestions)

onMounted(() => {
  try {
    const savedEngine = window.localStorage.getItem('preferred-search-engine')
    if (searchEngines.some((engine) => engine.id === savedEngine)) selectedEngineId.value = savedEngine
  } catch {
    // Use the default engine when browser storage is unavailable.
  }

  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('resize', updateSuggestionPosition)
  window.addEventListener('scroll', updateSuggestionPosition, { passive: true })
  window.visualViewport?.addEventListener('resize', updateSuggestionPosition)
  window.visualViewport?.addEventListener('scroll', updateSuggestionPosition)
})

onBeforeUnmount(() => {
  window.clearTimeout(siteCloseTimer)
  cancelSuggestionRequest()
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('resize', updateSuggestionPosition)
  window.removeEventListener('scroll', updateSuggestionPosition)
  window.visualViewport?.removeEventListener('resize', updateSuggestionPosition)
  window.visualViewport?.removeEventListener('scroll', updateSuggestionPosition)
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-7 sm:text-left">
    <button
      type="button"
      class="group relative grid size-24 shrink-0 place-items-center rounded-full border border-[#dfe6e2] bg-[#eef2ef] outline-none transition duration-300 hover:border-[#d6b3a7] hover:bg-[#f1e9e6] focus-visible:ring-2 focus-visible:ring-[#cf725e]/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f8faf9]"
      aria-label="头像位置，悬停查看问候"
    >
      <img src="/avatar.jpg" alt="火芯Ah 的头像" class="size-full rounded-full object-cover" />
      <span class="wechat-bubble pointer-events-none absolute bottom-[calc(100%+1px)] left-[calc(50%+90px)] w-max -translate-x-1/2 translate-y-1 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <svg class="wechat-bubble-shape" viewBox="0 0 128 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M16 0H112C120.84 0 128 7.16 128 16V20C128 28.84 120.84 36 112 36H24C16 36 10 39 5 43C4.3 43.6 3.5 42.9 3.9 42.1C6.2 37.7 6.8 34.8 6 31.8C2.3 28.9 0 24.3 0 19.5V16C0 7.16 7.16 0 16 0Z" />
        </svg>
        <span class="relative">Hello World！</span>
      </span>
    </button>

    <div class="min-w-0">
      <h1 class="profile-title text-[28px] font-semibold leading-tight tracking-[0]">火芯Ah</h1>
      <p class="profile-copy mt-2 text-[15px] leading-6">你发现这里了？ヾ(^▽^*)))</p>
    </div>
  </div>

  <nav ref="navRoot" class="nav-buttons" aria-label="搜索与工具导航" @focusout="handleFocusOut">
    <form class="search-bar" role="search" @submit.prevent="submitSearch">
      <div class="menu-wrap">
        <button ref="engineTrigger" type="button" class="search-control engine-trigger" aria-haspopup="menu" :aria-controls="`${navigationId}-engines`" :aria-expanded="openMenu === 'engines'" :aria-label="`搜索引擎：${selectedEngine.label}，点击切换`" :title="selectedEngine.label" @click="toggleMenu('engines')" @keydown.down.prevent="showMenu('engines')" @keydown.up.prevent="showMenu('engines', true)">
          <img class="engine-icon" :src="selectedEngine.icon" alt="" width="20" height="20" aria-hidden="true" />
          <ChevronDown :size="15" stroke-width="2" aria-hidden="true" />
        </button>

        <div v-if="openMenu === 'engines'" :id="`${navigationId}-engines`" class="nav-menu engine-menu" data-menu="engines" role="menu" aria-label="搜索引擎" @keydown="handleMenuKeydown">
          <button v-for="engine in searchEngines" :key="engine.id" type="button" class="menu-item" role="menuitemradio" tabindex="-1" :aria-checked="selectedEngineId === engine.id" @click="selectEngine(engine.id)">
            <img class="engine-icon" :src="engine.icon" alt="" width="20" height="20" aria-hidden="true" />
            <span>{{ engine.label }}</span>
            <Check v-if="selectedEngineId === engine.id" class="menu-check" :size="15" stroke-width="2.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <span class="search-divider" aria-hidden="true"></span>

      <label class="search-input-wrap">
        <span class="sr-only">搜索内容</span>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          :aria-expanded="suggestionsVisible"
          :aria-controls="`${navigationId}-suggestions`"
          :aria-activedescendant="activeSuggestionId"
          :aria-busy="suggestionsLoading"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="搜索内容..."
          aria-label="搜索内容"
          @focus="handleSearchFocus"
          @input="handleSearchInput"
          @keydown="handleSearchKeydown"
          @compositionstart="isComposing = true"
          @compositionend="finishComposition"
        />
        <button v-if="query" class="search-clear" type="button" aria-label="清除搜索内容" title="清除" @pointerdown.prevent @click="clearQuery">
          <X :size="15" stroke-width="2.2" aria-hidden="true" />
        </button>
      </label>

      <button class="search-submit" type="submit" aria-label="提交搜索" title="搜索">
        <Search :size="17" stroke-width="2.2" aria-hidden="true" />
      </button>

      <span class="search-divider" aria-hidden="true"></span>

      <div class="menu-wrap">
        <button ref="siteTrigger" type="button" class="search-control site-trigger" aria-haspopup="menu" :aria-controls="`${navigationId}-sites`" :aria-expanded="openMenu === 'sites'" aria-label="打开工具菜单" title="工具" @click="toggleMenu('sites')" @keydown.down.prevent="showMenu('sites')" @keydown.up.prevent="showMenu('sites', true)">
          <Grid2X2 :size="16" stroke-width="2" aria-hidden="true" />
          <span class="site-label">工具</span>
          <ChevronDown :size="15" stroke-width="2" aria-hidden="true" />
        </button>

        <div v-if="openMenu === 'sites'" :id="`${navigationId}-sites`" class="nav-menu site-menu" data-menu="sites" role="menu" aria-label="工具" @keydown="handleMenuKeydown">
          <a v-for="site in siteLinks" :key="site.id" class="site-item" :href="site.href" target="_blank" rel="noopener noreferrer" role="menuitem" tabindex="-1" @click="scheduleSiteClose">
            <span class="site-icon" aria-hidden="true">
              <svg v-if="site.id === 'mikutap'" width="15" height="15" viewBox="0 0 200 200">
                <path d="M 50 160 L 50 40 L 100 140 L 150 40 L 150 160" fill="none" stroke="#11A6B9" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="site.id === 'markdown'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M6 15.5 V9.5 L9.5 13 L13 9.5 V15.5" />
                <path d="M17 9.5 V15.5 M14.5 13 L17 15.5 L19.5 13" />
              </svg>
              <svg v-else-if="site.id === 'partition'" width="15" height="15" viewBox="0 0 1024 1024" fill="currentColor">
        <path d="M896 42.666667H128c-12.8 0-21.333333 8.533333-21.333333 21.333333v896c0 12.8 8.533333 21.333333 21.333333 21.333333h768c12.8 0 21.333333-8.533333 21.333333-21.333333V64c0-12.8-8.533333-21.333333-21.333333-21.333333z m-21.333333 896H149.333333V85.333333h725.333334v853.333334zM234.666667 128H192v64h42.666667V128z m597.333333 0h-42.666667v64h42.666667V128z m-192 746.666667h192v-42.666667h-192v42.666667z m-142.933333-305.066667c4.266667 4.266667 10.666667 6.4 14.933333 6.4s10.666667-2.133333 14.933333-6.4l64-64c8.533333-8.533333 8.533333-21.333333 0-29.866667l-64-64c-8.533333-8.533333-21.333333-8.533333-29.866666 0l-64 64c-8.533333 8.533333-8.533333 21.333333 0 29.866667l64 64z m14.933333-113.066667l34.133333 34.133334-34.133333 34.133333-34.133333-34.133333 34.133333-34.133334zM264.533333 876.8c4.266667 2.133333 8.533333 4.266667 12.8 4.266667h4.266667c6.4-2.133333 10.666667-6.4 14.933333-10.666667l59.733334-117.333333 36.266666 32c4.266667 4.266667 8.533333 6.4 14.933334 6.4h230.4c6.4 0 10.666667-2.133333 14.933333-6.4l151.466667-160c4.266667-4.266667 6.4-8.533333 6.4-14.933334V373.333333c0-6.4-2.133333-10.666667-6.4-14.933333l-151.466667-160c-4.266667-4.266667-8.533333-6.4-14.933333-6.4H407.466667c-6.4 0-10.666667 2.133333-14.933334 6.4l-172.8 160c-4.266667 4.266667-6.4 10.666667-6.4 14.933333v236.8c0 6.4 2.133333 10.666667 6.4 14.933334l72.533334 66.133333-108.8 85.333333c-4.266667 4.266667-8.533333 10.666667-8.533334 17.066667s2.133333 12.8 8.533334 17.066667l81.066666 66.133333z m-8.533333-277.333333V381.866667l160-147.2h211.2l138.666667 147.2v219.733333L629.333333 746.666667h-211.2l-38.4-34.133334 32-61.866666c4.266667-8.533333 2.133333-19.2-6.4-25.6-8.533333-6.4-19.2-6.4-27.733333 0l-51.2 40.533333-70.4-66.133333z m68.266667 119.466666l-53.333334 106.666667-40.533333-32 93.866667-74.666667z" fill="currentColor" p-id="5461"></path>
      </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="8" width="18" height="9" rx="2" />
                <rect x="14" y="4" width="8" height="8" rx="2" />
                <circle cx="14" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
                <path d="M4 20h17 M4 18v4 M21 18v4 M22 5v11 M20 5h4 M20 16h4" />
              </svg>
            </span>
            <span>{{ site.label }}</span>
          </a>
        </div>
      </div>

      <div
        v-if="suggestionsVisible"
        ref="suggestionPanel"
        :id="`${navigationId}-suggestions`"
        class="nav-menu suggestions-menu"
        :style="suggestionsStyle"
        :popover="nativePopover ? 'manual' : undefined"
        role="listbox"
        aria-label="搜索联想"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :id="`${navigationId}-suggestion-${index}`"
          :key="suggestion"
          type="button"
          class="suggestion-item"
          role="option"
          tabindex="-1"
          :aria-selected="suggestionIndex === index"
          @pointerdown.prevent
          @pointermove="suggestionIndex = index"
          @click="searchFor(suggestion)"
        >
          <Search :size="15" stroke-width="1.8" aria-hidden="true" />
          <span>{{ suggestion }}</span>
        </button>
      </div>
    </form>
  </nav>
</template>

<style scoped>
.wechat-bubble {
  padding: 8px 14px;
  color: #40533d;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

.wechat-bubble-shape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: calc(100% + 8px);
  fill: #eef1f0;
}

.nav-buttons {
  --transition: 180ms ease;
  --search-text: var(--profile-title, #24312c);
  --search-muted: var(--profile-copy, #4b605a);
  --search-hover: rgba(255, 255, 255, .34);
  --search-background: rgba(248, 250, 249, .28);
  --search-border: rgba(77, 103, 134, .28);
  --search-shadow: 0 8px 22px rgba(33, 66, 108, .08);
  position: relative;
  z-index: 30;
  display: flex;
  justify-content: center;
  width: 100%;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: min(100%, 560px);
  min-height: 56px;
  padding: 6px 8px;
  color: var(--search-text);
  background: var(--search-background);
  border: 1px solid var(--search-border);
  border-radius: 50px;
  box-shadow: var(--search-shadow);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.search-bar:focus-within,
.search-bar:focus-within .nav-menu {
  border-color: rgba(77, 103, 134, .42);
  box-shadow: 0 12px 28px rgba(33, 66, 108, .12);
}

@media (hover: hover) {
  .search-bar:hover {
    transform: translateY(-2px);
  }

  .search-bar:hover,
  .search-bar:hover .nav-menu {
    border-color: rgba(77, 103, 134, .38);
    box-shadow: 0 12px 28px rgba(33, 66, 108, .12);
  }
}

.menu-wrap {
  flex: 0 0 auto;
}

.search-control,
.search-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--search-text);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), transform var(--transition);
}

.search-control {
  gap: 6px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.search-control:hover,
.search-control[aria-expanded='true'],
.search-submit:hover {
  background: var(--search-hover);
}

.search-control:focus-visible,
.search-clear:focus-visible,
.search-submit:focus-visible,
.menu-item:focus-visible,
.site-item:focus-visible {
  outline: 2px solid rgba(207, 114, 94, .55);
  outline-offset: 2px;
}

.engine-trigger {
  width: 56px;
  padding: 0 7px;
}

.site-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.engine-icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.search-divider {
  width: 1px;
  height: 22px;
  flex: 0 0 auto;
  background: rgba(77, 103, 134, .2);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  padding: 0 12px;
}

.search-input-wrap input {
  width: 100%;
  min-width: 0;
  padding: 0;
  color: var(--search-text);
  font: inherit;
  font-size: 14px;
  background: transparent;
  border: 0;
  outline: none;
}

.search-input-wrap input::placeholder {
  color: var(--search-muted);
  opacity: .8;
}

.search-clear,
.search-submit {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  color: var(--search-muted);
  opacity: .82;
  border-radius: 50%;
}

.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), opacity var(--transition);
}

.search-clear:hover,
.search-submit:hover {
  color: var(--search-text);
  opacity: 1;
}

.nav-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: -1px;
  right: -1px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  height: auto;
  padding: 7px;
  background: var(--search-background);
  border: 1px solid var(--search-border);
  border-radius: 28px;
  box-shadow: var(--search-shadow);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.menu-item,
.site-item {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  width: auto;
  min-height: 38px;
  padding: 7px 12px;
  color: var(--search-text);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 999px;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.menu-item:hover,
.site-item:hover,
.menu-item[aria-checked='true'] {
  background: var(--search-hover);
}

[data-background-tone='dark'] .nav-buttons {
  --search-border: rgba(225, 237, 248, .32);
  --search-hover: rgba(255, 255, 255, .12);
  --search-background: rgba(17, 34, 50, .34);
}

[data-background-tone='dark'] .search-divider {
  background: rgba(225, 237, 248, .24);
}

[data-background-tone='dark'] .search-bar:focus-within,
[data-background-tone='dark'] .search-bar:focus-within .nav-menu {
  border-color: rgba(225, 237, 248, .6);
}

.menu-check {
  flex: 0 0 auto;
  color: var(--search-text);
}

.site-icon {
  display: inline-grid;
  flex: 0 0 auto;
  width: 18px;
  place-items: center;
}

.suggestions-menu {
  display: block;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--search-border) transparent;
  border-radius: 24px;
}

.suggestions-menu::backdrop {
  background: transparent;
  pointer-events: none;
}

.suggestions-menu[popover]:not(:popover-open) {
  display: none;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  color: var(--search-text);
  background: transparent;
  border: 0;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.suggestion-item > svg {
  flex: 0 0 auto;
  color: var(--search-muted);
  opacity: .75;
}

.suggestion-item > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.suggestion-item:hover,
.suggestion-item[aria-selected='true'] {
  background: var(--search-hover);
}

@media (max-width: 520px) {
  .search-bar {
    min-height: 52px;
    padding: 5px 6px;
  }

  .search-control {
    padding: 0 7px;
  }

  .site-label {
    display: none;
  }

  .search-input-wrap input {
    font-size: 16px;
  }
}
</style>
