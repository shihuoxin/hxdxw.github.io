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

<!--按钮占位
<nav class="nav-buttons" aria-label="站点导航">

  <a class="nav-btn" href="https://占位.com" target="_blank" rel="noopener noreferrer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77
                a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91
                a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    <span>占位</span>
  </a></nav>
  -->

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
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid rgba(77, 103, 134, .28);
  border-radius: 50px;
  text-decoration: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow:
    0 8px 22px rgba(33, 66, 108, .08);
  position: relative;
  transition: background var(--transition), border-color var(--transition),
              box-shadow var(--transition), transform var(--transition);
}

.nav-btn::before {
  content: none;
}

.nav-btn:hover {
  transform: translateY(-2px);
  background: transparent;
  border-color: rgba(77, 103, 134, .38);
  box-shadow:
    0 12px 28px rgba(33, 66, 108, .12);
}
</style>
