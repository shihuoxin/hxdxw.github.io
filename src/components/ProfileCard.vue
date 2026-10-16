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

  <nav class="nav-buttons" aria-label="站点导航">

    <a class="nav-btn" href="http://ep289690.ep.chost.shop/mikutap/index.html" xmlns="http://www.w3.org/2000/svg" target="_blank" rel="noopener noreferrer">
      <svg width="15" height="15" viewBox="0 0 200 200">
        <path d="M 50 160  L 50 40  L 100 140  L 150 40  L 150 160" 
          fill="none" 
          stroke="#11A6B9" 
          stroke-width="20" 
          stroke-linecap="round" 
          stroke-linejoin="round" />
      </svg>
      <span>Mikutap</span>
    </a>

    <a class="nav-btn" href="http://ep289690.ep.chost.shop/markdown-editor/index.html" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M6 15.5 V9.5 L9.5 13 L13 9.5 V15.5" />
        <path d="M17 9.5 V15.5 M14.5 13 L17 15.5 L19.5 13" />
      </svg>
      <span>MD editor</span>
    </a>

    <a class="nav-btn" href="http://ep289690.ep.chost.shop/disk-partition-calculator/index.html" target="_blank" rel="noopener noreferrer">
      <svg t="1792155461650" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5460" width="15" height="15">
        <path d="M896 42.666667H128c-12.8 0-21.333333 8.533333-21.333333 21.333333v896c0 12.8 8.533333 21.333333 21.333333 21.333333h768c12.8 0 21.333333-8.533333 21.333333-21.333333V64c0-12.8-8.533333-21.333333-21.333333-21.333333z m-21.333333 896H149.333333V85.333333h725.333334v853.333334zM234.666667 128H192v64h42.666667V128z m597.333333 0h-42.666667v64h42.666667V128z m-192 746.666667h192v-42.666667h-192v42.666667z m-142.933333-305.066667c4.266667 4.266667 10.666667 6.4 14.933333 6.4s10.666667-2.133333 14.933333-6.4l64-64c8.533333-8.533333 8.533333-21.333333 0-29.866667l-64-64c-8.533333-8.533333-21.333333-8.533333-29.866666 0l-64 64c-8.533333 8.533333-8.533333 21.333333 0 29.866667l64 64z m14.933333-113.066667l34.133333 34.133334-34.133333 34.133333-34.133333-34.133333 34.133333-34.133334zM264.533333 876.8c4.266667 2.133333 8.533333 4.266667 12.8 4.266667h4.266667c6.4-2.133333 10.666667-6.4 14.933333-10.666667l59.733334-117.333333 36.266666 32c4.266667 4.266667 8.533333 6.4 14.933334 6.4h230.4c6.4 0 10.666667-2.133333 14.933333-6.4l151.466667-160c4.266667-4.266667 6.4-8.533333 6.4-14.933334V373.333333c0-6.4-2.133333-10.666667-6.4-14.933333l-151.466667-160c-4.266667-4.266667-8.533333-6.4-14.933333-6.4H407.466667c-6.4 0-10.666667 2.133333-14.933334 6.4l-172.8 160c-4.266667 4.266667-6.4 10.666667-6.4 14.933333v236.8c0 6.4 2.133333 10.666667 6.4 14.933334l72.533334 66.133333-108.8 85.333333c-4.266667 4.266667-8.533333 10.666667-8.533334 17.066667s2.133333 12.8 8.533334 17.066667l81.066666 66.133333z m-8.533333-277.333333V381.866667l160-147.2h211.2l138.666667 147.2v219.733333L629.333333 746.666667h-211.2l-38.4-34.133334 32-61.866666c4.266667-8.533333 2.133333-19.2-6.4-25.6-8.533333-6.4-19.2-6.4-27.733333 0l-51.2 40.533333-70.4-66.133333z m68.266667 119.466666l-53.333334 106.666667-40.533333-32 93.866667-74.666667z" fill="#4D4D4D" p-id="5461"></path>
      </svg>
      <span>整G分区工具</span>
    </a>

    <a class="nav-btn" href="http://ep289690.ep.chost.shop/aspect-ratio-calculator/index.html" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="8" width="18" height="9" rx="2" />
        <rect x="14" y="4" width="8" height="8" rx="2" />
        <circle cx="14" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M4 20h17" />
        <path d="M4 18v4" />
        <path d="M21 18v4" />
        <path d="M22 5v11" />
        <path d="M20 5h4" />
        <path d="M20 16h4" />
      </svg>
      <span>宽高比计算器</span>
    </a>

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
