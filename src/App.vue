<script setup>
import { ref } from 'vue'
import WeatherBackground from './components/WeatherBackground.vue'
import WeatherWidget from './components/WeatherWidget.vue'
import HitokotoWidget from './components/HitokotoWidget.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import ProfileCard from './components/ProfileCard.vue'

const currentWeather = ref(null)
const wallpaperMode = ref('auto')
const backgroundTone = ref('light')
</script>

<template>
  <main :data-background-tone="backgroundTone" class="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#f8faf9] px-5 py-28 text-[var(--ink)] sm:px-8">
    <WeatherBackground :weather="currentWeather" :wallpaper-mode="wallpaperMode" @tone-change="backgroundTone = $event" />
    <WeatherWidget
      :wallpaper-mode="wallpaperMode"
      @weather-change="currentWeather = $event"
      @wallpaper-change="wallpaperMode = $event"
    />
    <section class="relative z-10 flex w-full max-w-2xl flex-col items-center gap-10 sm:gap-12">
      <ProfileCard />
      <MusicPlayer />
    </section>
    <HitokotoWidget />
  </main>
</template>
