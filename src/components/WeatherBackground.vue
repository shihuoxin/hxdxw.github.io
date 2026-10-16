<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { resolveWeatherType } from '../constants/weather.js'

const props = defineProps({
  weather: {
    type: Object,
    default: null,
  },
  wallpaperMode: {
    type: String,
    default: 'auto',
  },
})

const emit = defineEmits(['tone-change'])

const sceneType = computed(() => resolveWeatherType(props.weather, props.wallpaperMode))

const isNight = computed(() => {
  const label = String(props.weather?.label || '')
  if (typeof props.weather?.isDay === 'boolean') return !props.weather.isDay
  return label.includes('夜')
})

const sceneKey = computed(() => `${sceneType.value}-${isNight.value ? 'night' : 'day'}`)
const tone = computed(() => isNight.value || ['rain', 'storm'].includes(sceneType.value) ? 'dark' : 'light')
watch(tone, (value) => emit('tone-change', value), { immediate: true })

const background = ref(null)
const width = ref(1600)
const compact = computed(() => width.value < 800)
const uid = `weather-${useId().replace(/:/g, '')}`
const id = (name) => `${uid}-${sceneKey.value}-${name}`
const paint = (name) => `url(#${id(name)})`
const openSky = computed(() => ['clear', 'cloudy'].includes(sceneType.value))
const wet = computed(() => ['rain', 'storm'].includes(sceneType.value))

// Sky, horizon light, three terrain planes, and cloud tones for each scene.
const palettes = {
  clear: { sky: ['#7fbcd5', '#d9e9e6', '#f6dfc3'], light: '#fff1cc', land: ['#b5c9c3', '#8faea6', '#75968c'], cloud: ['#fffdf4', '#e8f0ed'] },
  cloudy: { sky: ['#91b4c8', '#d4e1e2', '#eddfcf'], light: '#f9e4c7', land: ['#b3c5c4', '#93afae', '#789b99'], cloud: ['#fffdf5', '#dbe6e6'] },
  overcast: { sky: ['#8eabb8', '#c0d0d2', '#dbe0d9'], light: '#e9ece0', land: ['#b0c1c0', '#91aaa9', '#769797'], cloud: ['#dce6e7', '#9fb6c0'] },
  fog: { sky: ['#a8bfbe', '#d0dcd4', '#ebe8d8'], light: '#f1f0df', land: ['#bdcec5', '#a3bbb3', '#8ba99f'], cloud: ['#f3f4e9', '#d6e3d8'] },
  rain: { sky: ['#334e67', '#698698', '#a8b9bd'], light: '#bccfd0', land: ['#809da7', '#577e8c', '#3c6375'], cloud: ['#8fa8b8', '#435e77'] },
  snow: { sky: ['#9bb8cc', '#cedee7', '#edf1ee'], light: '#fffaf1', land: ['#c0d1db', '#a8bfce', '#8faabd'], cloud: ['#f2f6f7', '#c5d6e2'] },
  storm: { sky: ['#293b55', '#52677d', '#8b9ba8'], light: '#a2b8c9', land: ['#6c8199', '#4f6981', '#374f6a'], cloud: ['#687f99', '#354b67'] },
  neutral: { sky: ['#a7c5cb', '#d9e4dc', '#f0e3d0'], light: '#f8edcf', land: ['#c0cfc2', '#a1b7aa', '#88a596'], cloud: ['#f7f5e9', '#dbe6df'] },
}
const nightPalettes = {
  clear: ['#16263f', '#334d6c', '#8393a6'],
  cloudy: ['#203149', '#4b637e', '#8a9baa'],
  overcast: ['#26374c', '#526a7e', '#8c9da5'],
  fog: ['#354b59', '#708b90', '#a9b8b3'],
  rain: ['#1d3049', '#456279', '#7c96a3'],
  snow: ['#2a415e', '#647f98', '#b5c7d2'],
  storm: ['#17243c', '#394e6a', '#718498'],
  neutral: ['#23374e', '#4c6a7e', '#94a8b0'],
}
const palette = computed(() => {
  const base = palettes[sceneType.value]
  return isNight.value ? {
    ...base,
    sky: nightPalettes[sceneType.value],
    light: '#c1d5e5',
    land: sceneType.value === 'snow' ? ['#8098ad', '#68859d', '#526f8a'] : ['#59738a', '#405f77', '#2c4c66'],
    cloud: ['#849aac', '#3b536d'],
  } : base
})

// Independent seeded coordinates avoid rows and repeated diagonal star patterns.
const random = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
const stars = computed(() => Array.from({ length: compact.value ? 24 : 46 }, (_, i) => ({
  x: width.value * random(i + 1), y: 40 + random(i + 101) * 410,
  r: 0.8 + random(i + 201) * 1.3, delay: `${-random(i + 301) * 8}s`,
})))
const rain = computed(() => Array.from({ length: compact.value ? 25 : 48 }, (_, i) => ({
  x: (width.value + 100) * random(i + 11), length: 13 + random(i + 21) * 22,
  opacity: 0.2 + random(i + 31) * 0.34,
  duration: `${1.25 + random(i + 41) * 0.8}s`, delay: `${-random(i + 51) * 5}s`,
})))
const snow = computed(() => Array.from({ length: compact.value ? 26 : 44 }, (_, i) => ({
  x: width.value * random(i + 61), r: 1.3 + random(i + 71) * 2.7,
  opacity: 0.3 + random(i + 81) * 0.5,
  duration: `${8 + random(i + 91) * 9}s`, delay: `${-random(i + 111) * 20}s`,
})))
const clouds = computed(() => {
  const density = ['overcast', 'rain', 'snow', 'storm'].includes(sceneType.value)
  return [
    { x: width.value * 0.04, y: 154, scale: density ? 1.6 : 0.95, opacity: 0.58, duration: '63s', drift: 48 },
    { x: width.value * 0.46, y: density ? 105 : 244, scale: density ? 1.9 : 0.8, opacity: density ? 0.48 : 0.56, duration: '77s', drift: -38 },
    { x: width.value * 0.91, y: 176, scale: density ? 1.4 : 1.15, opacity: 0.74, duration: '69s', drift: -58 },
  ]
})

let resizeObserver
let motionQuery

function syncPlayback() {
  // 过渡时两个 SVG 会短暂共存，需要同时同步动画状态。
  for (const svg of background.value?.querySelectorAll('svg') || []) {
    if (motionQuery?.matches) {
      svg.setCurrentTime(7)
      svg.pauseAnimations()
    } else if (document.hidden) {
      svg.pauseAnimations()
    } else {
      svg.unpauseAnimations()
    }
  }
}

watch(sceneKey, syncPlayback, { flush: 'post' })

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.height) width.value = Math.round(900 * entry.contentRect.width / entry.contentRect.height)
  })
  resizeObserver.observe(background.value)
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionQuery.addEventListener('change', syncPlayback)
  document.addEventListener('visibilitychange', syncPlayback)
  syncPlayback()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', syncPlayback)
  document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<template>
  <div ref="background" class="weather-background" aria-hidden="true">
    <Transition name="weather-scene">
      <svg :key="sceneKey" class="weather-background__svg" :data-scene="sceneKey" :viewBox="`0 0 ${width} 900`" preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <defs>
          <linearGradient :id="id('sky')" x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0" :stop-color="palette.sky[0]" />
            <stop offset="0.62" :stop-color="palette.sky[1]" />
            <stop offset="1" :stop-color="palette.sky[2]" />
          </linearGradient>
          <radialGradient :id="id('light')">
            <stop offset="0" :stop-color="palette.light" stop-opacity="0.6" />
            <stop offset="0.5" :stop-color="palette.light" stop-opacity="0.19" />
            <stop offset="1" :stop-color="palette.light" stop-opacity="0" />
          </radialGradient>
          <radialGradient :id="id('halo')">
            <stop offset="0" :stop-color="isNight ? '#e5f3ff' : '#fff7d8'" stop-opacity="0.56" />
            <stop offset="0.38" :stop-color="isNight ? '#d2e6ff' : '#fff1c6'" stop-opacity="0.18" />
            <stop offset="1" :stop-color="isNight ? '#d2e6ff' : '#fff1c6'" stop-opacity="0" />
          </radialGradient>
          <linearGradient :id="id('cloud')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="palette.cloud[0]" />
            <stop offset="1" :stop-color="palette.cloud[1]" stop-opacity="0.3" />
          </linearGradient>
          <linearGradient :id="id('mist')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="palette.light" stop-opacity="0" />
            <stop offset="0.5" :stop-color="palette.light" stop-opacity="0.36" />
            <stop offset="1" :stop-color="palette.light" stop-opacity="0" />
          </linearGradient>
          <mask :id="id('crescent')" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
            <circle r="34" fill="white" />
            <circle cx="16" cy="-10" r="31" fill="black" />
          </mask>
          <path :id="id('cloud-shape')" d="M-230 24C-240 6-210-13-176-10C-174-48-133-62-103-43C-83-91-12-94 16-53C55-74 100-46 103-16C141-35 190-12 195 13C239 12 253 40 210 48C110 64-118 64-207 50C-232 46-240 34-230 24Z" />
        </defs>

        <rect :width="width" height="900" :fill="paint('sky')" />
        <ellipse :cx="width * 0.71" cy="610" :rx="width * 0.8" ry="490" :fill="paint('light')" opacity="0.6" />

        <g v-if="isNight && openSky" class="weather-background__stars" :opacity="sceneType === 'cloudy' ? 0.38 : 0.8">
          <circle v-for="(star, i) in stars" :key="i" :cx="star.x" :cy="star.y" :r="star.r" fill="#edf5ff" opacity="0.6">
            <animate attributeName="opacity" values="0.25;0.78;0.25" :dur="`${5 + i % 5}s`" :begin="star.delay" repeatCount="indefinite" />
          </circle>
        </g>

        <g v-if="openSky" :transform="`translate(${width * (compact ? 0.76 : 0.78)} ${compact ? 174 : 170})`" :opacity="sceneType === 'cloudy' ? 0.72 : 1" class="weather-background__celestial">
          <circle :r="isNight ? 140 : 175" :fill="paint('halo')" opacity="0.8">
            <animate attributeName="opacity" values="0.65;0.9;0.65" dur="12s" repeatCount="indefinite" />
          </circle>
          <g v-if="!isNight" class="weather-background__sun">
            <g stroke="#fff5d8" stroke-linecap="round" stroke-width="1.5" opacity="0.4">
              <path v-for="n in 12" :key="n" d="M0-65V-80" :transform="`rotate(${n * 30})`" />
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="120s" repeatCount="indefinite" />
            </g>
            <circle r="44" fill="#fff4d3" />
            <circle r="51" fill="none" stroke="#fff9e4" stroke-width="0.7" opacity="0.35" />
          </g>
          <circle v-else r="34" fill="#edf3e9" :mask="paint('crescent')" />
        </g>

        <g v-if="!['fog', 'neutral'].includes(sceneType)" class="weather-background__clouds">
          <g v-for="(cloud, i) in clouds" :key="i" :transform="`translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})`" :opacity="sceneType === 'clear' ? cloud.opacity * 0.38 : cloud.opacity">
            <g>
              <use :href="`#${id('cloud-shape')}`" :fill="paint('cloud')" />
              <animateTransform attributeName="transform" type="translate" :values="`0 0;${cloud.drift} -7;0 0`" :dur="cloud.duration" repeatCount="indefinite" />
            </g>
          </g>
        </g>

        <g v-if="sceneType === 'storm'" class="weather-background__lightning">
          <ellipse :cx="width * 0.71" cy="300" :rx="width * 0.6" ry="420" :fill="paint('halo')" opacity="0">
            <animate attributeName="opacity" values="0;0;0.22;0;0.1;0;0" keyTimes="0;0.68;0.69;0.71;0.73;0.75;1" dur="13s" repeatCount="indefinite" />
          </ellipse>
          <g :transform="`translate(${width * 0.72} 195)`" fill="none" stroke="#d7e9ff" stroke-linecap="round" stroke-linejoin="round" opacity="0">
            <path d="M0 0L-18 51L4 65L-36 118L-19 129L-57 205M-18 51L-44 67L-55 105M-36 118L-68 129L-79 160" stroke-width="2" />
            <animate attributeName="opacity" values="0;0;0.85;0;0.5;0;0" keyTimes="0;0.68;0.69;0.71;0.73;0.75;1" dur="13s" repeatCount="indefinite" />
          </g>
        </g>

        <g :transform="`scale(${width / 1600} 1)`" class="weather-background__landscape" :opacity="sceneType === 'fog' ? 0.54 : 1">
          <path d="M-80 734C58 702 106 635 224 653C341 675 357 611 457 627C555 643 576 697 686 676C812 652 843 615 947 632C1052 649 1111 593 1210 617C1316 642 1357 700 1452 678L1680 633V900H-80Z" :fill="palette.land[0]" opacity="0.6" />
          <path v-if="sceneType === 'snow'" d="M270 657C350 670 377 611 457 627C501 633 529 650 554 665L500 659L474 665L442 649L407 655L381 647L342 666Z M1064 638C1123 613 1165 602 1210 617L1267 639L1224 634L1199 628L1181 634L1157 624L1110 639Z" fill="#f1f5f5" opacity="0.8" />
          <path d="M-80 827C79 732 196 737 327 778C481 826 561 705 722 730C883 755 923 787 1080 743C1266 691 1396 735 1680 787V900H-80Z" :fill="palette.land[1]" opacity="0.62" />
          <path d="M-80 876C115 792 270 814 441 852C636 895 776 820 948 834C1129 849 1259 799 1405 825L1680 879V900H-80Z" :fill="palette.land[2]" opacity="0.65" />
          <path d="M-100 650Q350 610 825 666T1710 632V790Q1260 714 825 752T-100 746Z" :fill="paint('mist')" :opacity="sceneType === 'fog' ? 0.8 : 0.35">
            <animateTransform attributeName="transform" type="translate" values="-24 0;24 8;-24 0" dur="54s" repeatCount="indefinite" />
          </path>
        </g>

        <g v-if="sceneType === 'fog' || sceneType === 'neutral'" class="weather-background__fog" :opacity="sceneType === 'fog' ? 0.68 : 0.23">
          <ellipse :cx="width * 0.38" cy="415" :rx="width * 0.8" ry="105" :fill="paint('mist')">
            <animateTransform attributeName="transform" type="translate" values="-25 0;25 -12;-25 0" dur="46s" repeatCount="indefinite" />
          </ellipse>
          <ellipse :cx="width * 0.64" cy="632" :rx="width * 0.9" ry="125" :fill="paint('mist')">
            <animateTransform attributeName="transform" type="translate" values="25 0;-25 12;25 0" dur="61s" repeatCount="indefinite" />
          </ellipse>
        </g>

        <g v-if="wet" class="weather-background__rain" stroke="#e1f0f6" stroke-linecap="round">
          <line v-for="(drop, i) in rain" :key="i" :x1="drop.x" y1="-45" :x2="drop.x - 8" :y2="-45 + drop.length" :stroke-width="i % 4 === 0 ? 1.5 : 0.9" :opacity="drop.opacity">
            <animateTransform attributeName="transform" type="translate" values="40 -30;-130 1000" :dur="drop.duration" :begin="drop.delay" repeatCount="indefinite" />
          </line>
          <ellipse v-for="n in (compact ? 3 : 7)" :key="`ripple-${n}`" :cx="width * random(n + 401)" :cy="810 + random(n + 501) * 85" rx="3" ry="1" fill="none" stroke-width="0.8" opacity="0">
            <animate attributeName="rx" values="3;22" dur="2.8s" :begin="`${-n * 0.6}s`" repeatCount="indefinite" />
            <animate attributeName="ry" values="1;5" dur="2.8s" :begin="`${-n * 0.6}s`" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.25;0" dur="2.8s" :begin="`${-n * 0.6}s`" repeatCount="indefinite" />
          </ellipse>
        </g>

        <g v-if="sceneType === 'snow'" class="weather-background__snow" fill="#f9fdff">
          <g v-for="(flake, i) in snow" :key="i" :opacity="flake.opacity">
            <circle :cx="flake.x" cy="-35" :r="flake.r" />
            <path v-if="i % 8 === 0" :transform="`translate(${flake.x} -35)`" d="M-5 0H5M-2.5-4.3L2.5 4.3M2.5-4.3L-2.5 4.3" fill="none" stroke="#ffffff" stroke-width="1" />
            <animateTransform attributeName="transform" type="translate" values="0 -20;18 330;-12 680;8 1000" :dur="flake.duration" :begin="flake.delay" repeatCount="indefinite" />
          </g>
        </g>
      </svg>
    </Transition>
  </div>
</template>

<style scoped>
.weather-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.weather-scene-enter-active,
.weather-scene-leave-active {
  transition: opacity 650ms ease;
}

.weather-scene-enter-active {
  z-index: 1;
}

.weather-scene-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .weather-scene-enter-active,
  .weather-scene-leave-active {
    transition: none;
  }
}

.weather-background__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
