#!/usr/bin/env node
/* =============================================================
 * build.js — Generator halaman statis
 * Jalankan: node build.js
 * Output  : folder /public (siap di-deploy apa adanya)
 * ============================================================= */
const fs = require('fs');
const path = require('path');
const D = require('./src/data/site');
const KONTEN = require('./src/konten');
const { CONFIG, SERVICES, PHARMACIES, DOCTORS, ARTICLES, SEO } = D;
const R = require('./src/render');
const PG = require('./src/pages');

const OUT = path.join(__dirname, 'public');
const write = (rel, content) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return rel;
};

/* Tarik konten yang diedit lewat panel admin lebih dulu. Isinya
 * menimpa data bawaan di src/data/site.js. Bila server tidak
 * terjangkau, build tetap lanjut dengan data bawaan. */
KONTEN.muat(D)
  .then(lap => {
    if (lap.dipakai) {
      const rinci = Object.entries(lap.diterapkan).map(([k, n]) => `${k}:${n}`).join(' ');
      console.log('✓ Konten dari panel admin dipakai — ' + rinci);
    } else {
      console.log('• Memakai data bawaan src/data/site.js (' + lap.alasan + ')');
    }
  })
  .catch(err => {
    // Gagal menarik konten tidak boleh menggagalkan build.
    console.log('• Memakai data bawaan — gagal memuat konten: ' + err.message);
  })
  .then(() => bangun());   // error DI DALAM bangun() harus tetap menggagalkan build

function bangun() {
  /* ============================ PENANDA VERSI ASET ============================
   * Berkas di /assets/* di-cache satu tahun (immutable) demi kecepatan.
   * Tanpa penanda versi pada URL-nya, perubahan pada style.css / app.js /
   * admin.js TIDAK PERNAH sampai ke pengunjung lama — mereka terus memakai
   * salinan lama dari cache browser. Penanda di bawah berubah setiap kali isi
   * berkasnya berubah, sehingga URL-nya ikut berubah dan cache lama ditinggalkan.
   * ========================================================================== */
  const crypto = require('crypto');
  const RUNTIME_CFG = {
    gasUrl: CONFIG.gasUrl,
    waNumber: CONFIG.waNumber,
    waByService: CONFIG.waByService || {},
    siteName: CONFIG.siteName,
    services: SERVICES.map(s => s.name),
    pharmacies: PHARMACIES.map(p => ({ name: p.name, area: p.area })),
    antrean: { pollDetik: D.ANTREAN.pollDetik, poli: D.ANTREAN.poli },
    /* Dipakai assets/js/status.js untuk menghitung buka/tutup di browser */
    statusBaris: CONFIG.statusBaris || []
  };
  const ASET_SUMBER = [
    'assets/css/style.css', 'assets/js/app.js', 'assets/js/forms.js',
    'assets/js/antrean.js', 'assets/js/admin.js', 'assets/js/admin-konten.js',
    'assets/js/status.js'
  ];
  const hash = crypto.createHash('sha1');
  ASET_SUMBER.forEach(f => {
    const abs = path.join(OUT, f);
    if (fs.existsSync(abs)) hash.update(fs.readFileSync(abs));
  });
  hash.update(JSON.stringify(RUNTIME_CFG));
  hash.update(JSON.stringify(KONTEN.bawaan(D)));
  const V = hash.digest('hex').slice(0, 8);
  CONFIG.assetV = V;          // dipakai src/render.js untuk menempel ?v= pada URL aset

  /* -------------------------------------------------- SCHEMA.ORG */
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': CONFIG.domain + '/#klinik',
    name: CONFIG.siteName,
    alternateName: 'Klinik SSS Blitar',
    url: CONFIG.domain,
    logo: CONFIG.domain + '/assets/img/logo-klinik.png',
    image: CONFIG.domain + '/assets/img/logo-klinik.png',
    telephone: '+' + CONFIG.waNumber,
    priceRange: 'Rp',
    currenciesAccepted: 'IDR',
    paymentAccepted: 'Tunai, Transfer, QRIS',
    description: 'Klinik pratama di Kota Blitar dengan layanan Poli Umum, Poli Gigi, Pelayanan Khitan, Pelayanan Farmasi, dan konsultasi dokter online Top Dokter.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONFIG.address.street,
      addressLocality: CONFIG.address.city,
      addressRegion: CONFIG.address.region,
      postalCode: CONFIG.address.postal,
      addressCountry: CONFIG.address.country
    },
    geo: { '@type': 'GeoCoordinates', latitude: CONFIG.address.lat, longitude: CONFIG.address.lng },
    openingHoursSpecification: CONFIG.hoursSchema.map(h => ({
      '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes
    })),
    areaServed: [
      { '@type': 'City', name: 'Kota Blitar' },
      { '@type': 'AdministrativeArea', name: 'Kabupaten Blitar' }
    ],
    medicalSpecialty: ['PrimaryCare', 'Dentistry', 'Pharmacy'],
    availableService: SERVICES.map(s => ({
      '@type': 'MedicalProcedure', name: s.name, description: s.short, url: `${CONFIG.domain}/layanan/${s.slug}.html`
    })),
    sameAs: [CONFIG.social.instagram, CONFIG.social.facebook, CONFIG.social.linktree],
    subOrganization: PHARMACIES.map(p => ({
      '@type': 'Pharmacy', name: p.name, address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: 'Blitar', addressCountry: 'ID' }
    }))
  };

  const siteSchema = {
    '@context': 'https://schema.org', '@type': 'WebSite', url: CONFIG.domain, name: CONFIG.siteName, inLanguage: 'id-ID'
  };

  const crumbSchema = items => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: CONFIG.domain + it.url }))
  });

  /* ================================================= HALAMAN === */
  const pages = [];

  /* Beranda */
  pages.push(write('index.html', R.page({
    title: 'Klinik Pratama Sehat Sejahtera Blitar | Poli Umum, Gigi, Khitan & Apotek',
    description: 'Klinik pratama di Sananwetan, Kota Blitar. Poli Umum, Poli Gigi, Khitan, Apotek Mahira Farma, dan konsultasi dokter online Top Dokter. Buka 06.00 & 17.00–20.30. Daftar online lewat WhatsApp.',
    path: '/', keywords: SEO.primary,
    schema: [orgSchema, siteSchema],
    body: PG.home(), extraJs: ['/assets/js/status.js']
  })));

  /* Profil */
  pages.push(write('profil.html', R.page({
    title: 'Profil Klinik Pratama Sehat Sejahtera | Klinik Terpercaya di Blitar',
    description: 'Mengenal Klinik Pratama Sehat Sejahtera Blitar: data praktik, keunggulan layanan, jam buka pagi & malam, serta rencana integrasi BPJS Kesehatan dan SATUSEHAT.',
    path: '/profil.html', keywords: ['profil klinik Blitar', 'klinik pratama Sananwetan', ...SEO.primary.slice(0, 4)],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Profil', url: '/profil.html' }])],
    body: PG.profil()
  })));

  /* Layanan index */
  pages.push(write('layanan.html', R.page({
    title: 'Layanan Klinik di Blitar: Poli Umum, Gigi, Khitan, Farmasi | Klinik SSS',
    description: 'Lima layanan unggulan Klinik Pratama Sehat Sejahtera Blitar: Poli Umum, Poli Gigi, Pelayanan Khitan, Pelayanan Farmasi, dan Top Dokter konsultasi online.',
    path: '/layanan.html', keywords: SEO.primary,
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Layanan', url: '/layanan.html' }])],
    body: PG.layananIndex()
  })));

  /* Detail layanan */
  const svcSeo = {
    'poli-umum': { t: 'Poli Umum Blitar — Dokter Umum, Surat Sehat, Kontrol Kronis | Klinik SSS', k: ['dokter umum Blitar', 'poli umum Blitar', 'surat keterangan sehat Blitar', 'klinik terdekat Blitar'] },
    'poli-gigi': { t: 'Dokter Gigi Blitar — Tambal, Cabut, Scaling | Klinik Pratama Sehat Sejahtera', k: ['dokter gigi Blitar', 'tambal gigi Blitar', 'scaling gigi Blitar', 'cabut gigi Blitar', 'dokter gigi anak Blitar'] },
    'khitan': { t: 'Khitan / Sunat Blitar — Metode Klem & Kauter, Minim Nyeri | Klinik SSS', k: ['khitan Blitar', 'sunat Blitar', 'khitan modern Blitar', 'sunat anak Blitar', 'khitan klem Blitar'] },
    'umrah-haji': { t: 'Vaksin Meningitis & MCU Umrah Haji Blitar — Kerja Sama RSU Aminah | Klinik SSS', k: ['vaksin meningitis Blitar', 'vaksin umrah Blitar', 'MCU umrah Blitar', 'medical check up haji Blitar', 'surat layak terbang Blitar'] },
    'bekam': { t: 'Terapi Bekam Blitar — Bekam Basah & Kering, Alat Sekali Pakai | Klinik SSS', k: ['bekam Blitar', 'terapi bekam Blitar', 'hijamah Blitar', 'bekam basah Blitar', 'tempat bekam Blitar'] },
    'farmasi': { t: 'Apotek & Pelayanan Farmasi Blitar — Mahira Farma | Klinik SSS', k: ['apotek Blitar', 'apotek Mahira Farma', 'tebus obat Blitar', 'apotek buka malam Blitar'] },
    'top-dokter': { t: 'Top Dokter — Konsultasi Dokter Online & Tebus Obat di Blitar | Klinik SSS', k: ['konsultasi dokter online Blitar', 'dokter online Blitar', 'tebus obat online Blitar', 'telekonsultasi Blitar'] }
  };
  SERVICES.forEach(s => {
    // Layanan yang ditambahkan lewat panel admin belum punya entri svcSeo.
    // Judul & kata kunci dibentuk otomatis agar build tidak pernah gagal.
    const m = svcSeo[s.slug] || {
      t: `${s.name} Blitar — ${(s.short || '').replace(/\.$/, '')} | ${CONFIG.shortName}`.slice(0, 120),
      k: [`${s.name} Blitar`.toLowerCase(), `${s.name} Kota Blitar`.toLowerCase(), ...SEO.primary.slice(0, 3)]
    };
    pages.push(write(`layanan/${s.slug}.html`, R.page({
      title: m.t,
      description: `${s.hero}. ${s.short} Klinik Pratama Sehat Sejahtera, Sananwetan Kota Blitar. Daftar online lewat WhatsApp.`,
      path: `/layanan/${s.slug}.html`, keywords: m.k,
      schema: [
        crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Layanan', url: '/layanan.html' }, { name: s.name, url: `/layanan/${s.slug}.html` }]),
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faq.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) },
        { '@context': 'https://schema.org', '@type': 'MedicalProcedure', name: s.name, description: s.intro, provider: { '@id': CONFIG.domain + '/#klinik' } }
      ],
      body: PG.serviceDetail(s),
      extraJs: s.slug === 'top-dokter' ? ['/assets/js/forms.js'] : []
    })));
  });

  /* Dokter */
  pages.push(write('dokter.html', R.page({
    title: 'Jadwal Dokter Klinik Pratama Sehat Sejahtera Blitar | Pagi & Malam',
    description: 'Jadwal praktik dokter umum, dokter gigi, dan apoteker di Klinik Pratama Sehat Sejahtera Blitar. Sesi pagi 06.00–11.30 dan sore 17.00–20.30.',
    path: '/dokter.html', keywords: ['jadwal dokter Blitar', 'dokter umum Blitar', 'dokter gigi Blitar', 'praktik dokter Sananwetan'],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Dokter', url: '/dokter.html' }])],
    body: PG.dokter()
  })));

  /* Apotek */
  pages.push(write('apotek.html', R.page({
    title: 'Apotek Mahira Farma Blitar — 3 Cabang: Ngentak, Ngrobyong, Penataran',
    description: 'Apotek Mahira Farma 1 (Ngrobyong), 2 (Ngentak), dan 4 (Penataran). Obat lengkap dan asli, konseling apoteker gratis, tebus resep online dan pengantaran di Kota Blitar.',
    path: '/apotek.html', keywords: ['apotek Blitar', 'Apotek Mahira Farma', 'apotek Ngentak', 'apotek Nglegok', 'tebus obat Blitar'],
    schema: [
      crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Apotek', url: '/apotek.html' }]),
      ...PHARMACIES.map(p => ({
        '@context': 'https://schema.org', '@type': 'Pharmacy', name: p.name, url: `${CONFIG.domain}/apotek.html#${p.slug}`,
        telephone: '+' + p.phone, address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: 'Blitar', addressRegion: 'Jawa Timur', addressCountry: 'ID' },
        parentOrganization: { '@id': CONFIG.domain + '/#klinik' }
      }))
    ],
    body: PG.apotek()
  })));

  /* Artikel */
  pages.push(write('artikel.html', R.page({
    title: 'Artikel Kesehatan — Klinik Pratama Sehat Sejahtera Blitar',
    description: 'Artikel kesehatan praktis dari tim medis Klinik Pratama Sehat Sejahtera Blitar: khitan anak, kesehatan gigi, hipertensi, dan lainnya.',
    path: '/artikel.html', keywords: ['artikel kesehatan', 'tips kesehatan Blitar', 'edukasi kesehatan'],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Artikel', url: '/artikel.html' }])],
    body: PG.artikelIndex()
  })));

  ARTICLES.forEach(a => {
    pages.push(write(`artikel/${a.slug}.html`, R.page({
      title: `${a.title} | Klinik Pratama Sehat Sejahtera Blitar`,
      description: a.excerpt,
      path: `/artikel/${a.slug}.html`, keywords: [a.category.toLowerCase() + ' Blitar', ...SEO.primary.slice(0, 3)],
      schema: [
        crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Artikel', url: '/artikel.html' }, { name: a.title, url: `/artikel/${a.slug}.html` }]),
        {
          '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.excerpt,
          datePublished: a.date, dateModified: a.date, inLanguage: 'id-ID',
          author: { '@type': 'Organization', name: CONFIG.siteName },
          publisher: { '@id': CONFIG.domain + '/#klinik' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${CONFIG.domain}/artikel/${a.slug}.html` }
        }
      ],
      body: PG.articleDetail(a)
    })));
  });

  /* Pendaftaran */
  pages.push(write('pendaftaran.html', R.page({
    title: 'Pendaftaran Online Klinik Blitar — Daftar Lewat WhatsApp | Klinik SSS',
    description: 'Daftar berobat online di Klinik Pratama Sehat Sejahtera Blitar. Isi formulir kurang dari 2 menit, nomor antrean langsung dikirim ke WhatsApp Anda.',
    path: '/pendaftaran.html', keywords: ['daftar online klinik Blitar', 'pendaftaran klinik Blitar', 'antrean klinik Blitar'],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Pendaftaran', url: '/pendaftaran.html' }])],
    body: PG.pendaftaran(), extraJs: ['/assets/js/forms.js']
  })));

  /* Kontak */
  pages.push(write('kontak.html', R.page({
    title: 'Kontak & Lokasi Klinik Pratama Sehat Sejahtera Blitar',
    description: `Hubungi Klinik Pratama Sehat Sejahtera Blitar di ${CONFIG.waDisplay}. Alamat: ${CONFIG.address.street}, ${CONFIG.address.district}, ${CONFIG.address.city}.`,
    path: '/kontak.html', keywords: ['alamat klinik Blitar', 'nomor telepon klinik Blitar', 'kontak klinik Sananwetan'],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Kontak', url: '/kontak.html' }])],
    body: PG.kontak(), extraJs: ['/assets/js/forms.js']
  })));

  /* Privasi */
  pages.push(write('kebijakan-privasi.html', R.page({
    title: 'Kebijakan Privasi | Klinik Pratama Sehat Sejahtera Blitar',
    description: 'Bagaimana Klinik Pratama Sehat Sejahtera mengumpulkan, menggunakan, dan melindungi data pribadi pasien.',
    path: '/kebijakan-privasi.html',
    schema: [], body: PG.privasi()
  })));

  /* Offline (PWA fallback) */
  pages.push(write('offline.html', R.page({
    title: 'Offline | Klinik Pratama Sehat Sejahtera',
    description: 'Anda sedang tidak terhubung ke internet.',
    path: '/offline.html', schema: [], body: PG.offlineBody()
  })));

  /* Antrean publik */
  pages.push(write('antrean.html', R.page({
    title: 'Antrean Online Klinik Pratama Sehat Sejahtera Blitar — Pantau Giliran Anda',
    description: 'Papan antrean real-time Klinik Pratama Sehat Sejahtera Blitar. Pantau nomor antrean Poli Umum, Poli Gigi, Khitan, dan Vaksin langsung dari HP Anda.',
    path: '/antrean.html', keywords: ['antrean klinik Blitar', 'nomor antrean online Blitar', 'cek antrean klinik', 'antrean poli umum Blitar'],
    schema: [crumbSchema([{ name: 'Beranda', url: '/' }, { name: 'Antrean', url: '/antrean.html' }])],
    body: PG.antrean(), extraJs: ['/assets/js/antrean.js', '/assets/js/status.js']
  })));

  /* 404 (Netlify custom not-found) */
  pages.push(write('404.html', R.page({
    title: 'Halaman Tidak Ditemukan | Klinik Pratama Sehat Sejahtera Blitar',
    description: 'Halaman yang Anda cari tidak ditemukan. Kembali ke beranda Klinik Pratama Sehat Sejahtera Blitar.',
    path: '/404.html', schema: [], body: PG.notFoundBody()
  })));

  /* =============================================== MANIFEST === */
  write('manifest.webmanifest', JSON.stringify({
    name: CONFIG.siteName + ' Blitar',
    short_name: CONFIG.shortName,
    description: 'Klinik pratama & apotek terpadu di Kota Blitar. Daftar berobat, jadwal dokter, dan konsultasi online Top Dokter.',
    lang: 'id-ID', dir: 'ltr',
    start_url: '/?src=pwa', scope: '/', id: '/',
    display: 'standalone', display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#FFFFFF', theme_color: '#6BA318',
    categories: ['medical', 'health', 'lifestyle'],
    icons: [
      { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    shortcuts: [
      { name: 'Daftar Berobat', short_name: 'Daftar', url: '/pendaftaran.html?src=shortcut', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Top Dokter', short_name: 'Top Dokter', url: '/layanan/top-dokter.html?src=shortcut', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Apotek', short_name: 'Apotek', url: '/apotek.html?src=shortcut', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192' }] }
    ]
  }, null, 2));

  /* ================================================ ROBOTS/SITEMAP */
  write('robots.txt', `User-agent: *
  Allow: /
  Disallow: /admin/
  Disallow: /admin
  Disallow: /*?src=

  Sitemap: ${CONFIG.domain}/sitemap.xml
  `);

  const urls = pages
    .filter(p => !/offline|admin|404/.test(p))
    .map(p => '/' + p.replace(/index\.html$/, ''));
  const today = new Date().toISOString().slice(0, 10);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => {
    const pri = u === '/' ? '1.0' : (u.includes('/layanan/') || u === '/pendaftaran.html') ? '0.9' : u.includes('/artikel/') ? '0.6' : '0.8';
    return `  <url><loc>${CONFIG.domain}${u}</loc><lastmod>${today}</lastmod><changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${pri}</priority></url>`;
  }).join('\n')}
  </urlset>
  `);

  /* ------------------------------------------------ HOST CONFIG */
  write('_headers', `/*
    X-Content-Type-Options: nosniff
    X-Frame-Options: SAMEORIGIN
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: geolocation=(), microphone=(), camera=()
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  /manifest.webmanifest
    Content-Type: application/manifest+json; charset=utf-8
    Cache-Control: public, max-age=3600
  /sw.js
    Content-Type: text/javascript; charset=utf-8
    Cache-Control: no-cache, no-store, must-revalidate
    Service-Worker-Allowed: /
  /offline.html
    Cache-Control: no-cache
  /admin/*
    X-Robots-Tag: noindex, nofollow
  `);

  /* ------------------------------------------------ NETLIFY */
  write('_redirects', `# Rewrite /admin -> /admin/index.html (tanpa ubah URL)
  /admin              /admin/index.html          200
  # Fallback 404 kustom
  /*                  /404.html                  404
  `);

  write('vercel.json', JSON.stringify({
    cleanUrls: true, trailingSlash: false,
    headers: [
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/admin/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' }
      ]}
    ],
    rewrites: [{ source: '/admin', destination: '/admin/index.html' }]
  }, null, 2));

  /* -------------------- DATA BAWAAN UNTUK EDITOR ADMIN */
  /* Dipakai tombol "Isi dari data situs" dan mode demo editor konten. */
  write('assets/js/bawaan.js', `/* Dibuat otomatis oleh build.js — jangan diedit manual. */
window.KLINIK_BAWAAN = ${JSON.stringify(KONTEN.bawaan(D), null, 1)};
`);

  /* ------------------------------------------------ KONFIG RUNTIME */
  write('assets/js/config.js', `/* Dibuat otomatis oleh build.js — jangan diedit manual. */
  window.KLINIK = ${JSON.stringify(RUNTIME_CFG, null, 2)};
  `);

  /* ----------- PENANDA VERSI PADA HALAMAN ADMIN (berkas statis) */
  /* admin/index.html tidak dihasilkan generator, jadi URL asetnya
     ditempeli penanda versi di sini agar ikut lepas dari cache lama. */
  const adminPath = path.join(OUT, 'admin', 'index.html');
  if (fs.existsSync(adminPath)) {
    let ad = fs.readFileSync(adminPath, 'utf8');
    ad = ad.replace(/(src|href)="(\/assets\/[^"?]+)(\?v=[^"]*)?"/g, `$1="$2?v=${V}"`);
    fs.writeFileSync(adminPath, ad);
  }

  /* --------------------------- BERSIHKAN HALAMAN YATIM */
  /* Layanan/artikel yang dihapus lewat panel admin harus ikut hilang
     dari folder public/, kalau tidak URL lamanya masih bisa dibuka. */
  const dibuat = new Set(pages.map(p => p.replace(/\\/g, '/')));
  let dihapus = 0;
  ['layanan', 'artikel'].forEach(dir => {
    const abs = path.join(OUT, dir);
    if (!fs.existsSync(abs)) return;
    fs.readdirSync(abs).forEach(f => {
      if (!f.endsWith('.html')) return;
      const rel = dir + '/' + f;
      if (!dibuat.has(rel)) { fs.unlinkSync(path.join(abs, f)); dihapus++; console.log('  – dihapus /' + rel); }
    });
  });

  /* ------------------ DAFTAR PRECACHE SERVICE WORKER */
  /* Ditulis dari halaman yang benar-benar ada, supaya service worker
     tidak pernah mencoba menyimpan halaman yang sudah dihapus. */
  const swPath = path.join(OUT, 'sw.js');
  if (fs.existsSync(swPath)) {
    const inti = ['/', '/index.html', '/offline.html', '/404.html'];
    const halaman = pages
      .filter(p => p.endsWith('.html') && !/^(index|offline|404)\.html$/.test(p))
      .map(p => '/' + p.replace(/\\/g, '/'));
    /* Aset berkode harus dipracache dengan URL berversi yang sama
       dengan yang dipakai halaman, kalau tidak service worker menyimpan
       salinan berbeda dan halaman tetap mengunduh ulang. */
    const aset = [
      '/assets/css/style.css?v=' + V,
      '/assets/js/app.js?v=' + V, '/assets/js/config.js?v=' + V,
      '/assets/js/forms.js?v=' + V, '/assets/js/antrean.js?v=' + V,
      '/assets/js/status.js?v=' + V,
      '/assets/img/logo-klinik.png',
      '/assets/icons/icon-192.png', '/assets/icons/icon-512.png',
      '/assets/icons/maskable-512.png', '/assets/icons/favicon.svg',
      '/manifest.webmanifest'
    ];
    const daftar = inti.concat(halaman, aset);
    const blok = 'const PRECACHE = [\n' +
      daftar.map(u => "  '" + u + "'").join(',\n') + '\n];';
    let sw = fs.readFileSync(swPath, 'utf8');
    sw = sw.replace(/const PRECACHE = \[[\s\S]*?\n\];/, blok);
    // Versi cache ikut naik tiap build agar pengunjung lama dapat isi terbaru
    sw = sw.replace(/const VERSION = '[^']*';/, "const VERSION = 'klinik-" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + "';");
    fs.writeFileSync(swPath, sw);
  }

  console.log(`✓ ${pages.length} halaman dibuat` + (dihapus ? ` · ${dihapus} halaman lama dihapus` : ''));
  pages.forEach(p => console.log('  /' + p));
  console.log('✓ manifest.webmanifest, robots.txt, sitemap.xml, _headers, vercel.json, assets/js/config.js');

}
