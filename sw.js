/* © 2026 Monuverse. Tous droits réservés. Reproduction interdite sans autorisation (voir LICENSE.md). */
/* Hors ligne : l'appli s'ouvre même sans réseau. Les données de la carte et du classement restent en ligne. */
const CACHE = 'monuverse-v1-18';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.webmanifest', 'icons/logo.jpg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'lib/d3.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // « no-cache » : le téléphone redemande toujours au site s'il y a une nouvelle version (réponse courte si rien n'a changé)
  const net = () => fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then(r => (e.request.mode === 'navigate' && r.redirected) ? fetch(e.request) : r);
  e.respondWith(net().then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
