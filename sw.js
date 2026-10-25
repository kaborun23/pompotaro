const CACHE = 'firefighter-v2.0';  // index.html フッターの Ver と合わせる
// index.html ではなく './' を保存する（Cloudflare Pages は /index.html → / に転送するため）
const ASSETS = ['./', './manifest.json', './icon.svg'];

// 転送（リダイレクト）された応答はそのまま返すとページ表示でエラーになるので作り直す
async function cleanResponse(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(url =>
    fetch(url, { cache: 'reload' }).then(cleanResponse).then(res => c.put(url, res))
  ))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // ページを開くとき（/ でも /index.html でも）は保存した './' を返す
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./').then(cached => cached || fetch(e.request).then(cleanResponse))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
