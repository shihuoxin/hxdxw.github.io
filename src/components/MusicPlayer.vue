<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MusicPlayer } from 'xf-music-player'
import { WEATHER_MUSIC_THEMES } from '../constants/weather.js'

const props = defineProps({
  theme: {
    type: String,
    default: WEATHER_MUSIC_THEMES.neutral,
  },
})

const playerRoot = ref(null)
let player = null
let themeAnimation = null
let themeChangeId = 0

async function changeTheme(theme) {
  const currentPlayer = player
  if (!currentPlayer) return

  const element = currentPlayer.PlayerElement
  const changeId = ++themeChangeId
  const opacity = element ? window.getComputedStyle(element).opacity : '1'
  themeAnimation?.cancel()
  themeAnimation = null

  if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    currentPlayer.setConfig({ theme })
    return
  }

  async function fade(from, to, duration) {
    const previousAnimation = themeAnimation
    const animation = element.animate([{ opacity: from }, { opacity: to }], {
      duration,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards',
    })
    themeAnimation = animation
    previousAnimation?.cancel()

    try {
      await animation.finished
      return changeId === themeChangeId
    } catch {
      // 连续切换或组件卸载会取消旧动画。
      return false
    }
  }

  const needsThemeChange = theme !== currentPlayer.playerConfig.theme
  if (needsThemeChange) {
    if (!(await fade(opacity, 0, 160)) || changeId !== themeChangeId) return
    // 浮层完全淡出后复用当前实例换色，保留歌曲与进度。
    currentPlayer.setConfig({ theme })
    await element.updateComplete
    await element.shadowRoot?.querySelector('music-player-box')?.updateComplete
    if (changeId !== themeChangeId) return
  }

  if ((await fade(needsThemeChange ? 0 : opacity, 1, 300)) && changeId === themeChangeId) {
    themeAnimation?.cancel()
    themeAnimation = null
  }
}

watch(() => props.theme, changeTheme)

onMounted(() => {
  if (!playerRoot.value) return

  // 直接把播放器挂到当前宿主节点，避免组件重复渲染时创建多个全局实例。
  // 云歌单和随机播放由播放器库处理；autoplay 仍受浏览器用户手势策略限制。
  player = new MusicPlayer({
    tagName: 'xf-music-player',
    mountElement: playerRoot.value,
    language: 'zh',
    isMonitoring: false,
    attributes: {
      theme: props.theme,
      bottom: "4.0em",
      isAutoPopup: true,
      mode: 'cloud',
      apiUrl: 'https://music.api.xfyun.club/api/v1/music/playlist-songs?platform=netease&playlistId=7004942977',
      autoplay: true,
      volume: 0.5,
      playMode: 'random',
    },
  })
})

onBeforeUnmount(() => {
  themeChangeId++
  themeAnimation?.cancel()
  themeAnimation = null
  // destroy 返回 Promise，忽略网络音源在卸载阶段的清理异常。
  void player?.destroy().catch(() => {})
  player = null
})
</script>

<template>
  <div ref="playerRoot" role="region" aria-label="音乐播放器" class="music-player-root" />
</template>

<style scoped>
.music-player-root {
  position: fixed;
  right: 16px;
  bottom: 0;
  z-index: 20;
  width: min(300px, calc(100vw - 32px));
  min-height: 1px;
}
</style>
