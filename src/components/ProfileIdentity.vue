<template>
  <div class="flex max-w-full items-center gap-4 text-left sm:gap-7">
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
</style>
