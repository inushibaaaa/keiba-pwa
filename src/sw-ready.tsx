// 超簡易版：PWA更新の通知
export function hookServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 新バージョンに切替完了 → ページ再読込
    window.location.reload()
  })
  // vite-plugin-pwa の autoUpdate で更新検知される
}
