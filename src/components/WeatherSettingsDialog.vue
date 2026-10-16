<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, LocateFixed, MapPin, X } from 'lucide-vue-next'
import { WALLPAPER_OPTIONS } from '../constants/weather.js'

const props = defineProps({
  cityName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  initialLoading: { type: Boolean, default: false },
  searching: { type: Boolean, default: false },
  searchError: { type: String, default: '' },
  places: { type: Array, default: () => [] },
  wallpaperMode: { type: String, default: 'auto' },
})

const emit = defineEmits(['close', 'search', 'select-place', 'auto-locate', 'wallpaper-change'])
const cityQuery = ref(props.cityName)
const dialog = ref(null)
const cityInput = ref(null)
const wallpaperSelect = ref(null)
const wallpaperTrigger = ref(null)
const wallpaperMenuOpen = ref(false)
const controlsDisabled = computed(() => props.loading && !props.initialLoading)

const selectedWallpaperLabel = computed(() => (
  WALLPAPER_OPTIONS.find((option) => option.value === props.wallpaperMode)?.label || WALLPAPER_OPTIONS[0].label
))

function submitSearch() {
  emit('search', cityQuery.value.trim())
}

function trapFocus(event) {
  if (event.key !== 'Tab') return
  const focusable = [...dialog.value.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function toggleWallpaperMenu() {
  wallpaperMenuOpen.value = !wallpaperMenuOpen.value
}

function closeWallpaperMenu() {
  wallpaperMenuOpen.value = false
}

function selectWallpaper(value) {
  emit('wallpaper-change', value)
  closeWallpaperMenu()
  nextTick(() => wallpaperTrigger.value?.focus())
}

function handleWallpaperKeydown(event) {
  const currentIndex = Math.max(0, WALLPAPER_OPTIONS.findIndex((option) => option.value === props.wallpaperMode))

  if (event.key === 'Escape' && wallpaperMenuOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    closeWallpaperMenu()
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleWallpaperMenu()
    return
  }

  if (!wallpaperMenuOpen.value && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    wallpaperMenuOpen.value = true
    return
  }

  if (!wallpaperMenuOpen.value) return

  let nextIndex = currentIndex
  if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % WALLPAPER_OPTIONS.length
  if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + WALLPAPER_OPTIONS.length) % WALLPAPER_OPTIONS.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = WALLPAPER_OPTIONS.length - 1

  if (nextIndex !== currentIndex) {
    event.preventDefault()
    selectWallpaper(WALLPAPER_OPTIONS[nextIndex].value)
  }
}

function handleDocumentPointerdown(event) {
  if (!wallpaperSelect.value?.contains(event.target)) closeWallpaperMenu()
}

onMounted(() => {
  cityInput.value?.focus()
  document.addEventListener('pointerdown', handleDocumentPointerdown)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleDocumentPointerdown))
</script>

<template>
  <section
    ref="dialog"
    class="weather-settings-panel"
    :class="{ 'is-wallpaper-menu-open': wallpaperMenuOpen }"
    role="dialog"
    aria-modal="true"
    aria-labelledby="weather-settings-title"
    aria-describedby="weather-settings-description"
    @keydown.esc.stop.prevent="emit('close')"
    @keydown="trapFocus"
  >
    <header class="weather-settings-header">
      <div class="weather-settings-heading">
        <h2 id="weather-settings-title">天气设置</h2>
        <p id="weather-settings-description">通过第三方 IP 服务粗略判断城市，仅用于查询天气</p>
      </div>
      <button type="button" class="weather-settings-close" aria-label="关闭天气设置" title="关闭" @click="emit('close')">
        <X :size="17" :stroke-width="2" />
      </button>
    </header>

    <form class="weather-city-form" @submit.prevent="submitSearch">
      <label class="sr-only" for="weather-city-query">城市名称</label>
      <input
        id="weather-city-query"
        ref="cityInput"
        v-model="cityQuery"
        type="search"
        autocomplete="off"
        placeholder="输入城市，如焦作"
        :disabled="controlsDisabled"
      />
      <button type="submit" :disabled="controlsDisabled || searching">
        <LocateFixed :size="16" :stroke-width="1.8" />
        <span>{{ searching ? '查询中' : '定位' }}</span>
      </button>
    </form>

    <p v-if="searchError" class="weather-settings-error" role="status" aria-live="polite">{{ searchError }}</p>

    <ul v-if="places.length" class="weather-city-results" aria-label="城市搜索结果">
      <li v-for="place in places" :key="place.id">
        <button type="button" :disabled="controlsDisabled" @click="emit('select-place', place)">
          <MapPin :size="16" class="weather-city-icon" />
          <span class="weather-city-result-copy">
            <span>{{ place.name }}</span>
            <small>{{ place.detail }}</small>
          </span>
        </button>
      </li>
    </ul>

    <button type="button" class="weather-ip-locate" :disabled="controlsDisabled" @click="emit('auto-locate')">
      <span>{{ controlsDisabled ? '正在定位…' : '通过 IP 定位' }}</span>
    </button>

    <div class="weather-wallpaper-setting">
      <label for="weather-wallpaper-mode">手动选择动态壁纸</label>
      <div
        ref="wallpaperSelect"
        class="weather-wallpaper-select-wrap"
        :class="{ 'is-open': wallpaperMenuOpen }"
      >
        <button
          ref="wallpaperTrigger"
          id="weather-wallpaper-mode"
          type="button"
          class="weather-wallpaper-trigger"
          role="combobox"
          aria-controls="weather-wallpaper-options"
          :aria-expanded="wallpaperMenuOpen"
          aria-haspopup="listbox"
          @click="toggleWallpaperMenu"
          @keydown="handleWallpaperKeydown"
        >
          <span>{{ selectedWallpaperLabel }}</span>
          <ChevronDown :size="17" :stroke-width="2" aria-hidden="true" />
        </button>

        <Transition name="weather-wallpaper-menu">
          <ul
            v-if="wallpaperMenuOpen"
            id="weather-wallpaper-options"
            class="weather-wallpaper-menu"
            role="listbox"
            aria-label="动态壁纸选项"
          >
            <li v-for="option in WALLPAPER_OPTIONS" :key="option.value">
              <button
                type="button"
                class="weather-wallpaper-option"
                :class="{ 'is-selected': option.value === wallpaperMode }"
                role="option"
                :aria-selected="option.value === wallpaperMode"
                @click="selectWallpaper(option.value)"
              >
                <span>{{ option.label }}</span>
              </button>
            </li>
          </ul>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.weather-settings-panel {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  z-index: 40;
  display: flex;
  width: min(400px, calc(100vw - 32px));
  max-height: calc(100svh - 90px);
  flex-direction: column;
  gap: 9px;
  padding: 14px 16px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 24px;
  background: rgba(72, 80, 83, 0.58);
  box-shadow: 0 14px 36px rgba(22, 30, 33, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px) saturate(115%);
  -webkit-backdrop-filter: blur(16px) saturate(115%);
}

.weather-settings-panel.is-wallpaper-menu-open {
  overflow: visible;
}

.weather-settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.weather-settings-heading {
  min-width: 0;
}

.weather-settings-heading h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.weather-settings-heading p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  line-height: 1.35;
}

.weather-settings-close {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.weather-settings-close:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.16);
}

.weather-city-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-city-form input,
.weather-city-form button,
.weather-ip-locate,
.weather-wallpaper-select-wrap {
  min-height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  background: rgba(72, 80, 83, 0.24);
  color: #fff;
}

.weather-city-form input {
  min-width: 0;
  flex: 1;
  padding: 0 14px;
  border-radius: 999px;
  outline: none;
  font-size: 14px;
}

.weather-city-form input::placeholder {
  color: rgba(255, 255, 255, 0.58);
}

.weather-city-form input:focus-visible {
  outline: 0;
  border-color: rgba(255, 255, 255, 0.42);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
}

.weather-settings-panel button:focus-visible,
.weather-wallpaper-select-wrap:focus-within {
  outline: 2px solid rgba(255, 255, 255, 0.82);
  outline-offset: 3px;
}

.weather-city-form input[type='search']::-webkit-search-cancel-button,
.weather-city-form input[type='search']::-webkit-search-decoration {
  appearance: none;
  -webkit-appearance: none;
}

.weather-city-form button {
  display: inline-flex;
  min-width: 78px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 13px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background-color 160ms ease;
}

.weather-city-form button:hover:not(:disabled),
.weather-ip-locate:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}

.weather-city-form button:disabled,
.weather-ip-locate:disabled {
  cursor: wait;
  opacity: 0.62;
}

.weather-ip-locate {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background-color 160ms ease;
}

.weather-settings-error {
  margin: -9px 0 -7px;
  color: #ffe1d9;
  font-size: 12px;
  line-height: 1.5;
}

.weather-city-results {
  display: grid;
  max-height: 176px;
  margin: -8px 0 -4px;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.weather-city-results li + li {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.weather-city-results button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.weather-city-results button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.weather-city-results button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.weather-city-icon {
  flex: 0 0 auto;
}

.weather-city-result-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
  font-size: 13px;
}

.weather-city-result-copy small {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-wallpaper-setting {
  display: grid;
  gap: 4px;
}

.weather-wallpaper-setting label {
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  font-weight: 650;
}

.weather-wallpaper-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 999px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.weather-wallpaper-select-wrap.is-open {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.13);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.07);
}

.weather-wallpaper-trigger {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 13px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.weather-wallpaper-trigger > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-wallpaper-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 5;
  display: grid;
  gap: 2px;
  max-height: 220px;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 20px;
  background: rgba(72, 80, 83, 0.92);
  box-shadow: 0 14px 32px rgba(22, 30, 33, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(115%);
  -webkit-backdrop-filter: blur(16px) saturate(115%);
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.34) transparent;
}

.weather-wallpaper-menu::-webkit-scrollbar {
  width: 6px;
}

.weather-wallpaper-menu::-webkit-scrollbar-track {
  background: transparent;
}

.weather-wallpaper-menu::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
  background-clip: padding-box;
}

.weather-wallpaper-option {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  font-size: 12.5px;
  text-align: left;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.weather-wallpaper-option:hover,
.weather-wallpaper-option.is-selected {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.weather-wallpaper-option.is-selected {
  font-weight: 650;
}

.weather-wallpaper-menu-enter-active,
.weather-wallpaper-menu-leave-active {
  transform-origin: top center;
  transition: opacity 140ms ease, transform 140ms ease;
}

.weather-wallpaper-menu-enter-from,
.weather-wallpaper-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

@media (max-width: 520px) {
  .weather-settings-panel {
    gap: 8px;
    padding: 12px 14px;
    border-radius: 20px;
  }

  .weather-settings-heading h2 {
    font-size: 17px;
  }

  .weather-settings-heading p {
    max-width: 250px;
    font-size: 11px;
  }

  .weather-city-form {
    gap: 7px;
  }

  .weather-city-form input {
    padding-inline: 12px;
    font-size: 12px;
  }

  .weather-city-form button {
    min-width: 70px;
    padding-inline: 10px;
  }

  .weather-city-form input,
  .weather-city-form button,
  .weather-ip-locate,
  .weather-wallpaper-trigger {
    min-height: 40px;
  }

  .weather-wallpaper-menu {
    border-radius: 17px;
  }
}
</style>
