/* =============================================================
 * render.js — Komponen & layout dasar (dipakai build.js)
 * ============================================================= */
const { CONFIG, NAV } = require('./data/site');

/* ------------------------------------------------------- ICONS */
/* Ikon stroke 24x24 (gaya Lucide). Ringan, tanpa library eksternal. */
const P = {
  stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 12 0V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3"/><path d="M8 15v1a6 6 0 0 0 12 0v-4"/><circle cx="20" cy="10" r="2"/>',
  tooth: '<path d="M12 5.5c-1.5-1.2-3-2-4.7-2C4.9 3.5 3 5.6 3 8.6c0 2 .6 3.4 1.2 5.2.5 1.5.7 3 .9 4.5.2 1.5.7 2.7 1.8 2.7 1.3 0 1.7-1.4 2-3 .3-1.6.6-3 3.1-3s2.8 1.4 3.1 3c.3 1.6.7 3 2 3 1.1 0 1.6-1.2 1.8-2.7.2-1.5.4-3 .9-4.5.6-1.8 1.2-3.2 1.2-5.2 0-3-1.9-5.1-4.3-5.1-1.7 0-3.2.8-4.7 2Z"/>',
  'shield-heart': '<path d="M20 13c0 5-3.5 7.5-7.7 8.9a2 2 0 0 1-1.3 0C6.8 20.5 3.3 18 3.3 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.9 1.9 0 0 1 2.5 0C14.7 3.8 17.2 5 19.2 5a1 1 0 0 1 1 1z"/><path d="M11.6 14.8 9.3 12.6a1.6 1.6 0 1 1 2.3-2.2l.1.1.1-.1a1.6 1.6 0 1 1 2.3 2.2l-2.3 2.2a.3.3 0 0 1-.2 0Z"/>',
  pill: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
  video: '<path d="m16 13 5.2 3.1a.5.5 0 0 0 .8-.4V8.3a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 8.9a2 2 0 0 1-1.3 0C6.8 20.5 3.3 18 3.3 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.9 1.9 0 0 1 2.5 0C14.7 3.8 17.2 5 19.2 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  phone: '<path d="M13.8 10.2a11 11 0 0 0 4.7 4.7l1.6-1.6a1.4 1.4 0 0 1 1.4-.3c1.1.4 2.3.6 3.5.6"/><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8 10"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 8.5 5.6a2.7 2.7 0 0 0 3 0L22 7"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-up-right': '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  check: '<path d="m4 12 5.5 5.5L20 7"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5L16 9.5"/>',
  star: '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/>',
  menu: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M8.8 8.3c.2-.5.4-.5.6-.5h.6c.2 0 .5 0 .7.6l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6a7 7 0 0 0 3 2.6c.3.1.5.1.7-.1l.7-.8c.2-.2.4-.2.6-.1l1.9 1c.2.1.4.2.4.4a2 2 0 0 1-1.4 1.8c-.7.2-1.7.3-4-.7a9 9 0 0 1-4.4-4.6c-.5-1.2-.4-2.3.1-3.1z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.3" cy="6.7" r="1"/>',
  facebook: '<path d="M15.5 8.5h-2a1.5 1.5 0 0 0-1.5 1.5v2.5h3.4l-.5 3.4H12V22"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
  'wifi-off': '<path d="m2 2 20 20"/><path d="M8.6 15.3a5 5 0 0 1 6.8 0"/><path d="M5 12a10 10 0 0 1 3-2"/><path d="M19 12a10 10 0 0 0-8.5-2.9"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8a15 15 0 0 0-6.6-3.4"/><path d="M12 19h.01"/>',
  download: '<path d="M12 3v12"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
  sparkles: '<path d="M12 2.5 13.8 8 19 9.8 13.8 11.6 12 17l-1.8-5.4L5 9.8 10.2 8Z"/><path d="M18.5 15.5 19.3 18l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8Z"/>',
  quote: '<path d="M9.5 6.5C6.5 8 5 10.5 5 14v3.5h5.5V11H8c0-1.8.6-3 1.5-3.7z"/><path d="M18.5 6.5C15.5 8 14 10.5 14 14v3.5h5.5V11H17c0-1.8.6-3 1.5-3.7z"/>',
  alert: '<path d="M12 3.5 21.5 20H2.5z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/>',
  file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3"/>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M15 9h3a2 2 0 0 1 2 2v10"/><path d="M8 7h3M8 11h3M8 15h3"/><path d="M2 21h20"/>',
  heart: '<path d="M12 20.5 4.2 13a4.9 4.9 0 0 1 7-6.9l.8.8.8-.8a4.9 4.9 0 0 1 7 6.9z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>'
};
const icon = (n, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

/* ------------------------------------------------------ HELPERS */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const waLink = (msg) => `https://wa.me/${CONFIG.waNumber}?text=${encodeURIComponent(msg)}`;
/* Nomor WhatsApp khusus per layanan (mis. Khitan), fallback ke nomor utama */
const waFor = (serviceName) => (CONFIG.waByService && CONFIG.waByService[serviceName]) || { number: CONFIG.waNumber, display: CONFIG.waDisplay, label: 'Admin Pendaftaran' };
const waLinkTo = (serviceName, msg) => `https://wa.me/${waFor(serviceName).number}?text=${encodeURIComponent(msg)}`;
const stars = n => Array.from({ length: 5 }, (_, i) => icon('star', i < n ? 'st on' : 'st')).join('');

/* --------------------------------------------------------- HEAD */
function head({ title, description, path, keywords = [], schema = [], preload = [] }) {
  const url = CONFIG.domain + path;
  const ogImg = CONFIG.domain + '/assets/img/og-cover.png';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords.length ? `<meta name="keywords" content="${esc(keywords.join(', '))}">` : ''}
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="${esc(CONFIG.siteName)}">
<meta name="geo.region" content="ID-JI"><meta name="geo.placename" content="Blitar">
<meta name="geo.position" content="${CONFIG.address.lat};${CONFIG.address.lng}">

<meta property="og:type" content="website">
<meta property="og:locale" content="id_ID">
<meta property="og:site_name" content="${esc(CONFIG.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">

<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D2B20" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${esc(CONFIG.shortName)}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/logo-klinik.png" sizes="any">
<link rel="apple-touch-icon" href="/assets/icons/icon-180.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/style.css?v=${CONFIG.assetV || 0}">
${preload.map(p => `<link rel="preload" href="${p.href}" as="${p.as}"${p.type ? ` type="${p.type}"` : ''}${p.as === 'font' ? ' crossorigin' : ''}>`).join('\n')}
${schema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}`;
}

/* ------------------------------------------------------- HEADER */
function header(active = '/') {
  const isActive = h => (h === '/' ? active === '/' : active.startsWith(h.replace('.html', '')));
  const navItems = NAV.map(n => {
    if (n.children) {
      return `<li class="has-sub">
        <a href="${n.href}" class="${isActive(n.href) ? 'on' : ''}">${n.label}${icon('chevron', 'chev')}</a>
        <div class="submenu"><div class="submenu-in">
          ${n.children.map(c => `<a href="${c.href}"><span>${c.label}</span>${icon('arrow-right')}</a>`).join('')}
        </div></div>
      </li>`;
    }
    return `<li><a href="${n.href}" class="${isActive(n.href) ? 'on' : ''}">${n.label}</a></li>`;
  }).join('');

  const mobileItems = NAV.map(n => {
    if (n.children) {
      return `<div class="m-group"><span class="m-label">${n.label}</span>
        ${n.children.map(c => `<a href="${c.href}">${c.label}</a>`).join('')}
        <a href="${n.href}">Semua Layanan</a></div>`;
    }
    return `<a class="m-item" href="${n.href}">${n.label}</a>`;
  }).join('');

  return `<a class="skip" href="#main">Lompat ke konten utama</a>
<div class="topbar">
  <div class="wrap topbar-in">
    <span class="tb-addr">${icon('map-pin')} ${CONFIG.address.street}, ${CONFIG.address.city}</span>
    <span class="tb-sep"></span>
    <span class="tb-hours">${icon('clock')} Senin–Sabtu 06.00–11.30 &amp; 17.00–20.30</span>
    <a class="tb-wa" href="tel:+${CONFIG.waNumber}">${icon('phone')} ${CONFIG.waDisplay}</a>
  </div>
</div>
<header class="hd" id="hd">
  <div class="wrap hd-in">
    <a class="brand" href="/">
      <img src="/assets/img/logo-klinik.png" alt="Logo Klinik Pratama Sehat Sejahtera" width="44" height="44" fetchpriority="high">
      <span class="brand-tx"><strong>Klinik Pratama</strong><em>Sehat Sejahtera</em></span>
    </a>
    <nav class="nav" aria-label="Menu utama"><ul>${navItems}</ul></nav>
    <div class="hd-act">
      <a class="btn btn-ghost hide-sm" href="/layanan/top-dokter.html">${icon('video')} Top Dokter</a>
      <a class="btn btn-primary" href="/pendaftaran.html">${icon('calendar')} Daftar Online</a>
      <button class="burger" id="burger" aria-label="Buka menu" aria-expanded="false" aria-controls="mnav">${icon('menu')}</button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mnav-hd">
    <span>Menu</span>
    <button id="mclose" aria-label="Tutup menu">${icon('x')}</button>
  </div>
  <div class="mnav-body">${mobileItems}</div>
  <div class="mnav-ft">
    <a class="btn btn-primary block" href="/pendaftaran.html">${icon('calendar')} Daftar Online</a>
    <a class="btn btn-wa block" href="${waLink('Halo Admin Klinik Pratama Sehat Sejahtera, saya ingin bertanya.')}" target="_blank" rel="noopener">${icon('whatsapp')} Chat WhatsApp</a>
  </div>
</div>`;
}

/* ------------------------------------------------------- FOOTER */
function footer() {
  const { SERVICES, PHARMACIES } = require('./data/site');
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft-grid">
      <div class="ft-col ft-brand">
        <a class="brand" href="/"><img src="/assets/img/logo-klinik.png" alt="" width="48" height="48"><span class="brand-tx"><strong>Klinik Pratama</strong><em>Sehat Sejahtera</em></span></a>
        <p>Klinik pratama dan apotek terpadu di Kota Blitar. Melayani Poli Umum, Poli Gigi, Khitan, Farmasi, dan konsultasi online Top Dokter.</p>
        <p style="font-size:13px;margin-top:20px;opacity:.75">Ikuti kami: ${CONFIG.social.instagramHandle} · Apotek: ${CONFIG.social.apotekInstagramHandle}</p>
        <div class="ft-soc">
          <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>
          <a href="${CONFIG.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook Klinik">${icon('facebook')}</a>
          <a href="${CONFIG.social.apotekInstagram}" target="_blank" rel="noopener" aria-label="Instagram Apotek Mahira Farma" title="Instagram Apotek Mahira Farma">${icon('pill')}</a>
          <a href="${waLink('Halo Klinik Sehat Sejahtera')}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
        </div>
      </div>
      <div class="ft-col">
        <h3>Layanan</h3>
        <ul>${SERVICES.map(s => `<li><a href="/layanan/${s.slug}.html">${s.name}</a></li>`).join('')}</ul>
      </div>
      <div class="ft-col">
        <h3>Apotek Mahira Farma</h3>
        <ul>${PHARMACIES.map(p => `<li><a href="/apotek.html#${p.slug}">${p.name} — ${p.area}</a></li>`).join('')}</ul>
        <h3 style="margin-top:22px">Informasi</h3>
        <ul>
          <li><a href="/profil.html">Profil Klinik</a></li>
          <li><a href="/dokter.html">Jadwal Dokter</a></li>
          <li><a href="/artikel.html">Artikel Kesehatan</a></li>
          <li><a href="/kebijakan-privasi.html">Kebijakan Privasi</a></li>
        </ul>
      </div>
      <div class="ft-col">
        <h3>Hubungi Kami</h3>
        <ul class="ft-contact">
          <li>${icon('map-pin')}<span>${CONFIG.address.street}<br>${CONFIG.address.district}, ${CONFIG.address.city}, ${CONFIG.address.region}</span></li>
          <li>${icon('phone')}<span>Pendaftaran umum<br><a href="tel:+${CONFIG.waNumber}">${CONFIG.waDisplay}</a></span></li>
          <li>${icon('shield-heart')}<span>Admin khitan<br><a href="tel:+${CONFIG.waByService['Pelayanan Khitan'].number}">${CONFIG.waByService['Pelayanan Khitan'].display}</a></span></li>
          <li>${icon('clock')}<span>Senin–Sabtu<br>06.00–11.30 &amp; 17.00–20.30</span></li>
        </ul>
        <a class="btn btn-wa block" style="margin-top:16px" href="${waLink('Halo Admin, saya ingin mendaftar berobat.')}" target="_blank" rel="noopener">${icon('whatsapp')} Daftar via WhatsApp</a>
      </div>
    </div>
    <div class="ft-bar">
      <p>© ${new Date().getFullYear()} ${CONFIG.siteName}. Seluruh hak cipta dilindungi.</p>
      <p class="ft-note">Informasi di situs ini bersifat edukatif dan tidak menggantikan pemeriksaan langsung oleh tenaga medis.</p>
    </div>
  </div>
</footer>
<nav class="dock" aria-label="Navigasi cepat">
  <a href="/"><span>${icon('heart')}</span>Beranda</a>
  <a href="/layanan.html"><span>${icon('stethoscope')}</span>Layanan</a>
  <a class="dock-cta" href="/pendaftaran.html"><span>${icon('calendar')}</span>Daftar</a>
  <a href="/apotek.html"><span>${icon('pill')}</span>Apotek</a>
  <a href="${waLink('Halo Admin Klinik Sehat Sejahtera')}" target="_blank" rel="noopener"><span>${icon('whatsapp')}</span>Chat</a>
</nav>`;
}

/* --------------------------------------------------------- PAGE */
function page({ title, description, path, keywords, schema, body, bodyClass = '', extraJs = [] }) {
  return `<!doctype html>
<html lang="id">
<head>
${head({ title, description, path, keywords, schema })}
</head>
<body class="${bodyClass}">
${header(path)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/js/config.js?v=${CONFIG.assetV || 0}" defer></script>
<script src="/assets/js/app.js?v=${CONFIG.assetV || 0}" defer></script>
${extraJs.map(j => `<script src="${j}?v=${CONFIG.assetV || 0}" defer></script>`).join('\n')}
</body>
</html>`;
}

module.exports = { icon, esc, waLink, waFor, waLinkTo, stars, head, header, footer, page, CONFIG };
