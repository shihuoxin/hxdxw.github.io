<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { MusicPlayer } from 'xf-music-player'

const playerRoot = ref(null)
let player = null

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
      theme: 'xf-original-theme',
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
