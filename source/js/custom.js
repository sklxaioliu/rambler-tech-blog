/* 连接主题原生搜索、深浅模式，不重复实现功能。 */
document.addEventListener('DOMContentLoaded', () => {
  const portal = document.getElementById('portal-home');
  if (!portal) return;
  const subtitle = document.getElementById('site-subtitle');
  if (subtitle) document.getElementById('portal-quote').replaceChildren(subtitle);
  portal.querySelector('[data-portal-action="search"]').addEventListener('click', () => document.querySelector('#search-button > .search')?.click());
  portal.querySelector('[data-portal-action="theme"]').addEventListener('click', () => document.getElementById('darkmode')?.click());
  const updateClock = () => {
    const now = new Date();
    const time = document.getElementById('portal-time');
    time.textContent = new Intl.DateTimeFormat('zh-CN', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Shanghai'}).format(now);
    time.dateTime = now.toISOString();
    document.getElementById('portal-date').textContent = new Intl.DateTimeFormat('zh-CN', {month:'long', day:'numeric', weekday:'long', timeZone:'Asia/Shanghai'}).format(now);
  };
  updateClock();
  window.setInterval(updateClock, 30000);
});
