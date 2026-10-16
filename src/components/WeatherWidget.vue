<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Settings } from 'lucide-vue-next'
import WeatherSettingsDialog from './WeatherSettingsDialog.vue'
import { DEFAULT_BEIJING_PLACE, getCurrentWeather, locateByIp, searchCities } from '../services/weather.js'

const props = defineProps({
  wallpaperMode: { type: String, default: 'auto' },
})

const emit = defineEmits(['weather-change', 'wallpaper-change'])

// 首次先显示定位状态；只有 IP 定位失败时，才使用北京作为默认城市。
const weather = ref({
  name: '',
  label: '正在获取定位…',
  temperature: null,
})
const loading = ref(false)
const initialLoading = ref(true)
const settingsOpen = ref(false)
const searching = ref(false)
const searchError = ref('')
const places = ref([])
const settingsButton = ref(null)
let weatherRequestId = 0
let searchRequestId = 0

async function applyPlaceWeather(place, requestId) {
  const nextWeather = await getCurrentWeather(place)
  if (requestId !== weatherRequestId || !nextWeather?.name || !Number.isFinite(nextWeather.temperature)) return false
  weather.value = nextWeather
  emit('weather-change', nextWeather)
  return true
}

function resetSearch() {
  searchRequestId++
  searching.value = false
  searchError.value = ''
  places.value = []
}

const displayText = computed(() => {
  if (weather.value?.name) {
    const temperature = Number.isFinite(weather.value.temperature)
      ? ` · ${weather.value.temperature}°C`
      : ''
    return `${weather.value.name} · ${weather.value.label}${temperature}`
  }
  if (loading.value || initialLoading.value) return weather.value?.label || '正在获取定位…'
  if (weather.value?.label) return weather.value.label
  return '手动定位:打开设置'
})

async function loadInitialWeather() {
  const requestId = ++weatherRequestId
  initialLoading.value = true
  loading.value = false

  let place
  try {
    place = await locateByIp()
  } catch {
    // IP 定位失败时立即释放手动定位入口，默认城市请求在后台继续。
    if (requestId !== weatherRequestId) return
    weather.value = {
      ...weather.value,
      label: 'IP 定位失败，正在使用北京定位',
    }
    initialLoading.value = false
    loading.value = false
    place = DEFAULT_BEIJING_PLACE
  }

  if (requestId !== weatherRequestId) return
  try {
    const applied = await applyPlaceWeather(place, requestId)
    if (!applied && requestId === weatherRequestId) {
      weather.value = {
        ...weather.value,
        name: '',
        label: '天气暂不可用，请打开设置手动选择城市',
      }
    }
  } catch (reason) {
    if (requestId === weatherRequestId) {
      weather.value = {
        ...weather.value,
        name: place.name,
        label: reason?.message || '天气暂不可用',
      }
    }
  } finally {
    if (requestId === weatherRequestId) {
      initialLoading.value = false
      loading.value = false
    }
  }
}

function openSettings() {
  settingsOpen.value = true
  resetSearch()
}

async function closeSettings({ cancel = true } = {}) {
  if (cancel && loading.value) {
    weatherRequestId++
    loading.value = false
  }
  settingsOpen.value = false
  resetSearch()
  await nextTick()
  settingsButton.value?.focus()
}

async function changeLocation(resolvePlace, automatic = false) {
  const requestId = ++weatherRequestId
  initialLoading.value = false
  loading.value = true
  resetSearch()
  try {
    const place = await resolvePlace()
    if (requestId !== weatherRequestId) return
    const applied = await applyPlaceWeather(place, requestId)
    if (applied) {
      if (automatic) emit('wallpaper-change', 'auto')
      await closeSettings({ cancel: false })
    } else if (requestId === weatherRequestId) {
      searchError.value = '未能获取该城市天气，请重试或选择其他城市'
    }
  } catch (reason) {
    if (requestId === weatherRequestId) searchError.value = reason?.message || '定位或天气查询失败，请稍后重试'
  } finally {
    if (requestId === weatherRequestId) loading.value = false
  }
}

function resetToAuto() {
  return changeLocation(locateByIp, true)
}

function selectPlace(place) {
  return changeLocation(() => place)
}

async function findCity(query) {
  resetSearch()
  const requestId = searchRequestId
  const normalizedQuery = String(query || '').trim()
  if (!normalizedQuery) {
    searchError.value = '请输入城市名称'
    return
  }

  searching.value = true
  try {
    const results = await searchCities(normalizedQuery)
    if (requestId !== searchRequestId) return
    places.value = results
    if (!places.value.length) searchError.value = '没有找到这个城市，请换个名称试试'
  } catch (reason) {
    if (requestId === searchRequestId) searchError.value = reason?.message || '搜索失败，请稍后重试'
  } finally {
    if (requestId === searchRequestId) searching.value = false
  }
}

onMounted(() => {
  emit('weather-change', weather.value)
  loadInitialWeather()
})

onBeforeUnmount(() => {
  weatherRequestId++
  searchRequestId++
})
</script>

<template>
  <section class="fixed left-4 top-4 z-30 sm:left-6 sm:top-6" aria-label="当地天气">
    <div class="weather-pill" :class="{ 'is-loading': loading || initialLoading }">
      <Transition name="weather-text" mode="out-in">
        <span :key="displayText" class="weather-pill-text">{{ displayText }}</span>
      </Transition>
      <button
        ref="settingsButton"
        type="button"
        class="weather-settings"
        aria-label="设置天气城市"
        title="设置城市"
        @click="openSettings"
      >
        <Settings :size="15" :stroke-width="1.8" />
      </button>
    </div>

    <Transition name="fade-rise">
      <WeatherSettingsDialog
        v-if="settingsOpen"
        :city-name="weather.name"
        :loading="loading"
        :initial-loading="initialLoading"
        :searching="searching"
        :search-error="searchError"
        :places="places"
        :wallpaper-mode="props.wallpaperMode"
        @close="closeSettings"
        @search="findCity"
        @select-place="selectPlace"
        @auto-locate="resetToAuto"
        @wallpaper-change="emit('wallpaper-change', $event)"
      />
    </Transition>
  </section>
</template>

<style>
.weather-text-enter-active,
.weather-text-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.weather-text-enter-from,
.weather-text-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
