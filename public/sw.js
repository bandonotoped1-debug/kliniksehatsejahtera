/* =============================================================
 * sw.js — Service Worker PWA Klinik Pratama Sehat Sejahtera
 * Strategi:
 *   HTML          → network-first (konten selalu segar, fallback cache/offline)
 *   CSS/JS/gambar → stale-while-revalidate (tampil instan, diperbarui diam-diam)
 *   Font Google   → cache-first
 *   Apps Script   → tidak pernah di-cache
 * Naikkan VERSION setiap kali deploy agar cache lama dibersihkan.
 * ============================================================= */
const VERSION = 'klinik-202609150830';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const MAX_RUNTIME_ENTRIES = 80;

const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/profil.html',
  '/layanan.html',
  '/layanan/poli-umum.html',
  '/layanan/poli-gigi.html',
  '/layanan/khitan.html',
  '/layanan/umrah-haji.html',
  '/layanan/bekam.html',
  '/layanan/farmasi.html',
  '/layanan/top-dokter.html',
  '/dokter.html',
  '/apotek.html',
  '/artikel.html',
  '/artikel/kapan-anak-sebaiknya-dikhitan.html',
  '/artikel/gusi-berdarah-saat-sikat-gigi.html',
  '/artikel/kontrol-hipertensi-tanpa-putus-obat.html',
  '/pendaftaran.html',
  '/kontak.html',
  '/kebijakan-privasi.html',
  '/antrean.html',
  '/assets/css/style.css?v=1a3094f3',
  '/assets/js/app.js?v=1a3094f3',
  '/assets/js/config.js?v=1a3094f3',
  '/assets/js/forms.js?v=1a3094f3',
  '/assets/js/antrean.js?v=1a3094f3',
  '/assets/img/logo-klinik.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/maskable-512.png',
  '/assets/icons/favicon.svg',
  '/manifest.webmanifest'
];

/* Placeholder gambar saat offline (inline, tanpa request jaringan) */
const IMG_FALLBACK = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#eef2ea"/><g fill="none" stroke="#9fb28d" stroke-width="3" stroke-linecap="round"><path d="M250 190h100M300 140v100"/></g><text x="300" y="300" font-family="system-ui,sans-serif" font-size="18" fill="#7d8f6d" text-anchor="middle">Gambar tidak tersedia offline</text></svg>`;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* Batasi jumlah entri cache runtime agar tidak membengkak */
async function trimCache(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => c.delete(k)));
}

const isHTML = req => req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Jangan pernah cache backend / analytics / halaman admin
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleusercontent.com') ||
      url.hostname.includes('wa.me') ||
      url.pathname.startsWith('/admin')) return;

  // Navigasi halaman → network-first
  if (isHTML(req)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME).then(c => c.put(req, copy).then(() => trimCache(RUNTIME, MAX_RUNTIME_ENTRIES)));
          }
          return res;
        })
        .catch(() => caches.match(req)
          .then(r => r || caches.match(req.url, { ignoreSearch: true }))
          .then(r => r || caches.match('/offline.html'))
          .then(r => r || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })))
    );
    return;
  }

  // Font Google → cache-first (jarang berubah)
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy));
        return res;
      }).catch(() => hit || Response.error()))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Aset statis → stale-while-revalidate
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy).then(() => trimCache(RUNTIME, MAX_RUNTIME_ENTRIES)));
        }
        return res;
      }).catch(() => {
        if (hit) return hit;
        if (req.destination === 'image') {
          return new Response(IMG_FALLBACK, { headers: { 'Content-Type': 'image/svg+xml' } });
        }
        return Response.error();
      });
      return hit || net;
    })
  );
});
