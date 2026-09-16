/* =============================================================
 * pages.js — Body setiap halaman publik
 * ============================================================= */
const D = require('./data/site');
const { CONFIG, TEKS, AMINAH, ANTREAN, PRODUK, SERVICES, PHARMACIES, DOCTORS, APOTEKER, ADVANTAGES, STATS, ARTICLES, PARTNERS, SEO, FACILITIES, SERVICE_IMG, ARTICLE_IMG } = D;

/* Galeri fasilitas — dipakai di beranda & halaman profil */
const galeri = (judul, sub) => `<section class="sec sec-alt">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('building')} Fasilitas</span>
      <h2>${judul}</h2><p>${sub}</p>
    </div>
    <div class="gal">
      ${FACILITIES.map((f, i) => `<figure class="gal-i rv" style="transition-delay:${i * 55}ms">
        <img src="${f.img}" alt="${esc(f.title)} — ${esc(CONFIG.siteName)}" width="800" height="560" loading="lazy" decoding="async">
        <figcaption><b>${esc(f.title)}</b><span>${esc(f.text)}</span></figcaption>
      </figure>`).join('')}
    </div>
    <p style="text-align:center;margin-top:24px;font-size:13px;color:var(--muted)">Gambar di atas berupa ilustrasi. Ganti dengan foto asli klinik sebelum situs dipublikasikan.</p>
  </div>
</section>`;
const { icon, esc, waLink, waFor, waLinkTo, stars } = require('./render');

const WA_DAFTAR = waLink('Halo Admin Klinik Pratama Sehat Sejahtera 👋\nSaya ingin mendaftar berobat.\n\nNama:\nTanggal lahir:\nLayanan:\nJadwal yang diinginkan:');

/* Status buka/tutup: berkas yang sama dipakai browser (assets/js/status.js),
   jadi HTML hasil build dan perhitungan real-time tidak pernah berbeda aturan.
   Nilai di HTML hanyalah keadaan saat build — browser menimpanya seketika. */
const STATUS = require('../public/assets/js/status.js');
const STATUS_BARIS = CONFIG.statusBaris || [];
const waktuBuild = STATUS.sekarangWIB();
const klinikAwal = STATUS.hitungKlinik(STATUS_BARIS, waktuBuild);
const JENIS_KARTU = CONFIG.jenisKartu || [];


/* Seksi "Ikuti Kami" — IG & FB klinik + IG apotek */
const sosial = () => `<section class="sec">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('instagram')} Media Sosial</span>
      <h2>Ikuti kabar terbaru dari klinik &amp; apotek kami</h2>
      <p>Jadwal praktik, info libur, promo layanan, dan tips kesehatan singkat kami bagikan lebih dulu di media sosial.</p>
    </div>
    <div class="grid g3">
      <a class="soc rv ig" href="${CONFIG.social.instagram}" target="_blank" rel="noopener">
        <div class="soc-ic">${icon('instagram')}</div>
        <div class="soc-tx"><b>Instagram Klinik</b><span>${esc(CONFIG.social.instagramHandle)}</span></div>
        <p>Keseharian klinik, jadwal dokter, dan edukasi kesehatan.</p>
        <span class="soc-go">Buka Instagram ${icon('arrow-up-right')}</span>
      </a>
      <a class="soc rv fb" href="${CONFIG.social.facebook}" target="_blank" rel="noopener">
        <div class="soc-ic">${icon('facebook')}</div>
        <div class="soc-tx"><b>Facebook Klinik</b><span>${esc(CONFIG.social.facebookHandle)}</span></div>
        <p>Pengumuman resmi, info libur, dan tanya jawab warga Blitar.</p>
        <span class="soc-go">Buka Facebook ${icon('arrow-up-right')}</span>
      </a>
      <a class="soc rv ap" href="${CONFIG.social.apotekInstagram}" target="_blank" rel="noopener">
        <div class="soc-ic">${icon('pill')}</div>
        <div class="soc-tx"><b>Instagram Apotek</b><span>${esc(CONFIG.social.apotekInstagramHandle)}</span></div>
        <p>Info stok obat, promo, dan jam buka tiga cabang Mahira Farma.</p>
        <span class="soc-go">Buka Instagram ${icon('arrow-up-right')}</span>
      </a>
    </div>
  </div>
</section>`;

/* ------------------------------------------------- KOMPONEN CTA */
const ctaBlock = (opts = {}) => `<section class="sec"><div class="wrap"><div class="cta rv">
  <span class="eyebrow">${icon('sparkles')} ${opts.eyebrow || 'Siap Membantu Anda'}</span>
  <h2>${opts.title || 'Jangan tunda keluhan Anda. Daftar sekarang, datang tinggal masuk.'}</h2>
  <p>${opts.text || 'Isi formulir pendaftaran online kurang dari 2 menit. Nomor antrean Anda langsung masuk ke WhatsApp admin kami.'}</p>
  <div class="cta-act">
    <a class="btn btn-primary btn-lg" href="/pendaftaran.html">${icon('calendar')} Daftar Online Sekarang</a>
    <a class="btn btn-wa btn-lg" href="${WA_DAFTAR}" target="_blank" rel="noopener">${icon('whatsapp')} Chat Admin</a>
  </div>
</div></div></section>`;

const crumb = items => `<nav class="crumb" aria-label="Breadcrumb">${items.map((it, i) =>
  i === items.length - 1 ? `<span aria-current="page">${it.label}</span>` : `<a href="${it.href}">${it.label}</a><span>/</span>`
).join('')}</nav>`;

const phead = (eyebrowIcon, eyebrow, h1, p, breadcrumb) => `<section class="phead"><div class="wrap"><div class="phead-in">
  ${breadcrumb ? crumb(breadcrumb) : ''}
  <span class="eyebrow" style="margin-top:14px">${icon(eyebrowIcon)} ${eyebrow}</span>
  <h1>${h1}</h1><p>${p}</p>
</div></div></section>`;

/* ================================================== BERANDA === */
function home() {
  return `
<section class="hero">
  <div class="wrap hero-in">
    <div>
      <span class="eyebrow">${icon('map-pin')} Sananwetan, Kota Blitar</span>
      <h1>${TEKS.heroJudul}</h1>
      <p class="lead">${TEKS.heroSambutan}</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="/pendaftaran.html">${icon('calendar')} Daftar Online</a>
        <a class="btn btn-ghost btn-lg" href="/layanan/top-dokter.html">${icon('video')} Coba Top Dokter</a>
      </div>
      <div class="hero-trust">
        <div>${icon('clock')} Buka 06.00 pagi</div>
        <div>${icon('pill')} 3 cabang apotek</div>
        <div>${icon('shield')} Alat steril sekali pakai</div>
      </div>
    </div>
    <div class="hero-art">
      <div class="hcard">
        <div class="hcard-hd">
          <img src="/assets/img/logo-klinik.png" alt="" width="42" height="42">
          <div><b>Antrean Hari Ini</b><span>Klinik Pratama Sehat Sejahtera</span></div>
          <span class="live" data-status-live data-status="${esc(klinikAwal.status)}" title="${esc(klinikAwal.ket)}"><i class="dot"></i> <span data-status-badge>${esc(klinikAwal.badge)}</span></span>
        </div>
        ${STATUS_BARIS.map(b => {
          const s = STATUS.hitung(b, waktuBuild);
          return `<div class="hrow" data-status-baris="${esc(b.key)}" data-status="${esc(s.status)}"><div class="hrow-ic ${esc(b.kelas)}">${icon(b.icon)}</div><div><b>${esc(b.nama)}</b><span data-status-ket>${esc(s.ket)}</span></div><em data-status-badge>${esc(s.badge)}</em></div>`;
        }).join('\n        ')}
        <div class="hcard-ft">
          <div>${icon('check-circle')}<div><b>&lt; 2 menit</b><span>Proses pendaftaran</span></div></div>
          <div>${icon('whatsapp')}<div><b>WhatsApp</b><span>Antrean langsung masuk</span></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="qbar"><div class="wrap"><div class="qbar-in rv">
  <a href="/pendaftaran.html"><span class="qi">${icon('calendar')}</span><div><b>Daftar Berobat</b><span>Ambil nomor antrean</span></div></a>
  <a href="/layanan/top-dokter.html"><span class="qi">${icon('video')}</span><div><b>Top Dokter</b><span>Konsultasi online</span></div></a>
  <a href="/apotek.html"><span class="qi">${icon('pill')}</span><div><b>Tebus Obat</b><span>3 cabang apotek</span></div></a>
  <a href="/dokter.html"><span class="qi">${icon('clock')}</span><div><b>Jadwal Dokter</b><span>Pagi &amp; malam</span></div></a>
</div></div></section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('stethoscope')} Layanan Unggulan</span>
      <h2>Lima layanan, satu atap, tanpa bolak-balik</h2>
      <p>Dari pemeriksaan sampai obat di tangan — semua diselesaikan di tempat yang sama, oleh tim yang sama.</p>
    </div>
    <div class="grid g3">
      ${SERVICES.map((s, i) => `<a class="svc rv ${s.slug === 'top-dokter' ? 'feat' : ''}" href="/layanan/${s.slug}.html" style="transition-delay:${i * 60}ms">
        <div class="svc-ic">${icon(s.icon)}</div>
        <p class="hook">${esc(s.hook)}</p>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.short)}</p>
        <span class="more">Lihat detail ${icon('arrow-right')}</span>
      </a>`).join('')}
      <div class="svc rv" style="background:linear-gradient(150deg,var(--g-50),var(--b-50));border-color:var(--g-200)">
        <div class="svc-ic" style="background:var(--surface)">${icon('route')}</div>
        <p class="hook">Belum yakin harus ke poli mana?</p>
        <h3>Tanya dulu, gratis</h3>
        <p>Ceritakan keluhan Anda ke admin kami lewat WhatsApp. Kami bantu arahkan ke layanan yang tepat.</p>
        <a class="btn btn-wa" style="margin-top:auto" href="${waLink('Halo Admin, saya ingin bertanya keluhan saya sebaiknya ke poli mana?')}" target="_blank" rel="noopener">${icon('whatsapp')} Tanya Admin</a>
      </div>
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="split">
      <div class="rv">
        <span class="eyebrow">${icon('heart')} Kenapa Memilih Kami</span>
        <h2 style="font-size:clamp(28px,4vw,40px);margin:18px 0 16px">Klinik yang menyesuaikan jadwal Anda, bukan sebaliknya</h2>
        <p class="lead">Kami tahu tidak semua orang bisa izin kerja untuk berobat. Karena itu kami buka sebelum jam kerja dimulai dan kembali buka setelah Anda pulang.</p>
        <ul class="checks">
          ${ADVANTAGES.slice(0, 4).map(a => `<li>${icon('check-circle')}<div><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div></li>`).join('')}
        </ul>
        <a class="btn btn-dark" style="margin-top:28px" href="/profil.html">${icon('building')} Kenali Klinik Kami</a>
      </div>
      <div class="rv">
        <figure class="photo">
          <img src="/assets/img/fasilitas/hero-klinik.svg" alt="Ilustrasi gedung Klinik Pratama Sehat Sejahtera di Sananwetan, Kota Blitar" width="800" height="560" loading="lazy" decoding="async">
          <figcaption><b>Melayani Blitar Raya</b><span>Perum Puri Kenari Asri, Karangtengah, Sananwetan — didukung tiga cabang Apotek Mahira Farma.</span></figcaption>
        </figure>
      </div>
    </div>
    <div class="stats rv" style="margin-top:56px">
      ${STATS.map(s => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv">
      <span class="eyebrow">${icon('pill')} Apotek Terintegrasi</span>
      <h2>Tiga cabang Mahira Farma, satu sistem stok</h2>
      <p>Resep dari klinik langsung diteruskan ke apotek. Bila obat kosong di satu cabang, kami cek otomatis ke cabang lain sebelum Anda berangkat.</p>
    </div>
    <div class="grid g3">
      ${PHARMACIES.map((p, i) => `<article class="pharm rv" id="${p.slug}" style="transition-delay:${i * 70}ms">
        <div class="pharm-top">
          <span class="tag">${esc(p.badge)}</span>
          <h3>${esc(p.name)}</h3>
          <p class="area">${icon('map-pin')} ${esc(p.area)}</p>
        </div>
        <div class="pharm-body">
          <li>${icon('map-pin')}<span>${esc(p.address)}</span></li>
          <li>${icon('clock')}<span>${esc(p.hours)}</span></li>
          <li>${icon('check-circle')}<span>${esc(p.note)}</span></li>
          <div class="pharm-act">
            ${p.maps ? `<a class="btn btn-ghost" href="${esc(p.maps)}" target="_blank" rel="noopener">${icon('map-pin')} Peta</a>` : ''}
            <a class="btn btn-wa" href="${waLink('Halo Apotek ' + p.name + ' (' + p.area + '), saya ingin menanyakan ketersediaan obat.')}" target="_blank" rel="noopener">${icon('whatsapp')} Tanya Stok</a>
          </div>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="split rev">
      <div class="rv">
        <div class="fcard" style="box-shadow:var(--sh-3)">
          <span class="eyebrow">${icon('video')} Top Dokter</span>
          <h3 style="font-size:23px;margin:16px 0 20px">Tiga langkah, obat sampai di rumah</h3>
          <div class="steps">
            <div class="step"><span class="n">1</span><div><b>Kirim keluhan</b><p>Chat admin Top Dokter, ceritakan keluhan dan kirim foto bila perlu.</p></div></div>
            <div class="step"><span class="n">2</span><div><b>Dokter merespons</b><p>Dokter menjawab lewat chat atau video call sesuai jadwal praktik, lalu menerbitkan resep elektronik.</p></div></div>
            <div class="step"><span class="n">3</span><div><b>Obat disiapkan</b><p>Pilih cabang Mahira Farma. Ambil sendiri atau minta diantar ke rumah untuk area Kota Blitar.</p></div></div>
          </div>
          <a class="btn btn-primary block" style="margin-top:26px" href="/layanan/top-dokter.html">${icon('arrow-right')} Pelajari Top Dokter</a>
        </div>
      </div>
      <div class="rv">
        <span class="eyebrow">${icon('sparkles')} Layanan Digital</span>
        <h2 style="font-size:clamp(28px,4vw,40px);margin:18px 0 16px">Tidak semua keluhan perlu perjalanan ke klinik</h2>
        <p class="lead">Kontrol rutin, konsultasi hasil lab, atau menanyakan efek samping obat — semuanya bisa diselesaikan lewat Top Dokter tanpa Anda meninggalkan rumah atau kantor.</p>
        <ul class="checks">
          <li>${icon('check-circle')}<div><b>Hemat waktu dan ongkos</b><span>Tidak perlu izin kerja atau menunggu di ruang tunggu.</span></div></li>
          <li>${icon('check-circle')}<div><b>Resep elektronik sah</b><span>Diterbitkan dokter berizin, langsung diteruskan ke apotek pilihan Anda.</span></div></li>
          <li>${icon('check-circle')}<div><b>Riwayat tersimpan rapi</b><span>Setiap konsultasi tercatat, memudahkan kontrol berikutnya.</span></div></li>
        </ul>
      </div>
    </div>
  </div>
</section>

${galeri('Ruangan yang membuat Anda tenang sebelum diperiksa', 'Bersih, terang, dan tertata — karena kenyamanan adalah bagian dari perawatan.')}

<section class="sec">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('users')} Tim Medis</span>
      <h2>Ditangani orang yang tepat, bukan sekadar cepat</h2>
      <p>Setiap pasien dilayani dokter dan apoteker berizin dengan waktu konsultasi yang cukup.</p>
    </div>
    <div class="grid g4">
      ${DOCTORS.map((d, i) => `<article class="doc rv" style="transition-delay:${i * 60}ms">
        <div class="doc-av ${d.color}">${esc(d.initials)}</div>
        <h3>${esc(d.name)}</h3>
        <p class="role">${esc(d.role)}</p>
        <p class="sched">${icon('clock')} ${esc(d.schedule)}</p>
      </article>`).join('')}
    </div>
    <div style="text-align:center;margin-top:36px"><a class="btn btn-ghost" href="/dokter.html">${icon('calendar')} Lihat Jadwal Lengkap</a></div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv" style="display:flex;justify-content:space-between;align-items:flex-end;max-width:none;gap:24px;flex-wrap:wrap">
      <div style="max-width:620px">
        <span class="eyebrow">${icon('file')} Artikel Kesehatan</span>
        <h2 style="font-size:clamp(28px,4vw,40px);margin:18px 0 12px">Informasi yang bisa Anda pakai hari ini juga</h2>
        <p>Ditulis dengan bahasa sehari-hari oleh tim medis kami.</p>
      </div>
      <a class="btn btn-ghost" href="/artikel.html">Semua Artikel ${icon('arrow-right')}</a>
    </div>
    <div class="grid g3">${ARTICLES.map((a, i) => artCard(a, i)).join('')}</div>
  </div>
</section>

${sosial()}

<section class="sec sec-alt">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('shield')} Kredibilitas</span>
      <h2>Mitra &amp; kepatuhan</h2>
      <p>Kami sedang menyiapkan integrasi resmi dengan ekosistem kesehatan nasional agar layanan Anda makin terhubung.</p>
    </div>
    <div class="partners rv">
      ${PARTNERS.map(p => `<div class="partner"><span class="pi">${icon(p.ic || 'shield')}</span><div><b>${esc(p.name)}</b><span>${esc(p.note)}</span></div></div>`).join('')}
    </div>
    <p style="text-align:center;margin-top:22px;font-size:13.5px;color:var(--muted)">Status kerja sama diperbarui berkala. Logo mitra ditampilkan setelah perjanjian resmi berlaku.</p>
  </div>
</section>

${ctaBlock()}`;
}

const artCard = (a, i = 0) => `<a class="art rv" href="/artikel/${a.slug}.html" style="transition-delay:${i * 60}ms">
  <div class="art-cover"><img src="${ARTICLE_IMG[a.category] || '/assets/img/fasilitas/ruang-tunggu.svg'}" alt="" width="800" height="560" loading="lazy" decoding="async"></div>
  <div class="art-body">
    <div class="art-meta"><span class="cat">${esc(a.category)}</span><span>${fmtDate(a.date)}</span><span>· ${esc(a.read)}</span></div>
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.excerpt)}</p>
    <span class="more">Baca selengkapnya ${icon('arrow-right')}</span>
  </div>
</a>`;

function fmtDate(d) {
  const b = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dt = new Date(d); return `${dt.getDate()} ${b[dt.getMonth()]} ${dt.getFullYear()}`;
}


/* -------------------------------- JAM OPERASIONAL (3 SESI) */
const blokJam = () => `<div class="jam-grid rv">
  ${CONFIG.jadwalHarian.map(j => `<div class="jam-i${j.buka ? '' : ' tutup'}">
    <span class="jam-s">${esc(j.sesi)}</span>
    <b>${esc(j.jam)}</b>
    <span class="jam-t">${esc(j.isi)}</span>
    <p>${esc(j.ket)}</p>
  </div>`).join('')}
</div>
<p class="jam-note">${icon('alert')} Minggu dan tanggal merah klinik tutup. Pertanyaan tetap dijawab lewat WhatsApp pada jam kerja berikutnya.</p>`;

/* =================================================== PROFIL === */
function profil() {
  return `
${phead('building', 'Profil Klinik', TEKS.profilJudul,
  TEKS.profilRingkas,
  [{ label: 'Beranda', href: '/' }, { label: 'Profil' }])}

<section class="sec">
  <div class="wrap">
    <div class="split">
      <div class="rv prose" style="max-width:none">
        <span class="eyebrow">${icon('heart')} Tentang Kami</span>
        <h2 style="margin-top:18px">Berawal dari praktik dokter, tumbuh jadi ekosistem layanan</h2>
        <p>Klinik Pratama Sehat Sejahtera berlokasi di Perum Puri Kenari Asri Blok E4, Karangtengah, Kecamatan Sananwetan, Kota Blitar. Kami melayani kebutuhan kesehatan dasar warga Blitar Raya — dari keluhan harian, perawatan gigi, khitan, hingga penyediaan obat lewat tiga cabang Apotek Mahira Farma.</p>
        <p>Jam praktik kami dirancang mengikuti ritme hidup warga: buka pukul <strong>06.00</strong> sebelum orang berangkat kerja atau sekolah, lalu kembali buka pukul <strong>17.00 sampai 20.30</strong>. Kami percaya kesehatan tidak boleh kalah oleh jam kerja.</p>
        <div class="note">
          <p><strong>Prinsip kami:</strong> satu pasien, satu perhatian penuh. Kami memilih memperpanjang jam buka ketimbang mempercepat waktu konsultasi.</p>
        </div>
      </div>
      <div class="rv">
        <div class="aside-card">
          <h3>${icon('map-pin')} Data Praktik</h3>
          <ul style="display:grid;gap:16px">
            <li><b style="font-family:var(--ff-h);color:var(--ink);font-size:14px;display:block">Nama Fasilitas</b><span style="font-size:14.5px">${esc(CONFIG.siteName)}</span></li>
            <li><b style="font-family:var(--ff-h);color:var(--ink);font-size:14px;display:block">Jenis</b><span style="font-size:14.5px">Klinik Pratama (rawat jalan)</span></li>
            <li><b style="font-family:var(--ff-h);color:var(--ink);font-size:14px;display:block">Alamat</b><span style="font-size:14.5px">${esc(CONFIG.address.street)}, ${esc(CONFIG.address.district)}, ${esc(CONFIG.address.city)}, ${esc(CONFIG.address.region)}</span></li>
            <li><b style="font-family:var(--ff-h);color:var(--ink);font-size:14px;display:block">Kontak</b><span style="font-size:14.5px">${esc(CONFIG.waDisplay)} (WhatsApp &amp; telepon)</span></li>
            <li><b style="font-family:var(--ff-h);color:var(--ink);font-size:14px;display:block">Apotek Rekanan</b><span style="font-size:14.5px">Mahira Farma 1, 2, dan 4</span></li>
          </ul>
        </div>
        <div class="aside-card">
          <h3>${icon('clock')} Jam Praktik</h3>
          ${CONFIG.hours.map(h => `<div style="display:flex;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid var(--line-2);font-size:14.5px">
            <b style="font-family:var(--ff-h);color:var(--ink)">${esc(h.day)}</b><span style="text-align:right">${esc(h.pagi)}<br>${esc(h.sore)}</span></div>`).join('')}
          <a class="btn btn-primary block" style="margin-top:18px" href="/pendaftaran.html">${icon('calendar')} Daftar Sekarang</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('sparkles')} Keunggulan</span>
      <h2>Enam alasan warga Blitar memilih kami</h2>
    </div>
    <div class="grid g3">
      ${ADVANTAGES.map((a, i) => `<article class="card rv" style="transition-delay:${i * 60}ms">
        <div class="card-ic">${icon(a.icon)}</div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('clock')} Jam Operasional</span>
      <h2>Kapan klinik melayani Anda</h2>
      <p>Tiga sesi setiap hari kerja. Perhatikan jeda siang — pada jam itu kami tidak melayani praktek.</p>
    </div>
    ${blokJam()}
  </div>
</section>

${galeri('Lihat fasilitas kami lebih dekat', 'Enam ruang layanan yang kami rawat kebersihannya setiap hari.')}

<section class="sec">
  <div class="wrap">
    <div class="split">
      <div class="rv">
        <span class="eyebrow">${icon('heart')} Cara Kami Melayani</span>
        <h2 style="font-size:clamp(28px,4vw,38px);margin:18px 0 16px">Ramah, cepat, dan mujarab — dalam praktik sehari-hari</h2>
        <p class="lead">Janji itu tidak berhenti di spanduk. Berikut wujudnya pada hal-hal kecil yang Anda rasakan sejak masuk pintu.</p>
        <ul class="checks">
          <li>${icon('check-circle')}<div><b>Ramah</b><span>Petugas menyapa dengan nama, menjelaskan alur, dan tidak membiarkan Anda menebak-nebak harus ke mana. Pengantar keluarga tetap boleh mendampingi.</span></div></li>
          <li>${icon('check-circle')}<div><b>Cepat</b><span>Buka sejak pukul 06.00, pendaftaran online kurang dari dua menit, dan nomor antrean bisa dipantau dari rumah lewat halaman antrean.</span></div></li>
          <li>${icon('check-circle')}<div><b>Mujarab</b><span>Dokter menyediakan waktu konsultasi yang cukup, apoteker menjelaskan aturan minum obat sampai paham, dan Anda dirujuk bila kondisinya memang memerlukan fasilitas lebih lengkap.</span></div></li>
        </ul>
      </div>
      <div class="rv">
        <div class="aside-card">
          <h3>${icon('lock')} Komitmen Data Pasien</h3>
          <p style="font-size:15px;margin-bottom:16px">Data yang Anda kirim lewat formulir pendaftaran hanya digunakan untuk keperluan pelayanan klinik.</p>
          <ul class="checks">
            <li>${icon('check')}<div><span>Tidak dijual atau dibagikan ke pihak ketiga untuk tujuan pemasaran.</span></div></li>
            <li>${icon('check')}<div><span>Hanya admin dan tenaga medis berwenang yang dapat mengaksesnya.</span></div></li>
            <li>${icon('check')}<div><span>Data internal klinik tidak otomatis tampil pada aplikasi eksternal manapun.</span></div></li>
          </ul>
          <a class="btn btn-ghost block" style="margin-top:20px" href="/kebijakan-privasi.html">${icon('file')} Baca Kebijakan Privasi</a>
        </div>
      </div>
    </div>
  </div>
</section>

${sosial()}

${ctaBlock({ eyebrow: 'Mari Berkenalan', title: 'Datang, rasakan sendiri bedanya.', text: 'Kami buka Senin sampai Sabtu, pagi dan malam. Daftar online agar Anda tidak perlu menunggu lama.' })}`;
}

/* ================================================== LAYANAN === */
function layananIndex() {
  return `
${phead('stethoscope', 'Layanan', 'Lima layanan unggulan yang saling terhubung', 'Setiap layanan dirancang agar Anda tidak perlu berpindah tempat. Periksa, tindakan, dan obat selesai dalam satu kunjungan.', [{ label: 'Beranda', href: '/' }, { label: 'Layanan' }])}

<section class="sec">
  <div class="wrap">
    <div class="grid g3">
      ${SERVICES.map((s, i) => `<a class="svc rv ${s.slug === 'top-dokter' ? 'feat' : ''}" href="/layanan/${s.slug}.html" style="transition-delay:${i * 60}ms">
        <div class="svc-ic">${icon(s.icon)}</div>
        <p class="hook">${esc(s.hook)}</p>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.short)}</p>
        <span class="more">Lihat detail ${icon('arrow-right')}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('route')} Alur Pelayanan</span>
      <h2>Dari daftar sampai pulang membawa obat</h2>
    </div>
    <div class="grid g4">
      ${[
        ['Daftar online', 'Isi formulir di situs ini atau kirim data lewat WhatsApp. Kurang dari 2 menit.'],
        ['Konfirmasi antrean', 'Admin membalas dengan nomor antrean dan perkiraan jam dilayani.'],
        ['Pemeriksaan', 'Datang sesuai jadwal. Anda diperiksa dokter tanpa terburu-buru.'],
        ['Penebusan obat', 'Resep langsung diteruskan ke Depo Farmasi klinik. Bila obatnya sedang kosong, Anda diarahkan ke apotek terdekat atau cabang Apotek Mahira Farma.']
      ].map((s, i) => `<article class="card rv" style="transition-delay:${i * 60}ms">
        <div class="card-ic" style="font-family:var(--ff-h);font-weight:800;font-size:20px">${i + 1}</div>
        <h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}
    </div>
  </div>
</section>
${ctaBlock()}`;
}


/* ---------------------------------------- BLOK MITRA RSU AMINAH */
const blokAminah = () => `<div class="mitra rv">
  <div class="mitra-h">
    <span class="pi">${icon('building')}</span>
    <div><b>${esc(AMINAH.nama)}</b><span>${esc(AMINAH.status)}</span></div>
  </div>
  ${AMINAH.catatanPlaceholder ? `<div class="mitra-draft">${icon('alert')} Angka potongan & cashback di bawah masih contoh — ganti sebelum dipakai promosi</div>` : ''}
  <p>${esc(AMINAH.ringkas)}</p>
  <div class="mitra-grid">
    ${AMINAH.manfaat.map(m => `<div class="mitra-i"><b>${esc(m.title)}</b><span>${esc(m.text)}</span></div>`).join('')}
  </div>
  <ul class="mitra-s">${AMINAH.syarat.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
</div>`;


/* ------------------------------------- BLOK PRODUK MADU & HERBAL */
const blokProduk = () => `<div class="mitra rv" style="background:linear-gradient(145deg,var(--g-50),var(--surface));border-color:var(--g-200)">
  <div class="mitra-h">
    <span class="pi" style="background:var(--g-600)">${icon('sparkles')}</span>
    <div><b>${esc(PRODUK.judul)}</b><span style="color:var(--g-700)">Bisa dibeli tanpa resep</span></div>
  </div>
  <p>${esc(PRODUK.ringkas)}</p>
  <div class="mitra-grid">
    ${PRODUK.daftar.map(m => `<div class="mitra-i"><b>${esc(m.nama)}</b><span>${esc(m.ket)}</span></div>`).join('')}
  </div>
  <ul class="mitra-s"><li>${esc(PRODUK.catatan)}</li></ul>
</div>`;


/* ------------------------------- FORMULIR KHUSUS TOP DOKTER */
/* Diminta klinik: tanpa perkiraan biaya, langsung ke WhatsApp admin. */
const formTopDokter = () => {
  const wa = waFor('Top Dokter');
  return `<section class="sec sec-alt" id="form">
  <div class="wrap">
    <div class="fwrap">
      <div class="fcard rv">
        <div class="fstatus" id="td-status"></div>
        <form id="form-topdokter" novalidate>
          <span class="eyebrow">${icon('video')} Konsultasi Online</span>
          <h2 style="font-size:24px;margin:14px 0 6px">Isi data pasien, lalu kirim ke admin</h2>
          <p style="font-size:14.5px;margin-bottom:24px">Data ini membantu dokter menilai keluhan Anda sebelum menjawab. Setelah dikirim, WhatsApp <strong>${esc(wa.label)}</strong> (${esc(wa.display)}) akan terbuka berisi ringkasannya — cukup tekan kirim.</p>

          <div class="fgrid">
            <div class="field"><label for="td-jenisKartu">Jenis kartu pasien <span class="req">*</span></label>
              <select id="td-jenisKartu" name="jenisKartu" required>
                <option value="BPJS">BPJS Kesehatan</option>
                <option value="Umum">Umum (KTP/NIK)</option>
              </select>
              <div class="hint">Pilih BPJS bila Anda peserta terdaftar.</div></div>

            <div class="field"><label for="td-noKartu">Nomor kartu pasien <span class="req">*</span></label>
              <input id="td-noKartu" name="noKartu" inputmode="numeric" required maxlength="20" placeholder="13 digit nomor kartu BPJS">
              <div class="err">Masukkan nomor kartu yang benar.</div></div>

            <div class="field full"><label for="td-nama">Nama pasien <span class="req">*</span></label>
              <input id="td-nama" name="nama" required autocomplete="name" placeholder="Sesuai identitas / kartu">
              <div class="err">Nama pasien wajib diisi.</div></div>

            <div class="field"><label for="td-umur">Umur <span class="req">*</span></label>
              <input id="td-umur" name="umur" required placeholder="Contoh: 34 tahun / 8 bulan">
              <div class="err">Umur wajib diisi.</div></div>

            <div class="field"><label for="td-berat">Berat badan (kg) <span class="req">*</span></label>
              <input id="td-berat" name="berat" type="number" inputmode="decimal" min="1" max="300" step="0.1" required placeholder="Contoh: 58">
              <div class="hint">Dipakai dokter untuk menghitung dosis, terutama pada anak.</div>
              <div class="err">Isi berat badan antara 1–300 kg.</div></div>

            <div class="field"><label for="td-hp">Nomor WhatsApp aktif <span class="req">*</span></label>
              <input id="td-hp" name="hp" type="tel" inputmode="tel" required autocomplete="tel" placeholder="08xxxxxxxxxx">
              <div class="err">Masukkan nomor WhatsApp yang benar.</div></div>

            <div class="field"><label for="td-obat">Bentuk obat yang diinginkan <span class="req">*</span></label>
              <select id="td-obat" name="jenisObat" required>
                <option value="">Pilih bentuk obat</option>
                <option>Puyer</option>
                <option>Tablet</option>
                <option>Sirup</option>
              </select>
              <div class="hint">Puyer dan sirup biasanya dipilih untuk anak.</div>
              <div class="err">Pilih bentuk obat.</div></div>

            <div class="field full"><label for="td-alamat">Alamat <span class="req">*</span></label>
              <input id="td-alamat" name="alamat" required placeholder="Contoh: Jl. Melati 12, Karangtengah, Sananwetan">
              <div class="err">Alamat wajib diisi.</div></div>

            <div class="field full"><label for="td-keluhan">Keluhan <span class="req">*</span></label>
              <textarea id="td-keluhan" name="keluhan" rows="4" required placeholder="Ceritakan detail penyakit yang dialami: sejak kapan, bagian mana, sudah minum obat apa, dan keluhan penyerta lainnya."></textarea>
              <div class="hint">Semakin rinci, semakin tepat dokter menilai kondisi Anda.</div>
              <div class="err">Keluhan wajib diisi.</div></div>

            <div class="field full">
              <label class="chip" style="display:block"><input type="checkbox" name="setuju" value="ya" required>
                <span>${icon('check')} Saya memahami bahwa konsultasi online tidak menggantikan pemeriksaan langsung, dan akan datang ke klinik bila diminta dokter.</span></label>
              <div class="err">Mohon centang persetujuan di atas.</div></div>
          </div>

          <button class="btn btn-primary btn-lg block" style="margin-top:22px" type="submit" id="btn-topdokter">
            ${icon('whatsapp')} Kirim ke ${esc(wa.label)}
          </button>
          <p style="font-size:12.5px;color:var(--muted);margin-top:14px;text-align:center">
            Jam layanan mengikuti jam praktik klinik. Pesan di luar jam tersebut dijawab pada sesi berikutnya.
          </p>
        </form>
      </div>

      <aside class="rv">
        <div class="aside-card">
          <h3>${icon('alert')} Bukan untuk keadaan darurat</h3>
          <p style="font-size:14.5px">Nyeri dada hebat, sesak berat, kejang, perdarahan tidak berhenti, atau penurunan kesadaran harus ditangani langsung. Datangi klinik atau IGD terdekat, atau hubungi <strong>119</strong>.</p>
        </div>
        <div class="aside-card">
          <h3>${icon('check-circle')} Cocok untuk keluhan seperti ini</h3>
          <ul class="checks">
            <li>${icon('check')}<div><span>Batuk, pilek, demam ringan, dan keluhan harian lainnya.</span></div></li>
            <li>${icon('check')}<div><span>Kontrol rutin hipertensi, diabetes, atau kolesterol.</span></div></li>
            <li>${icon('check')}<div><span>Menanyakan hasil pemeriksaan dan aturan minum obat.</span></div></li>
            <li>${icon('check')}<div><span>Keluhan anak yang belum memerlukan pemeriksaan langsung.</span></div></li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</section>`;
};

function serviceDetail(s) {
  const others = SERVICES.filter(x => x.slug !== s.slug).slice(0, 3);
  const mitraRS = (s.slug === 'umrah-haji');
  return `
${phead(s.icon, s.name, esc(s.hero), esc(s.intro), [{ label: 'Beranda', href: '/' }, { label: 'Layanan', href: '/layanan.html' }, { label: s.name }])}

<section class="sec-sm">
  <div class="wrap">
    <div class="qbar-in rv" style="grid-template-columns:repeat(3,1fr)">
      ${s.tanpaDaftar
        ? `<a href="/kontak.html"><span class="qi">${icon('check-circle')}</span><div><b>Tanpa Pendaftaran</b><span>Langsung datang saja</span></div></a>`
        : `<a href="/pendaftaran.html?layanan=${encodeURIComponent(s.name)}"><span class="qi">${icon('calendar')}</span><div><b>Daftar Layanan Ini</b><span>Ambil jadwal sekarang</span></div></a>`}
      ${s.tanpaBiaya
        ? `<a href="#faq"><span class="qi">${icon('whatsapp')}</span><div><b>Lewat WhatsApp</b><span>Admin memandu Anda</span></div></a>`
        : `<a href="#biaya"><span class="qi">${icon('file')}</span><div><b>${esc(s.price.split('·')[0].trim())}</b><span>Perkiraan biaya</span></div></a>`}
      <a href="#faq"><span class="qi">${icon('clock')}</span><div><b>${esc(s.duration)}</b><span>Perkiraan durasi</span></div></a>
    </div>
  </div>
</section>

<section class="sec-sm" style="padding-top:12px">
  <div class="wrap"><figure class="photo wide rv">
    <img src="${SERVICE_IMG[s.slug] || '/assets/img/fasilitas/ruang-periksa.svg'}" alt="Ilustrasi layanan ${esc(s.name)} di Klinik Pratama Sehat Sejahtera Blitar" width="800" height="560" loading="lazy" decoding="async">
  </figure></div>
</section>

<section class="sec" style="padding-top:20px">
  <div class="wrap">
    <div class="split" style="align-items:start">
      <div class="rv">
        <span class="eyebrow">${icon('check-circle')} Cakupan Layanan</span>
        <h2 style="font-size:clamp(26px,3.6vw,36px);margin:18px 0 26px">Apa saja yang kami tangani</h2>
        <div class="grid" style="gap:16px">
          ${s.items.map(it => `<div class="card" style="padding:20px 22px">
            <h3 style="font-size:16.5px;display:flex;gap:11px;align-items:center">${icon('check-circle')} ${it[0]}</h3>
            <p style="font-size:14.5px;margin-top:7px;padding-left:31px">${it[1]}</p></div>`).join('')}
        </div>
      </div>
      <div class="rv">
        <div class="aside-card" id="biaya">
          <h3>${icon('file')} ${s.tanpaBiaya ? 'Cara Mengakses' : 'Biaya &amp; Durasi'}</h3>
          ${s.tanpaBiaya ? '' : `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line-2);font-size:14.5px"><b style="font-family:var(--ff-h);color:var(--ink)">Perkiraan biaya</b><span style="text-align:right">${esc(s.price)}</span></div>`}
          <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:14.5px"><b style="font-family:var(--ff-h);color:var(--ink)">Durasi layanan</b><span>${esc(s.duration)}</span></div>
          ${s.tanpaBiaya
            ? `<p style="font-size:13px;color:var(--body);margin-top:10px">Biaya konsultasi dan obat diinformasikan admin langsung di percakapan WhatsApp, menyesuaikan keluhan dan resep dokter.</p>`
            : `<p style="font-size:12.5px;color:var(--muted);margin-top:10px">*Biaya final dapat berbeda tergantung tindakan dan obat yang diperlukan. Petugas kami selalu menginformasikan estimasi sebelum tindakan.</p>`}
          ${s.tanpaDaftar
            ? `<p style="font-size:13px;color:var(--body);margin-top:10px"><strong>Tidak perlu mendaftar.</strong> Datang langsung ke Depo Farmasi pada jam pelayanan, petugas kami siap membantu.</p>`
            : `<a class="btn btn-primary block" style="margin-top:18px" href="${s.slug === 'top-dokter' ? '/layanan/top-dokter.html#form' : '/pendaftaran.html?layanan=' + encodeURIComponent(s.name)}">${icon('calendar')} ${s.slug === 'top-dokter' ? 'Isi Formulir Top Dokter' : 'Daftar ' + esc(s.name)}</a>`}
          <a class="btn btn-wa block" style="margin-top:10px" href="${waLinkTo(s.name, 'Halo ' + waFor(s.name).label + ', saya ingin bertanya tentang layanan ' + s.name + '.')}" target="_blank" rel="noopener">${icon('whatsapp')} Tanya ${esc(waFor(s.name).label)}</a>
          ${CONFIG.waByService[s.name] ? `<p style="font-size:12.5px;color:var(--muted);margin-top:10px;text-align:center">Nomor khusus ${esc(s.name)}: <strong style="color:var(--ink)">${esc(waFor(s.name).display)}</strong></p>` : ''}
        </div>
        <div class="aside-card">
          <h3>${icon('alert')} Persiapan Sebelum Datang</h3>
          <ul class="checks">${s.prep.map(p => `<li>${icon('check')}<div><span>${esc(p)}</span></div></li>`).join('')}</ul>
        </div>
      </div>
    </div>
    ${mitraRS ? blokAminah() : ''}
    ${s.slug === 'farmasi' ? blokProduk() : ''}
  </div>
</section>

${s.slug === 'top-dokter' ? formTopDokter() : ''}

<section class="sec sec-alt" id="faq">
  <div class="wrap">
    <div class="sec-head center rv">
      <span class="eyebrow">${icon('quote')} Pertanyaan Umum</span>
      <h2>Yang paling sering ditanyakan tentang ${esc(s.name)}</h2>
    </div>
    <div style="max-width:780px;margin-inline:auto" class="rv">
      ${s.faq.map((f, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f[0])}</summary><div class="fa">${esc(f[1])}</div></details>`).join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head center rv"><span class="eyebrow">${icon('route')} Layanan Lain</span><h2>Mungkin Anda juga membutuhkan</h2></div>
    <div class="grid g3">
      ${others.map(o => `<a class="svc rv" href="/layanan/${o.slug}.html">
        <div class="svc-ic">${icon(o.icon)}</div><h3>${esc(o.name)}</h3><p>${esc(o.short)}</p>
        <span class="more">Lihat detail ${icon('arrow-right')}</span></a>`).join('')}
    </div>
  </div>
</section>
<section class="sec"><div class="wrap"><div class="cta rv">
  <span class="eyebrow">${icon('sparkles')} Siap Membantu Anda</span>
  <h2>Siap menjadwalkan ${esc(s.name)}?</h2>
  <p>${CONFIG.waByService[s.name]
    ? `Layanan ini punya admin khusus di <strong style="color:#fff">${esc(waFor(s.name).display)}</strong> agar penjadwalan Anda ditangani lebih cepat.`
    : 'Daftar online sekarang dan pilih jam yang paling pas untuk Anda.'}</p>
  <div class="cta-act">
    <a class="btn btn-primary btn-lg" href="/pendaftaran.html?layanan=${encodeURIComponent(s.name)}">${icon('calendar')} Daftar ${esc(s.name)}</a>
    <a class="btn btn-wa btn-lg" href="${waLinkTo(s.name, 'Halo ' + waFor(s.name).label + ', saya ingin menjadwalkan ' + s.name + '.\n\nNama:\nUsia:\nTanggal yang diinginkan:')}" target="_blank" rel="noopener">${icon('whatsapp')} Chat ${esc(waFor(s.name).label)}</a>
  </div>
</div></div></section>`;
}

/* =================================================== DOKTER === */
function dokter() {
  const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  /* Cocokkan label hari bebas ("Senin – Kamis", "Jumat & Sabtu") ke daftar hari */
  const cocok = (label, hari) => {
    const t = label.toLowerCase(), h = hari.toLowerCase();
    if (t.includes('–') || t.includes('-')) {
      const [a, b] = t.split(/[–-]/).map(x => x.trim());
      const ia = HARI.findIndex(x => x.toLowerCase() === a), ib = HARI.findIndex(x => x.toLowerCase() === b);
      const ih = HARI.findIndex(x => x.toLowerCase() === h);
      return ia >= 0 && ib >= 0 && ih >= ia && ih <= ib;
    }
    return t.split(/[,&]/).map(x => x.trim()).includes(h);
  };
  const praktik = (hari, sesi) => DOCTORS.filter(d =>
    d.jadwal.some(j => j.sesi === sesi && cocok(j.hari, hari)));

  const kartu = (d, i, janji) => `<article class="doc rv" style="transition-delay:${i * 60}ms">
    <div class="doc-av ${d.color}">${esc(d.initials)}</div>
    <h3>${esc(d.name)}</h3><p class="role">${esc(d.role)}</p>
    <p class="sched">${icon('clock')} ${esc(d.schedule || d.ket || '')}</p>
    ${janji
      ? `<a class="btn btn-ghost block" style="margin-top:16px" href="/pendaftaran.html?layanan=${encodeURIComponent(d.poli)}">${icon('calendar')} Buat Janji</a>`
      : ''}
  </article>`;

  return `
${phead('users', 'Tim Medis', 'Dokter dan apoteker yang melayani Anda', 'Jadwal praktik di bawah ini diperbarui mengikuti data klinik. Untuk memastikan ketersediaan dokter pada hari tertentu, silakan daftar online lebih dulu.', [{ label: 'Beranda', href: '/' }, { label: 'Dokter' }])}

<section class="sec">
  <div class="wrap">

    <div class="sec-head rv" style="max-width:none;margin-bottom:26px">
      <span class="eyebrow">${icon('stethoscope')} Poliklinik Umum</span>
      <h2 style="font-size:clamp(24px,3.2vw,32px);margin:14px 0 0">Dokter umum yang bertugas</h2>
    </div>
    <div class="grid g3">
      ${DOCTORS.filter(d => d.poli === 'Poli Umum').map((d, i) => kartu(d, i, true)).join('')}
    </div>

    <div class="sec-head rv" style="max-width:none;margin:52px 0 26px">
      <span class="eyebrow">${icon('tooth')} Poliklinik Gigi</span>
      <h2 style="font-size:clamp(24px,3.2vw,32px);margin:14px 0 0">Dokter gigi yang bertugas</h2>
    </div>
    <div class="grid g3">
      ${DOCTORS.filter(d => d.poli === 'Poli Gigi').map((d, i) => kartu(d, i, true)).join('')}
    </div>

    <div class="sec-head rv" style="max-width:none;margin:52px 0 26px">
      <span class="eyebrow">${icon('pill')} Apoteker Penanggung Jawab</span>
      <h2 style="font-size:clamp(24px,3.2vw,32px);margin:14px 0 8px">Yang menyiapkan dan menjelaskan obat Anda</h2>
      <p style="font-size:14.5px">Apoteker melayani konseling obat di Depo Farmasi Klinik tanpa perlu membuat janji — cukup datang pada jam pelayanan.</p>
    </div>
    <div class="grid g3">
      ${APOTEKER.map((a, i) => kartu(a, i, false)).join('')}
    </div>

    <div class="fcard rv" style="margin-top:56px">
      <h2 style="font-size:24px;margin-bottom:8px">Jadwal Praktik Mingguan</h2>
      <p style="margin-bottom:24px">Disusun dari jadwal masing-masing dokter. Bila ada perubahan mendadak, pendaftar online kami hubungi lebih dulu.</p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:640px;font-size:14.5px">
          <thead><tr style="background:var(--g-50)">
            <th style="text-align:left;padding:14px 16px;font-family:var(--ff-h);color:var(--ink);border-radius:12px 0 0 12px">Hari</th>
            <th style="text-align:left;padding:14px 16px;font-family:var(--ff-h);color:var(--ink)">Pagi – Siang (06.00 – 11.30)</th>
            <th style="text-align:left;padding:14px 16px;font-family:var(--ff-h);color:var(--ink);border-radius:0 12px 12px 0">Malam (17.00 – 20.30)</th>
          </tr></thead>
          <tbody>
            ${HARI.map(h => {
              const pagi = praktik(h, 'pagi'), malam = praktik(h, 'malam');
              // Jam yang ditampilkan harus jam pada SESI kolom itu saja,
              // bukan seluruh jadwal dokter pada hari tersebut.
              const sel = (list, sesi) => list.length
                ? list.map(d => `<div style="margin-bottom:5px"><strong style="color:var(--ink)">${esc(d.name)}</strong><br><span style="font-size:12.5px;color:var(--muted)">${esc(d.jadwal.filter(j => j.sesi === sesi && cocok(j.hari, h)).map(j => j.jam).join(' · '))}</span></div>`).join('')
                : '<span style="color:var(--muted)">—</span>';
              return `<tr style="border-bottom:1px solid var(--line-2)">
                <td style="padding:14px 16px;font-weight:600;color:var(--ink);vertical-align:top;white-space:nowrap">${h}</td>
                <td style="padding:14px 16px;vertical-align:top">${sel(pagi, 'pagi')}</td>
                <td style="padding:14px 16px;vertical-align:top">${sel(malam, 'malam')}</td></tr>`;
            }).join('')}
            <tr><td style="padding:14px 16px;font-weight:600;color:var(--ink)">Minggu</td>
            <td style="padding:14px 16px" colspan="2"><span style="color:var(--muted)">Tutup — layanan tanya jawab tetap aktif lewat WhatsApp</span></td></tr>
          </tbody>
        </table>
      </div>

      <div class="fnote" style="margin-top:22px">${icon('clock')}<div><strong>Pukul 11.30 – 13.00 klinik tidak melayani praktek.</strong> Waktu tersebut dipakai untuk pelayanan administrasi apotek — penataan stok dan berkas resep — sebelum operasional malam dibuka pukul 17.00.</div></div>
      <div class="fnote" style="margin-top:12px">${icon('alert')}<div><strong>Khitan dengan perjanjian.</strong> Layanan khitan dijadwalkan terpisah, minimal H-2 sebelum tindakan, agar ruangan dan tim dapat disiapkan khusus untuk Anda.</div></div>
    </div>
  </div>
</section>
${ctaBlock({ title: 'Pilih dokter dan jam yang cocok untuk Anda.', text: 'Cukup sebutkan poli dan waktu yang diinginkan saat mendaftar — kami carikan slot terdekat.' })}`;
}

/* =================================================== APOTEK === */
function apotek() {
  return `
${phead('pill', 'Apotek Mahira Farma', 'Tiga cabang apotek, satu standar pelayanan', 'Apotek Mahira Farma adalah bagian dari ekosistem Klinik Pratama Sehat Sejahtera. Setiap penyerahan obat disertai penjelasan apoteker — bukan sekadar menyerahkan bungkusan.', [{ label: 'Beranda', href: '/' }, { label: 'Apotek' }])}

<section class="sec">
  <div class="wrap">
    <div class="grid g3">
      ${PHARMACIES.map((p, i) => `<article class="pharm rv" id="${p.slug}" style="transition-delay:${i * 70}ms">
        <div class="pharm-top"><span class="tag">${esc(p.badge)}</span><h3>${esc(p.name)}</h3><p class="area">${icon('map-pin')} ${esc(p.area)}</p></div>
        <div class="pharm-body">
          <li>${icon('map-pin')}<span>${esc(p.address)}</span></li>
          <li>${icon('clock')}<span>${esc(p.hours)}</span></li>
          <li>${icon('check-circle')}<span>${esc(p.note)}</span></li>
          <div class="pharm-act">
            ${p.maps ? `<a class="btn btn-ghost" href="${esc(p.maps)}" target="_blank" rel="noopener">${icon('map-pin')} Peta</a>` : ''}
            <a class="btn btn-wa" href="${waLink('Halo Apotek ' + p.name + ' (' + p.area + '), saya ingin menanyakan ketersediaan obat.')}" target="_blank" rel="noopener">${icon('whatsapp')} Tanya Stok</a>
          </div>
        </div></article>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap">
    <div class="split">
      <div class="rv">
        <span class="eyebrow">${icon('route')} Tebus Obat Online</span>
        <h2 style="font-size:clamp(28px,4vw,38px);margin:18px 0 16px">Kirim foto resep, obat kami siapkan</h2>
        <p class="lead">Tidak sempat mampir? Kirimkan foto resep Anda, pilih cabang, lalu tinggal ambil atau minta diantar untuk wilayah Kota Blitar.</p>
        <div class="steps" style="margin-top:28px">
          <div class="step"><span class="n">1</span><div><b>Foto resep Anda</b><p>Pastikan seluruh tulisan terbaca jelas, termasuk nama dokter dan tanggal.</p></div></div>
          <div class="step"><span class="n">2</span><div><b>Kirim ke WhatsApp apotek</b><p>Sebutkan cabang pilihan dan apakah ingin diambil sendiri atau diantar.</p></div></div>
          <div class="step"><span class="n">3</span><div><b>Konfirmasi &amp; bayar</b><p>Apoteker mengirim rincian harga. Setelah disetujui, obat disiapkan.</p></div></div>
        </div>
        <a class="btn btn-wa btn-lg" style="margin-top:28px" href="${waLink('Halo Apotek Mahira Farma, saya ingin menebus obat.\\n\\nCabang pilihan:\\nNama pasien:\\nAmbil sendiri / diantar:')}" target="_blank" rel="noopener">${icon('whatsapp')} Kirim Resep Sekarang</a>
      </div>
      <div class="rv">
        <div class="aside-card"><h3>${icon('shield')} Jaminan Kami</h3>
          <ul class="checks">
            <li>${icon('check-circle')}<div><b>Obat asli &amp; tertelusur</b><span>Dipasok dari Pedagang Besar Farmasi resmi dengan nomor batch yang bisa diperiksa.</span></div></li>
            <li>${icon('check-circle')}<div><b>Konseling apoteker gratis</b><span>Aturan pakai, interaksi obat, dan penyimpanan dijelaskan sampai Anda paham.</span></div></li>
            <li>${icon('check-circle')}<div><b>Stok terhubung 3 cabang</b><span>Bila kosong di satu cabang, kami cek cabang lain sebelum Anda berangkat.</span></div></li>
            <li>${icon('check-circle')}<div><b>Pendampingan pasien kronis</b><span>Program Home Pharmacy Care untuk lansia dan pasien dengan banyak obat.</span></div></li>
          </ul>
        </div>
        <div class="aside-card" style="background:linear-gradient(150deg,var(--g-50),var(--surface));border-color:var(--g-200)">
          <h3>${icon('instagram')} Ikuti Apotek Kami</h3>
          <p style="font-size:14.5px;margin-bottom:16px">Info stok obat terbaru, promo, dan perubahan jam buka tiga cabang kami umumkan di Instagram <strong>${esc(CONFIG.social.apotekInstagramHandle)}</strong>.</p>
          <a class="btn btn-primary block" href="${CONFIG.social.apotekInstagram}" target="_blank" rel="noopener">${icon('instagram')} Buka Instagram Apotek</a>
          <a class="btn btn-ghost block" style="margin-top:10px" href="${CONFIG.social.apotekWeb}" target="_blank" rel="noopener">${icon('arrow-up-right')} Situs Mahira Farma</a>
        </div>
        <div class="aside-card"><h3>${icon('alert')} Yang Perlu Diperhatikan</h3>
          <p style="font-size:14.5px">Obat keras hanya diserahkan dengan resep dokter yang sah. Kami tidak melayani permintaan antibiotik atau obat keras tanpa resep — ini demi keselamatan Anda dan mencegah resistansi antibiotik.</p>
        </div>
      </div>
    </div>
  </div>
</section>
${ctaBlock({ eyebrow: 'Butuh Resep Dulu?', title: 'Belum punya resep? Konsultasi dulu lewat Top Dokter.', text: 'Dokter kami menerbitkan resep elektronik yang langsung diteruskan ke apotek pilihan Anda.' })}`;
}

/* ================================================== ARTIKEL === */
function artikelIndex() {
  return `
${phead('file', 'Artikel Kesehatan', 'Bacaan sehat untuk warga Blitar', 'Tips, penjelasan penyakit, dan panduan praktis yang ditulis dengan bahasa sehari-hari oleh tim medis kami.', [{ label: 'Beranda', href: '/' }, { label: 'Artikel' }])}
<section class="sec"><div class="wrap"><div class="grid g3">${ARTICLES.map((a, i) => artCard(a, i)).join('')}</div></div></section>
${ctaBlock({ eyebrow: 'Punya Pertanyaan?', title: 'Baca saja belum cukup? Tanyakan langsung ke dokter kami.', text: 'Layanan Top Dokter memungkinkan Anda berkonsultasi lewat WhatsApp tanpa harus datang.' })}`;
}

function articleDetail(a) {
  const others = ARTICLES.filter(x => x.slug !== a.slug);
  const body = a.body.map(([t, v]) => {
    if (t === 'p') return `<p>${v}</p>`;
    if (t === 'h2') return `<h2>${v}</h2>`;
    if (t === 'h3') return `<h3>${v}</h3>`;
    if (t === 'ul') return `<ul>${v.map(li => `<li>${li}</li>`).join('')}</ul>`;
    if (t === 'cta') return `<div class="note"><p><strong>${v}.</strong> Tim kami siap membantu — <a href="/pendaftaran.html" style="color:var(--brand);font-weight:600;text-decoration:underline">daftar online di sini</a> atau <a href="${WA_DAFTAR}" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600;text-decoration:underline">chat admin lewat WhatsApp</a>.</p></div>`;
    return '';
  }).join('\n');

  return `
<section class="phead"><div class="wrap"><div class="phead-in">
  ${crumb([{ label: 'Beranda', href: '/' }, { label: 'Artikel', href: '/artikel.html' }, { label: a.category }])}
  <div class="art-meta" style="margin-top:16px"><span class="cat">${esc(a.category)}</span><span>${fmtDate(a.date)}</span><span>· ${esc(a.read)} baca</span></div>
  <h1>${esc(a.title)}</h1><p>${esc(a.excerpt)}</p>
</div></div></section>

<section class="sec">
  <div class="wrap">
    <div class="split" style="grid-template-columns:1fr 340px;align-items:start;gap:56px">
      <article class="prose rv">${body}
        <div style="margin-top:40px;padding-top:26px;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)">
          Ditinjau oleh tim medis ${esc(CONFIG.siteName)}. Artikel ini bersifat edukatif dan tidak menggantikan pemeriksaan langsung oleh dokter.
        </div>
      </article>
      <aside class="rv">
        <div class="aside-card"><h3>${icon('calendar')} Butuh Pemeriksaan?</h3>
          <p style="font-size:14.5px;margin-bottom:18px">Daftar online sekarang, nomor antrean langsung dikirim ke WhatsApp Anda.</p>
          <a class="btn btn-primary block" href="/pendaftaran.html">${icon('calendar')} Daftar Online</a>
          <a class="btn btn-wa block" style="margin-top:10px" href="${WA_DAFTAR}" target="_blank" rel="noopener">${icon('whatsapp')} Chat Admin</a>
        </div>
        <div class="aside-card"><h3>${icon('file')} Artikel Lain</h3>
          <ul style="display:grid;gap:16px">${others.map(o => `<li><a href="/artikel/${o.slug}.html" style="display:block">
            <b style="font-family:var(--ff-h);font-size:14.5px;color:var(--ink);line-height:1.4;display:block">${esc(o.title)}</b>
            <span style="font-size:12.5px;color:var(--muted)">${esc(o.category)} · ${esc(o.read)}</span></a></li>`).join('')}</ul>
        </div>
      </aside>
    </div>
  </div>
</section>
${ctaBlock()}`;
}

/* ============================================== PENDAFTARAN === */
function pendaftaran() {
  return `
${phead('calendar', 'Pendaftaran Online', 'Daftar dari rumah, datang tinggal masuk', 'Isi formulir di bawah ini. Data Anda langsung tercatat di sistem klinik dan otomatis diteruskan ke WhatsApp admin untuk dikonfirmasi.', [{ label: 'Beranda', href: '/' }, { label: 'Pendaftaran' }])}

<section class="sec">
  <div class="wrap">
    <div class="fwrap">
      <div class="fcard rv">
        <div class="fstatus" id="reg-status"></div>
        <form id="form-daftar" novalidate>
          <h2 style="font-size:20px;margin-bottom:6px">Data Pasien</h2>
          <p style="font-size:14.5px;margin-bottom:24px">Data inti: <strong>nama, umur, alamat, dan keluhan</strong>. Nomor KTP/kartu boleh dilengkapi sekarang agar pendaftaran di loket lebih cepat. Kolom bertanda <span style="color:var(--r-500)">*</span> wajib diisi.</p>
          <div class="fgrid">
            <div class="field full"><label for="nama">Nama pasien <span class="req">*</span></label>
              <input id="nama" name="nama" required autocomplete="name" placeholder="Nama lengkap pasien"><div class="err">Nama pasien wajib diisi.</div></div>

            <div class="field"><label for="umur">Umur <span class="req">*</span></label>
              <input id="umur" name="umur" inputmode="numeric" required placeholder="Contoh: 34 tahun / 8 bulan">
              <div class="err">Umur wajib diisi.</div></div>

            <div class="field"><label for="hp">Nomor WhatsApp aktif <span class="req">*</span></label>
              <input id="hp" name="hp" type="tel" inputmode="tel" required autocomplete="tel" placeholder="08xxxxxxxxxx">
              <div class="hint">Dipakai admin untuk mengirim nomor antrean.</div>
              <div class="err">Masukkan nomor WhatsApp yang benar.</div></div>

            <div class="field"><label for="jenisKartu">Jenis kartu</label>
              <select id="jenisKartu" name="jenisKartu">
                ${JENIS_KARTU.map(k => `<option value="${esc(k.v)}">${esc(k.l)}</option>`).join('\n                ')}
              </select>
              <div class="hint">Pilih kartu yang akan Anda bawa saat datang. Pasien lama boleh memakai nomor rekam medis.</div></div>

            <div class="field"><label for="noKartu">Nomor kartu / rekam medis</label>
              <input id="noKartu" name="noKartu" inputmode="numeric" autocomplete="off"
                     maxlength="30" placeholder="${esc(JENIS_KARTU[0].ph || '')}">
              <div class="hint">Opsional — mempercepat pendaftaran di loket. Bisa diisi saat datang.</div>
              <div class="err">Nomor yang diisi belum sesuai jenis kartu yang dipilih.</div></div>

            <div class="field full"><label for="alamat">Alamat <span class="req">*</span></label>
              <input id="alamat" name="alamat" required placeholder="Contoh: Jl. Melati 12, Karangtengah, Sananwetan">
              <div class="err">Alamat wajib diisi.</div></div>

            <div class="field full"><label>Layanan yang dituju <span class="req">*</span></label>
              <div class="chips" id="chips-layanan">
                ${SERVICES.filter(s => !s.tanpaDaftar && s.slug !== 'top-dokter')
                  .map(s => `<label class="chip"><input type="radio" name="layanan" value="${esc(s.name)}" required><span>${icon(s.icon)} ${esc(s.name)}</span></label>`).join('')}
              </div><div class="err">Pilih salah satu layanan.</div>
              <div class="hint">Pelayanan Farmasi tidak perlu didaftarkan — datang langsung ke Depo Farmasi. Untuk konsultasi online, gunakan <a href="/layanan/top-dokter.html#form" style="color:var(--brand);font-weight:600">formulir Top Dokter</a>.</div></div>

            <div class="field"><label for="tanggal">Tanggal kunjungan <span class="req">*</span></label>
              <input id="tanggal" name="tanggal" type="date" required><div class="err">Pilih tanggal kunjungan.</div></div>

            <div class="field"><label for="sesi">Sesi <span class="req">*</span></label>
              <select id="sesi" name="sesi" required><option value="">Pilih sesi</option><option>Pagi (06.00–11.30)</option><option>Sore/Malam (17.00–20.30)</option><option>Fleksibel — atur oleh admin</option></select>
              <div class="err">Pilih sesi kunjungan.</div></div>

            <div class="field full"><label for="keluhan">Keluhan singkat <span class="req">*</span></label>
              <textarea id="keluhan" name="keluhan" required placeholder="Contoh: gigi geraham kanan bawah berlubang dan nyeri sejak 3 hari lalu"></textarea>
              <div class="err">Ceritakan keluhan Anda secara singkat.</div></div>

            <div class="field full">
              <label class="chip" style="display:block"><input type="checkbox" name="setuju" value="ya" required>
                <span>${icon('lock')} Saya setuju data ini digunakan untuk keperluan pelayanan klinik</span></label>
              <div class="err">Persetujuan diperlukan untuk memproses pendaftaran.</div></div>
          </div>

          <div class="fnote" id="note-khusus" style="margin-top:20px;background:var(--r-50);border-color:var(--r-100);color:var(--r-700);display:none">${icon('shield-heart')}<div>Pendaftaran <strong id="note-khusus-lay">layanan ini</strong> ditangani <strong>admin khusus</strong> di nomor <strong id="note-khusus-no"></strong>. Ringkasan pendaftaran Anda akan otomatis diarahkan ke nomor tersebut.</div></div>

          <div class="fnote" style="margin-top:20px">${icon('whatsapp')}<div>Setelah tombol ditekan, data tersimpan di sistem klinik dan WhatsApp akan terbuka berisi ringkasan pendaftaran Anda. <strong>Kirim pesan tersebut</strong> agar admin dapat langsung mengonfirmasi nomor antrean.</div></div>

          <button class="btn btn-primary btn-lg block" style="margin-top:22px" type="submit" id="btn-daftar">${icon('whatsapp')} Kirim Pendaftaran</button>
          <p style="font-size:12.5px;color:var(--muted);margin-top:14px;text-align:center">Dengan mendaftar, Anda menyetujui <a href="/kebijakan-privasi.html" style="color:var(--brand);text-decoration:underline">Kebijakan Privasi</a> kami.</p>
        </form>
      </div>

      <aside class="rv">
        <div class="aside-card"><h3>${icon('route')} Cara Kerjanya</h3>
          <div class="steps">
            <div class="step"><span class="n">1</span><div><b>Isi formulir</b><p>Kurang dari 2 menit. Data langsung masuk sistem klinik.</p></div></div>
            <div class="step"><span class="n">2</span><div><b>Kirim ke WhatsApp</b><p>Ringkasan otomatis terbuka. Cukup tekan kirim.</p></div></div>
            <div class="step"><span class="n">3</span><div><b>Terima nomor antrean</b><p>Admin membalas dengan nomor antrean dan perkiraan jam dilayani.</p></div></div>
            <div class="step"><span class="n">4</span><div><b>Datang sesuai jadwal</b><p>Tunjukkan pesan konfirmasi di meja pendaftaran.</p></div></div>
          </div>
        </div>
        <div class="aside-card"><h3>${icon('clock')} Jam Praktik</h3>
          ${CONFIG.hours.map(h => `<div style="display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid var(--line-2);font-size:14px"><b style="font-family:var(--ff-h);color:var(--ink)">${esc(h.day)}</b><span style="text-align:right">${esc(h.pagi)}<br>${esc(h.sore)}</span></div>`).join('')}
        </div>
        <div class="aside-card" style="background:var(--r-50);border-color:var(--r-100)">
          <h3 style="color:var(--r-700)">${icon('alert')} Kondisi Darurat?</h3>
          <p style="font-size:14.5px;color:var(--r-700)">Formulir ini untuk layanan rawat jalan terjadwal. Untuk kondisi gawat darurat — nyeri dada hebat, sesak berat, perdarahan hebat, penurunan kesadaran — <strong>segera menuju IGD rumah sakit terdekat</strong> atau hubungi 119.</p>
        </div>
      </aside>
    </div>
  </div>
</section>`;
}

/* =================================================== KONTAK === */
function kontak() {
  return `
${phead('phone', 'Kontak', 'Kami mudah dihubungi, setiap hari kerja', 'Ada pertanyaan sebelum datang? Hubungi kami lewat kanal mana pun di bawah ini — admin kami membalas pada jam praktik.', [{ label: 'Beranda', href: '/' }, { label: 'Kontak' }])}

<section class="sec">
  <div class="wrap">
    <div class="grid g3" style="margin-bottom:48px">
      <a class="card rv" href="${waLink('Halo Admin Klinik Pratama Sehat Sejahtera, saya ingin bertanya.')}" target="_blank" rel="noopener">
        <div class="card-ic" style="background:#E8F8EE;color:#1FAF54">${icon('whatsapp')}</div>
        <h3>WhatsApp Admin</h3><p>${esc(CONFIG.waDisplay)}<br><span style="color:var(--brand);font-weight:600">Balasan tercepat pada jam praktik</span></p></a>
      <a class="card rv" href="tel:+${CONFIG.waNumber}">
        <div class="card-ic">${icon('phone')}</div><h3>Telepon</h3><p>${esc(CONFIG.waDisplay)}<br><span style="color:var(--muted)">Senin–Sabtu, jam praktik</span></p></a>
      <a class="card rv" href="${waLinkTo('Pelayanan Khitan', 'Halo Admin Khitan, saya ingin menjadwalkan khitan.')}" target="_blank" rel="noopener">
        <div class="card-ic" style="background:var(--r-50);color:var(--r-600)">${icon('shield-heart')}</div>
        <h3>Admin Khitan</h3><p>${esc(waFor('Pelayanan Khitan').display)}<br><span style="color:var(--brand);font-weight:600">Nomor khusus penjadwalan khitan</span></p></a>
      <a class="card rv" href="${CONFIG.address.mapsUrl}" target="_blank" rel="noopener">
        <div class="card-ic">${icon('map-pin')}</div><h3>Lokasi Klinik</h3><p>${esc(CONFIG.address.street)}<br>${esc(CONFIG.address.district)}, ${esc(CONFIG.address.city)}</p></a>
    </div>

    <div class="fwrap">
      <div class="fcard rv">
        <h2 style="font-size:22px;margin-bottom:6px">Kirim Pesan</h2>
        <p style="font-size:14.5px;margin-bottom:24px">Untuk pertanyaan umum, kerja sama, atau masukan. Pesan Anda masuk ke sistem dan diteruskan ke admin.</p>
        <form id="form-kontak" novalidate>
          <div class="fstatus" id="kontak-status"></div>
          <div class="fgrid">
            <div class="field"><label for="k-nama">Nama <span class="req">*</span></label><input id="k-nama" name="nama" required placeholder="Nama Anda"><div class="err">Nama wajib diisi.</div></div>
            <div class="field"><label for="k-hp">Nomor WhatsApp <span class="req">*</span></label><input id="k-hp" name="hp" type="tel" required placeholder="08xxxxxxxxxx"><div class="err">Masukkan nomor yang benar.</div></div>
            <div class="field full"><label for="k-subjek">Perihal</label>
              <select id="k-subjek" name="subjek"><option>Pertanyaan layanan</option><option>Jadwal &amp; pendaftaran</option><option>Apotek &amp; obat</option><option>Kerja sama / kemitraan</option><option>Masukan &amp; keluhan</option></select></div>
            <div class="field full"><label for="k-pesan">Pesan <span class="req">*</span></label><textarea id="k-pesan" name="pesan" required placeholder="Tulis pesan Anda di sini..."></textarea><div class="err">Pesan wajib diisi.</div></div>
          </div>
          <button class="btn btn-primary btn-lg block" style="margin-top:22px" type="submit">${icon('arrow-right')} Kirim Pesan</button>
        </form>
      </div>
      <aside class="rv">
        <div class="aside-card"><h3>${icon('map-pin')} Alamat Lengkap</h3>
          <p style="font-size:15px">${esc(CONFIG.address.street)}<br>${esc(CONFIG.address.district)}<br>${esc(CONFIG.address.city)}, ${esc(CONFIG.address.region)} ${esc(CONFIG.address.postal)}</p>
          <a class="btn btn-ghost block" style="margin-top:16px" href="${CONFIG.address.mapsUrl}" target="_blank" rel="noopener">${icon('map-pin')} Buka di Google Maps</a>
        </div>
        <div class="aside-card"><h3>${icon('pill')} Apotek Mahira Farma</h3>
          <ul style="display:grid;gap:14px">${PHARMACIES.map(p => `<li><a href="/apotek.html#${p.slug}"><b style="font-family:var(--ff-h);font-size:14.5px;color:var(--ink);display:block">${esc(p.name)}</b><span style="font-size:13px;color:var(--muted)">${esc(p.area)} · ${esc(p.hours)}</span></a></li>`).join('')}</ul>
        </div>
        <div class="aside-card"><h3>${icon('instagram')} Media Sosial</h3>
          <div style="display:grid;gap:10px">
            <a class="btn btn-ghost block" href="${CONFIG.social.instagram}" target="_blank" rel="noopener">${icon('instagram')} Instagram Klinik</a>
            <a class="btn btn-ghost block" href="${CONFIG.social.facebook}" target="_blank" rel="noopener">${icon('facebook')} Facebook Klinik</a>
            <a class="btn btn-ghost block" href="${CONFIG.social.apotekInstagram}" target="_blank" rel="noopener">${icon('pill')} Instagram Apotek</a>
            <a class="btn btn-ghost block" href="${CONFIG.social.apotekWeb}" target="_blank" rel="noopener">${icon('arrow-up-right')} Situs Mahira Farma</a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>`;
}

/* =================================================== PRIVASI === */
function privasi() {
  return `
${phead('lock', 'Kebijakan Privasi', 'Bagaimana kami memperlakukan data Anda', 'Ringkas, tanpa kalimat berbelit. Ini yang kami kumpulkan, mengapa, dan apa hak Anda atas data tersebut.', [{ label: 'Beranda', href: '/' }, { label: 'Kebijakan Privasi' }])}
<section class="sec"><div class="wrap"><article class="prose rv" style="margin-inline:auto">
  <h2>Data yang kami kumpulkan</h2>
  <p>Melalui formulir pendaftaran dan kontak, kami mengumpulkan: nama, tanggal lahir, jenis kelamin, nomor WhatsApp, alamat domisili, NIK (opsional), jenis jaminan, serta keluhan yang Anda tuliskan.</p>
  <h2>Untuk apa data digunakan</h2>
  <ul>
    <li>Menyiapkan antrean dan jadwal kunjungan Anda.</li>
    <li>Menghubungi Anda untuk konfirmasi, perubahan jadwal, dan pengingat kontrol.</li>
    <li>Menyiapkan berkas rekam medis internal klinik.</li>
    <li>Menyiapkan obat di Apotek Mahira Farma sesuai resep dokter.</li>
  </ul>
  <h2>Yang tidak kami lakukan</h2>
  <ul>
    <li>Kami tidak menjual atau menyewakan data Anda kepada pihak mana pun.</li>
    <li>Kami tidak membagikan data Anda untuk tujuan pemasaran pihak ketiga.</li>
    <li>Data internal klinik tidak otomatis ditampilkan pada aplikasi eksternal mana pun.</li>
  </ul>
  <h2>Penyimpanan &amp; akses</h2>
  <p>Data pendaftaran tersimpan pada basis data spreadsheet milik klinik dengan akses terbatas. Hanya admin dan tenaga medis berwenang yang dapat membukanya. Panel admin dilindungi kata sandi dan tidak tertaut dari halaman publik mana pun.</p>
  <h2>Integrasi masa depan</h2>
  <p>Ke depan kami berencana menyambungkan sistem dengan BPJS Kesehatan dan SATUSEHAT sesuai ketentuan yang berlaku. Penyambungan hanya mencakup data yang diwajibkan regulasi, dan akan diinformasikan lebih dulu melalui halaman ini.</p>
  <h2>Hak Anda</h2>
  <ul>
    <li>Meminta salinan data pribadi Anda yang kami simpan.</li>
    <li>Meminta koreksi bila ada data yang keliru.</li>
    <li>Meminta penghapusan data, sepanjang tidak bertentangan dengan kewajiban penyimpanan rekam medis.</li>
  </ul>
  <div class="note"><p>Untuk menggunakan hak-hak di atas, hubungi kami di <strong>${esc(CONFIG.waDisplay)}</strong> atau datang langsung ke klinik dengan membawa identitas.</p></div>
  <p style="font-size:14px;color:var(--muted)">Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terakhir diperbarui pada tanggal publikasi halaman ini.</p>
</article></div></section>`;
}

/* =================================================== OFFLINE === */
function offlineBody() {
  return `<section class="sec" style="min-height:70vh;display:grid;place-items:center">
  <div class="wrap" style="text-align:center;max-width:540px">
    <div class="card-ic" style="margin:0 auto 24px;width:72px;height:72px;border-radius:22px">${icon('wifi-off')}</div>
    <h1 style="font-size:32px;margin-bottom:14px">Anda sedang offline</h1>
    <p class="lead" style="margin-bottom:28px">Halaman yang pernah Anda buka tetap bisa diakses. Untuk halaman baru, sambungkan kembali internet Anda.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="location.reload()">${icon('arrow-right')} Coba Lagi</button>
      <a class="btn btn-ghost" href="/">${icon('heart')} Ke Beranda</a>
    </div>
    <p style="margin-top:32px;font-size:14px">Dalam keadaan darurat, hubungi <a href="tel:+${CONFIG.waNumber}" style="color:var(--brand);font-weight:700">${esc(CONFIG.waDisplay)}</a> atau 119.</p>
  </div>
</section>`;
}



/* ================================================== ANTREAN === */
function antrean() {
  const kartuPoli = ANTREAN.poli.map(p => {
    const b = STATUS_BARIS.filter(x => x.poli === p.slug)[0];
    const s = b ? STATUS.hitung(b, waktuBuild) : null;
    return `<article class="q-card rv" data-poli="${p.slug}"${s ? ` data-status="${esc(s.status)}"` : ''}>
    <header class="q-head">
      <span class="q-kode">${p.kode}</span>
      <div><b>${esc(p.nama)}</b><span class="q-sub" data-f="ringkas">Memuat…</span></div>
    </header>
    ${s ? `<div class="q-jam" data-status-jam>${esc(s.badge + ' · ' + s.ket)}</div>` : ''}
    <div class="q-now">
      <span class="q-now-l">Sedang dipanggil</span>
      <strong data-f="sekarang">—</strong>
      <span class="q-now-n" data-f="sekarangNama"></span>
    </div>
    <div class="q-stat">
      <div><b data-f="menunggu">0</b><span>Menunggu</span></div>
      <div><b data-f="selesai">0</b><span>Selesai</span></div>
      <div><b data-f="terlewat">0</b><span>Terlewat</span></div>
    </div>
    <div class="q-list" data-f="daftar"></div>
  </article>`;
  }).join('');

  const banners = ANTREAN.banner.map((b, i) => `<div class="q-banner${i === 0 ? ' on' : ''}">
    <div><b>${esc(b.judul)}</b><p>${esc(b.teks)}</p></div>
    <a class="btn btn-primary" href="${b.href}">${esc(b.cta)} ${icon('arrow-right')}</a>
  </div>`).join('');

  return `
${phead('users', 'Antrean Hari Ini', 'Pantau giliran Anda dari mana saja',
  'Papan ini menyegarkan diri otomatis setiap ' + ANTREAN.pollDetik + ' detik. Nomor antrean online mulai tampil setelah petugas membuka antrean pada jam praktik.',
  [{ label: 'Beranda', href: '/' }, { label: 'Antrean' }])}

<section class="sec" style="padding-top:34px">
  <div class="wrap">

    <div class="q-bar rv">
      <div class="q-status" id="q-status"><span class="dot"></span><span id="q-status-t">Menghubungkan…</span></div>
      <div class="q-legend">
        <span><i class="lg lg-menunggu"></i> Belum dipanggil</span>
        <span><i class="lg lg-dilayani"></i> Sedang ditangani</span>
        <span><i class="lg lg-terlewat"></i> Tidak hadir</span>
        <span><i class="lg lg-selesai"></i> Sudah dilayani</span>
      </div>
    </div>

    <div class="q-alert" id="q-tutup" hidden>
      ${icon('clock')}
      <div><b>Antrean online belum dibuka.</b> Petugas mencatat pasien yang datang langsung lebih dulu. Nomor Anda muncul di papan ini begitu antrean online dibuka — pendaftaran tetap bisa dilakukan sekarang.</div>
    </div>

    <div class="q-grid">${kartuPoli}</div>

    <div class="q-cek rv">
      <div>
        <span class="eyebrow">${icon('check-circle')} Cek Nomor Anda</span>
        <h2>Punya nomor antrean? Lihat sisa gilirannya</h2>
        <p>Masukkan nomor dari pesan WhatsApp Anda, misalnya <code>U-07</code>.</p>
      </div>
      <form id="form-cek" novalidate>
        <div class="q-cek-in">
          <input id="cek-kode" placeholder="U-07" autocomplete="off" inputmode="text" aria-label="Nomor antrean">
          <button class="btn btn-primary" type="submit">Cek</button>
        </div>
        <div class="fstatus" id="cek-status"></div>
      </form>
    </div>

    <div class="q-banners" id="q-banners">${banners}</div>

    <div class="q-note">
      ${icon('shield')}
      <p>Demi privasi pasien, papan ini hanya menampilkan nomor antrean dan nama yang disingkat. Keluhan dan nomor telepon tidak pernah ditampilkan.</p>
    </div>

  </div>
</section>

${ctaBlock({ title: 'Belum punya nomor antrean?', text: 'Daftar sekarang, nomor Anda langsung dikirim ke WhatsApp.' })}`;
}

/* --------------------------------------------------------- 404 */
function notFoundBody() {
  return `<section class="sec" style="min-height:70vh;display:grid;place-items:center">
  <div class="wrap" style="text-align:center;max-width:560px">
    <div class="card-ic" style="margin:0 auto 24px;width:72px;height:72px;border-radius:22px">${icon('alert')}</div>
    <h1 style="font-size:32px;margin-bottom:14px">Halaman tidak ditemukan</h1>
    <p class="lead" style="margin-bottom:28px">Alamat yang Anda tuju sudah dipindahkan atau tidak pernah ada. Silakan kembali ke beranda atau langsung daftar berobat.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn-primary" href="/">${icon('heart')} Ke Beranda</a>
      <a class="btn btn-ghost" href="/pendaftaran.html">${icon('calendar')} Daftar Berobat</a>
      <a class="btn btn-ghost" href="/layanan.html">${icon('stethoscope')} Lihat Layanan</a>
    </div>
    <p style="margin-top:32px;font-size:14px">Butuh bantuan? Hubungi <a href="tel:+${CONFIG.waNumber}" style="color:var(--brand);font-weight:700">${esc(CONFIG.waDisplay)}</a>.</p>
  </div>
</section>`;
}

module.exports = { home, antrean, profil, layananIndex, serviceDetail, dokter, apotek, artikelIndex, articleDetail, pendaftaran, kontak, privasi, offlineBody, notFoundBody, fmtDate };
