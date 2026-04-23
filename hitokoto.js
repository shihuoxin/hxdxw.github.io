// 本地诗词列表（随机选取）
const poems = [
  '落霞与孤鹜齐飞，秋水共长天一色',
  '山重水复疑无路，柳暗花明又一村',
  '春风得意马蹄疾，一日看尽长安花',
  '人生若只如初见，何事秋风悲画扇',
  '曾经沧海难为水，除却巫山不是云',
  '愿得一心人，白头不相离',
  '两情若是久长时，又岂在朝朝暮暮',
  '入我相思门，知我相思苦',
  '问世间，情为何物，直教生死相许',
  '衣带渐宽终不悔，为伊消得人憔悴',
  '众里寻他千百度，蓦然回首，那人却在，灯火阑珊处',
  '此情可待成追忆，只是当时已惘然',
  '人生得意须尽欢，莫使金樽空对月',
  '天生我材必有用，千金散尽还复来',
  '长风破浪会有时，直挂云帆济沧海'
];

function fetchHitokoto() {
  const el = document.getElementById('hitokoto-text');
  if (!el) return;
  const random = poems[Math.floor(Math.random() * poems.length)];
  el.textContent = random;
}

// 页面加载时获取一言
fetchHitokoto();

// 复制功能
const copyBtn = document.getElementById('copy-btn');
const hitokotoText = document.getElementById('hitokoto-text');
copyBtn?.addEventListener('click', () => {
  if (!hitokotoText || !copyBtn) return;
  const text = hitokotoText.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    copyBtn.style.color = 'var(--accent)';
    setTimeout(() => {
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      copyBtn.style.color = '';
    }, 1500);
  }).catch(() => {
    // 权限拒绝或非安全上下文时降级：选中文字
    if (!hitokotoText) return;
    const range = document.createRange();
    range.selectNodeContents(hitokotoText);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });
});

// 刷新功能
document.getElementById('refresh-btn')?.addEventListener('click', fetchHitokoto);

// 搜索功能（必应）
document.getElementById('search-btn')?.addEventListener('click', () => {
  const el = document.getElementById('hitokoto-text');
  if (!el) return;
  window.open('https://www.bing.com/search?q=' + encodeURIComponent(el.textContent), '_blank');
});
