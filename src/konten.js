/* =============================================================
 * konten.js — Menarik konten yang diedit lewat panel admin
 * -------------------------------------------------------------
 * Dipanggil build.js sebelum halaman dibuat. Isi dari Apps Script
 * MENIMPA data bawaan di src/data/site.js.
 *
 * Bila server tidak terjangkau (offline, URL belum dipasang, atau
 * Apps Script sedang bermasalah), build TETAP berjalan memakai data
 * bawaan — situs tidak boleh gagal terbit hanya karena CMS mati.
 * ============================================================= */

/* koleksi di server → di mana isinya ditaruh pada data situs */
const PETA = {
  nav:        D => D.NAV,
  services:   D => D.SERVICES,
  doctors:    D => D.DOCTORS,
  apoteker:   D => D.APOTEKER,
  facilities: D => D.FACILITIES,
  partners:   D => D.PARTNERS,
  pharmacies: D => D.PHARMACIES,
  produk:     D => D.PRODUK.daftar,
  articles:   D => D.ARTICLES
};

/* item koleksi "config" → objek tunggal yang di-merge */
const CONFIG_TARGET = D => ({
  klinik:  D.CONFIG,
  aminah:  D.AMINAH,
  produk:  D.PRODUK,
  antrean: D.ANTREAN,
  teks:    D.TEKS
});

const bersih = o => {
  const x = Object.assign({}, o);
  delete x.__id; delete x.__urut; delete x.__aktif;
  return x;
};

/** Ganti seluruh isi array, tanpa mengganti referensinya
 *  (src/pages.js sudah memegang referensi array yang sama). */
function isiUlang(arr, baru) {
  arr.length = 0;
  baru.forEach(x => arr.push(x));
}

async function ambil(url, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(t); }
}

async function muat(D) {
  const url = process.env.KONTEN_URL || (D.CONFIG && D.CONFIG.gasUrl) || '';
  const laporan = { dipakai: false, alasan: '', diterapkan: {} };

  if (!url || url.indexOf('GANTI_DENGAN') > -1) {
    laporan.alasan = 'URL Apps Script belum dipasang';
    return laporan;
  }
  if (process.env.KONTEN_OFF === '1') {
    laporan.alasan = 'dimatikan lewat KONTEN_OFF=1';
    return laporan;
  }

  let j;
  try {
    j = await ambil(url + (url.includes('?') ? '&' : '?') + 'action=konten');
  } catch (e) {
    laporan.alasan = 'server konten tidak terjangkau (' + e.message + ')';
    return laporan;
  }
  if (!j || j.ok !== true || !j.konten) {
    laporan.alasan = 'jawaban server tidak sesuai';
    return laporan;
  }

  const K = j.konten;

  /* --- koleksi berbentuk daftar --- */
  for (const nama of Object.keys(PETA)) {
    const daftar = K[nama];
    if (!Array.isArray(daftar) || !daftar.length) continue;   // kosong = pakai bawaan
    const target = PETA[nama](D);
    if (!Array.isArray(target)) continue;
    isiUlang(target, daftar.map(bersih));
    laporan.diterapkan[nama] = daftar.length;
  }

  /* --- koleksi "config": merge ke objek tunggal --- */
  if (Array.isArray(K.config) && K.config.length) {
    const tujuan = CONFIG_TARGET(D);
    let n = 0;
    K.config.forEach(item => {
      const obj = tujuan[item.__id];
      if (!obj) return;
      const isi = bersih(item);
      // daftar produk diurus koleksi "produk", jangan ditimpa dari sini
      if (item.__id === 'produk') delete isi.daftar;
      Object.assign(obj, isi);
      n++;
    });
    if (n) laporan.diterapkan.config = n;
  }

  laporan.dipakai = Object.keys(laporan.diterapkan).length > 0;
  laporan.terbitTerakhir = j.terbitTerakhir || '';
  if (!laporan.dipakai) laporan.alasan = 'server terhubung, tetapi belum ada konten tersimpan';
  return laporan;
}

/** Penanda unik tiap item — dipakai editor admin & fungsi seed di server.
 *  Rumusnya harus SAMA PERSIS dengan kontenSeed_() di backend/Code.gs,
 *  supaya item yang sama tidak tersalin dua kali. */
function idDari(item, i) {
  const asal = item.slug || item.id || item.name || item.label || item.title || item.nama || ('item-' + (i + 1));
  const id = String(asal).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return id || ('item-' + (i + 1));
}

/** Bentuk data bawaan untuk tombol "Isi dari data situs" di admin. */
function bawaan(D) {
  const out = {};
  for (const nama of Object.keys(PETA)) {
    const arr = PETA[nama](D);
    if (!Array.isArray(arr)) continue;
    const pakai = new Set();
    out[nama] = arr.map((x, i) => {
      const item = bersih(x);
      let id = idDari(item, i);
      while (pakai.has(id)) id = id + '-' + (i + 1);   // jaga-jaga bila ada nama kembar
      pakai.add(id);
      item.__id = id;
      item.__urut = (i + 1) * 10;
      item.__aktif = true;
      return item;
    });
  }
  const t = CONFIG_TARGET(D);
  out.config = Object.keys(t).filter(k => t[k]).map(k => {
    const isi = Object.assign({}, t[k]);
    if (k === 'produk') delete isi.daftar;
    isi.__id = k;
    isi.__urut = 10;
    isi.__aktif = true;
    return isi;
  });
  return out;
}

module.exports = { muat, bawaan, idDari, PETA, KOLEKSI: Object.keys(PETA).concat('config') };
