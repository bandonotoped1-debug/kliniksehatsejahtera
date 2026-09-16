/* =============================================================
 * admin-konten.js — Editor konten situs (menu, layanan, dokter, dll.)
 * Perubahan disimpan di Apps Script, lalu tayang setelah tombol
 * "Terbitkan" menjalankan build ulang Netlify.
 * ============================================================= */
(function () {
  'use strict';
  var CFG = window.KLINIK || {};
  var DEMO = !CFG.gasUrl || CFG.gasUrl.indexOf('GANTI_DENGAN') > -1;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };

  /* ================================================= SKEMA ===== */
  /* type: teks | area | angka | pilih | centang | baris | pasangan | ikon */
  var IKON = ['stethoscope','tooth','shield-heart','pill','video','clock','shield','users','phone',
              'map-pin','mail','calendar','heart','route','building','file','lock','sparkles','check-circle','star'];

  var SKEMA = {
    nav: {
      judul: 'Menu Navigasi', tunggal: 'menu', ikon: 'route',
      ket: 'Urutan di sini menentukan urutan menu di bagian atas situs.',
      label: function (d) { return d.label; }, sub: function (d) { return d.href; },
      field: [
        { k: 'label', l: 'Nama menu', t: 'teks', wajib: true },
        { k: 'href', l: 'Alamat tujuan', t: 'teks', wajib: true, h: 'Contoh: /layanan.html atau /antrean.html' }
      ]
    },
    services: {
      judul: 'Layanan', tunggal: 'layanan', ikon: 'stethoscope',
      ket: 'Setiap layanan punya halaman sendiri. Menambah layanan akan membuat halaman baru setelah diterbitkan.',
      label: function (d) { return d.name; }, sub: function (d) { return d.short; },
      field: [
        { k: 'name', l: 'Nama layanan', t: 'teks', wajib: true },
        { k: 'slug', l: 'Alamat halaman (slug)', t: 'teks', wajib: true, h: 'Huruf kecil & tanda hubung. Contoh: poli-anak → /layanan/poli-anak.html' },
        { k: 'icon', l: 'Ikon', t: 'ikon' },
        { k: 'short', l: 'Deskripsi singkat', t: 'area', wajib: true, h: 'Tampil di kartu daftar layanan. 1–2 kalimat.' },
        { k: 'hook', l: 'Kalimat pemikat', t: 'teks', h: 'Satu kalimat pendek yang menarik perhatian.' },
        { k: 'hero', l: 'Judul halaman layanan', t: 'teks', wajib: true },
        { k: 'intro', l: 'Paragraf pembuka', t: 'area', wajib: true },
        { k: 'price', l: 'Perkiraan biaya', t: 'teks' },
        { k: 'duration', l: 'Perkiraan durasi', t: 'teks', h: 'Contoh: 15 – 25 menit' },
        { k: 'items', l: 'Cakupan layanan', t: 'pasangan', h: 'Satu baris satu poin. Format: Judul :: Penjelasan' },
        { k: 'prep', l: 'Persiapan sebelum datang', t: 'baris', h: 'Satu baris satu poin.' },
        { k: 'faq', l: 'Tanya jawab', t: 'pasangan', h: 'Satu baris satu tanya-jawab. Format: Pertanyaan :: Jawaban' },
        { k: 'tanpaDaftar', l: 'Layanan informasi saja (tanpa pendaftaran)', t: 'centang' },
        { k: 'tanpaBiaya', l: 'Sembunyikan perkiraan biaya', t: 'centang' }
      ]
    },
    doctors: {
      judul: 'Dokter', tunggal: 'dokter', ikon: 'users',
      ket: 'Jadwal di sini otomatis menyusun tabel jadwal praktik mingguan.',
      label: function (d) { return d.name; }, sub: function (d) { return d.role + ' · ' + (d.schedule || ''); },
      field: [
        { k: 'name', l: 'Nama dokter', t: 'teks', wajib: true, h: 'Lengkap dengan gelar. Contoh: dr. Wasingah' },
        { k: 'role', l: 'Jabatan', t: 'teks', wajib: true, h: 'Contoh: Dokter Umum · Penanggung Jawab Klinik' },
        { k: 'poli', l: 'Poli', t: 'pilih', opsi: ['Poli Umum', 'Poli Gigi'], wajib: true },
        { k: 'initials', l: 'Inisial', t: 'teks', h: 'Maksimal 2 huruf, tampil di lingkaran foto.' },
        { k: 'color', l: 'Warna kartu', t: 'pilih', opsi: ['a', 'b', 'c', 'd'] },
        { k: 'schedule', l: 'Ringkasan jadwal', t: 'teks', wajib: true, h: 'Tampil di kartu. Contoh: Senin – Kamis · 08.00–11.30' },
        { k: 'jadwal', l: 'Jadwal rinci', t: 'jadwal', h: 'Menyusun tabel mingguan. Satu baris satu sesi.' },
        { k: 'janji', l: 'Tampilkan tombol Buat Janji', t: 'centang' }
      ]
    },
    apoteker: {
      judul: 'Apoteker', tunggal: 'apoteker', ikon: 'pill',
      ket: 'Hanya menampilkan nama — tidak ada tombol janji temu, sesuai ketentuan klinik.',
      label: function (d) { return d.name; }, sub: function (d) { return d.role; },
      field: [
        { k: 'name', l: 'Nama apoteker', t: 'teks', wajib: true },
        { k: 'role', l: 'Jabatan', t: 'teks', wajib: true },
        { k: 'initials', l: 'Inisial', t: 'teks' },
        { k: 'color', l: 'Warna kartu', t: 'pilih', opsi: ['a', 'b', 'c', 'd'] },
        { k: 'ket', l: 'Keterangan', t: 'area' }
      ]
    },
    facilities: {
      judul: 'Fasilitas', tunggal: 'fasilitas', ikon: 'building',
      label: function (d) { return d.title; }, sub: function (d) { return d.text; },
      field: [
        { k: 'title', l: 'Nama fasilitas', t: 'teks', wajib: true },
        { k: 'text', l: 'Keterangan', t: 'area', wajib: true },
        { k: 'img', l: 'Berkas gambar', t: 'teks', h: 'Contoh: /assets/img/fasilitas/apotek.svg' }
      ]
    },
    partners: {
      judul: 'Rekanan', tunggal: 'rekanan', ikon: 'shield',
      label: function (d) { return d.name; }, sub: function (d) { return d.note; },
      field: [
        { k: 'name', l: 'Nama rekanan', t: 'teks', wajib: true },
        { k: 'note', l: 'Status kerja sama', t: 'teks', wajib: true },
        { k: 'ic', l: 'Ikon', t: 'ikon' }
      ]
    },
    pharmacies: {
      judul: 'Cabang Apotek', tunggal: 'cabang', ikon: 'pill',
      label: function (d) { return d.name; }, sub: function (d) { return d.address; },
      field: [
        { k: 'name', l: 'Nama cabang', t: 'teks', wajib: true },
        { k: 'slug', l: 'Slug', t: 'teks', wajib: true },
        { k: 'badge', l: 'Label', t: 'teks' },
        { k: 'area', l: 'Wilayah', t: 'teks' },
        { k: 'address', l: 'Alamat', t: 'area' },
        { k: 'maps', l: 'Tautan Google Maps', t: 'teks', cek: 'url',
          h: 'Buka Google Maps → cari cabangnya → Share/Bagikan → Copy link, lalu tempel di sini. Dipakai tombol "Peta". Kosongkan bila tombol Peta tidak perlu ditampilkan.' },
        { k: 'phone', l: 'Nomor WhatsApp', t: 'teks', h: 'Format internasional tanpa +. Contoh: 628123456789' },
        { k: 'hours', l: 'Jam buka', t: 'teks', h: 'Contoh: 07.00 – 21.00 (Senin – Minggu)' },
        { k: 'note', l: 'Catatan cabang', t: 'area', h: 'Kalimat di bawah jam buka. Contoh: Melayani penebusan resep dan alat kesehatan harian.' }
      ]
    },
    produk: {
      judul: 'Produk Herbal', tunggal: 'produk', ikon: 'sparkles',
      ket: 'Madu dan herbal yang dijual di Depo Farmasi Klinik.',
      label: function (d) { return d.nama; }, sub: function (d) { return d.ket; },
      field: [
        { k: 'nama', l: 'Nama produk', t: 'teks', wajib: true },
        { k: 'ket', l: 'Keterangan', t: 'area', wajib: true }
      ]
    },
    articles: {
      judul: 'Artikel', tunggal: 'artikel', ikon: 'file',
      ket: 'Setiap artikel punya halaman sendiri.',
      label: function (d) { return d.title; }, sub: function (d) { return d.category + ' · ' + (d.date || ''); },
      field: [
        { k: 'title', l: 'Judul artikel', t: 'teks', wajib: true },
        { k: 'slug', l: 'Alamat halaman (slug)', t: 'teks', wajib: true },
        { k: 'category', l: 'Kategori', t: 'teks', wajib: true },
        { k: 'date', l: 'Tanggal terbit', t: 'tanggal', wajib: true },
        { k: 'read', l: 'Lama baca', t: 'teks', h: 'Contoh: 4 menit' },
        { k: 'excerpt', l: 'Ringkasan', t: 'area', wajib: true },
        { k: 'body', l: 'Isi artikel', t: 'pasangan', h: 'Satu baris satu bagian. Format: Subjudul :: Isi paragraf' }
      ]
    },
    config: {
      judul: 'Info Klinik', tunggal: 'kelompok', ikon: 'file', kunci: true,
      ket: 'Pengaturan umum. Kelompok di sini sebaiknya diedit, bukan dihapus.',
      label: function (d) { return ({ klinik: 'Identitas & kontak klinik', teks: 'Teks halaman depan & profil',
        aminah: 'Kerja sama RSU Aminah', produk: 'Pengantar produk herbal', antrean: 'Pengaturan antrean' })[d.__id] || d.__id; },
      sub: function (d) { return d.siteName || d.nama || d.judul || d.heroJudul || ''; },
      field: null   // formulir bebas (lihat FIELD_CONFIG)
    }
  };

  var FIELD_CONFIG = {
    klinik: [
      { k: 'siteName', l: 'Nama klinik', t: 'teks' },
      { k: 'shortName', l: 'Nama pendek', t: 'teks' },
      { k: 'tagline', l: 'Tagline', t: 'teks' },
      { k: 'waNumber', l: 'Nomor WhatsApp utama', t: 'teks', h: 'Format internasional tanpa +. Contoh: 6289653502700' },
      { k: 'waDisplay', l: 'Nomor WhatsApp (tampilan)', t: 'teks' },
      { k: 'email', l: 'Email', t: 'teks' },
      /* Alamat berupa objek bersarang — dipakai footer, halaman Kontak,
         dan data schema.org (geo). Semua bagiannya diedit di satu blok. */
      { k: 'address', l: 'Alamat & titik peta klinik', t: 'grup',
        h: 'Dipakai di footer, halaman Kontak, dan data lokasi untuk Google.',
        sub: [
          { k: 'street', l: 'Jalan / perumahan', t: 'teks' },
          { k: 'district', l: 'Kecamatan', t: 'teks' },
          { k: 'city', l: 'Kota / kabupaten', t: 'teks' },
          { k: 'region', l: 'Provinsi', t: 'teks' },
          { k: 'postal', l: 'Kode pos', t: 'teks' },
          { k: 'mapsUrl', l: 'Tautan Google Maps', t: 'teks', cek: 'url',
            h: 'Tombol "Buka di Google Maps". Salin dari Google Maps → Share → Copy link.' },
          { k: 'lat', l: 'Lintang (latitude)', t: 'angka', cek: 'lintang',
            h: 'Contoh: -8.0846. Pakai titik, bukan koma.' },
          { k: 'lng', l: 'Bujur (longitude)', t: 'angka', cek: 'bujur',
            h: 'Contoh: 112.1770. Di Google Maps, klik kanan titik lokasi → angka pertama lintang, kedua bujur.' }
        ] },
      { k: 'jadwalHarian', l: 'Jam operasional', t: 'jam', h: 'Satu baris satu sesi.' }
    ],
    teks: [
      { k: 'heroJudul', l: 'Judul halaman depan', t: 'area', h: 'Boleh memakai <br> dan <span class="hl">…</span> untuk penanda warna.' },
      { k: 'heroSambutan', l: 'Teks sambutan', t: 'area', h: 'Boleh memakai <strong>…</strong>.' },
      { k: 'profilJudul', l: 'Judul halaman profil', t: 'teks' },
      { k: 'profilRingkas', l: 'Ringkasan profil', t: 'area' }
    ],
    aminah: [
      { k: 'nama', l: 'Nama rumah sakit', t: 'teks' },
      { k: 'status', l: 'Status kerja sama', t: 'teks' },
      { k: 'ringkas', l: 'Penjelasan singkat', t: 'area' },
      { k: 'catatanPlaceholder', l: 'Tandai angka masih contoh (kotak kuning)', t: 'centang' },
      { k: 'manfaat', l: 'Manfaat kerja sama', t: 'pasangan-tt', h: 'Format: Judul :: Penjelasan' },
      { k: 'syarat', l: 'Syarat & ketentuan', t: 'baris' }
    ],
    produk: [
      { k: 'judul', l: 'Judul blok produk', t: 'teks' },
      { k: 'ringkas', l: 'Pengantar', t: 'area' },
      { k: 'catatan', l: 'Catatan bawah', t: 'area' }
    ],
    antrean: [
      { k: 'pollDetik', l: 'Penyegaran papan antrean (detik)', t: 'angka', h: 'Minimal 8 detik.' },
      { k: 'poli', l: 'Poli yang memakai antrean', t: 'poli', h: 'Harus sama dengan ANTREAN_POLI di Apps Script.' },
      { k: 'banner', l: 'Banner promosi di papan antrean', t: 'banner' }
    ]
  };

  /* ================================================ STATE ====== */
  var K = { data: {}, koleksi: 'nav', perubahan: 0, terbitTerakhir: '', adaBuildHook: false, demo: DEMO };
  var DEMO_STORE = null;

  function kApi(aksi, payload) {
    if (DEMO) return kDemo(aksi, payload || {});
    return window.__adminApi(aksi, payload);
  }

  function kDemo(aksi, p) {
    if (!DEMO_STORE) DEMO_STORE = { konten: JSON.parse(JSON.stringify(window.KLINIK_BAWAAN || {})), perubahan: 0 };
    var S = DEMO_STORE;
    Object.keys(SKEMA).forEach(function (k) { if (!S.konten[k]) S.konten[k] = []; });

    if (aksi === 'kontenSimpan') {
      var arr = S.konten[p.koleksi] || (S.konten[p.koleksi] = []);
      var isi = JSON.parse(JSON.stringify(p.data));
      isi.__id = p.id; isi.__aktif = p.aktif !== false;
      var i = arr.findIndex(function (x) { return x.__id === (p.idLama || p.id); });
      if (i >= 0) { isi.__urut = arr[i].__urut; arr[i] = isi; }
      else { isi.__urut = (arr.length + 1) * 10; arr.push(isi); }
      S.perubahan++;
      return Promise.resolve({ ok: true, id: p.id, demo: true });
    }
    if (aksi === 'kontenHapus') {
      S.konten[p.koleksi] = (S.konten[p.koleksi] || []).filter(function (x) { return x.__id !== p.id; });
      S.perubahan++; return Promise.resolve({ ok: true, demo: true });
    }
    if (aksi === 'kontenUrut') {
      var a = S.konten[p.koleksi] || [];
      a.sort(function (x, y) { return p.urutan.indexOf(x.__id) - p.urutan.indexOf(y.__id); });
      a.forEach(function (x, i) { x.__urut = (i + 1) * 10; });
      S.perubahan++; return Promise.resolve({ ok: true, demo: true });
    }
    if (aksi === 'kontenTerbitkan') { S.perubahan = 0; return Promise.resolve({ ok: true, demo: true, terbitTerakhir: new Date().toISOString() }); }
    if (aksi === 'kontenSetHook') return Promise.resolve({ ok: true, demo: true, terpasang: !!p.url });
    return Promise.resolve({ ok: true, konten: S.konten, perubahan: S.perubahan,
      terbitTerakhir: S.terbitTerakhir || '', adaBuildHook: false, demo: true });
  }

  /* ================================================ MUAT ======= */
  window.kontenMuat = function () {
    return kApi('kontenAdmin', {}).then(function (r) {
      K.data = r.konten || {};
      K.perubahan = Number(r.perubahan) || 0;
      K.terbitTerakhir = r.terbitTerakhir || '';
      K.adaBuildHook = !!r.adaBuildHook;
      kGambar();
    }).catch(function (e) { kPesan('bad', 'Gagal memuat konten: ' + e.message); });
  };

  function kPesan(tipe, msg) {
    var b = $('#kt-status'); if (!b) return;
    b.className = 'fstatus show ' + tipe; b.innerHTML = '<div>' + msg + '</div>';
    clearTimeout(b._h); b._h = setTimeout(function () { b.className = 'fstatus'; }, 6000);
  }

  /* =============================================== GAMBAR ====== */
  function kGambar() {
    var tab = $('#kt-tabs');
    if (tab) {
      tab.innerHTML = Object.keys(SKEMA).map(function (k) {
        var n = (K.data[k] || []).length;
        return '<button data-kol="' + k + '"' + (k === K.koleksi ? ' class="on"' : '') + '>' +
          esc(SKEMA[k].judul) + ' <span class="n">' + n + '</span></button>';
      }).join('');
    }

    var sk = SKEMA[K.koleksi];
    var daftar = (K.data[K.koleksi] || []).slice();

    $('#kt-ket').innerHTML = sk.ket ? esc(sk.ket) : '';
    var tombolTambah = $('#kt-tambah');
    if (tombolTambah) {
      tombolTambah.hidden = !!sk.kunci;
      tombolTambah.textContent = '+ Tambah ' + sk.tunggal;
    }

    $('#kt-list').innerHTML = daftar.length
      ? daftar.map(function (d, i) {
          return '<div class="kt-r' + (d.__aktif === false ? ' mati' : '') + '" data-id="' + esc(d.__id) + '">' +
            '<div class="kt-urut">' +
              '<button data-naik="' + esc(d.__id) + '"' + (i === 0 ? ' disabled' : '') + ' title="Naikkan">↑</button>' +
              '<button data-turun="' + esc(d.__id) + '"' + (i === daftar.length - 1 ? ' disabled' : '') + ' title="Turunkan">↓</button>' +
            '</div>' +
            '<div class="kt-n"><b>' + esc(sk.label(d) || d.__id) + '</b><span>' + esc((sk.sub(d) || '').slice(0, 110)) + '</span></div>' +
            '<div class="kt-a">' +
              '<button data-edit="' + esc(d.__id) + '">Edit</button>' +
              (sk.kunci ? '' : '<button data-mati="' + esc(d.__id) + '">' + (d.__aktif === false ? 'Aktifkan' : 'Sembunyikan') + '</button>' +
                            '<button class="bahaya" data-hapus="' + esc(d.__id) + '">Hapus</button>') +
            '</div></div>';
        }).join('')
      : '<div class="kt-kosong">Belum ada ' + esc(sk.tunggal) + '. Tekan <strong>Isi dari data situs</strong> di atas untuk menyalin isi yang sekarang tayang, lalu edit sesuai kebutuhan.</div>';

    var bar = $('#kt-terbit');
    if (bar) {
      bar.className = 'kt-terbit' + (K.perubahan ? ' ada' : '');
      $('#kt-terbit-t').innerHTML = K.perubahan
        ? '<b>' + K.perubahan + ' perubahan belum tayang.</b> Tekan Terbitkan agar situs dibangun ulang.'
        : (K.terbitTerakhir ? 'Semua perubahan sudah tayang. Terbit terakhir: ' + esc(K.terbitTerakhir.replace('T', ' ').slice(0, 16)) + '.'
                            : 'Belum ada perubahan yang menunggu.');
    }
  }

  /* ============================================== FORMULIR ===== */
  var sedang = null;

  /** Isi bawaan situs untuk satu kelompok "Info Klinik" — dipakai sebagai
      isian awal bila kunci itu belum pernah tersimpan di CMS. */
  function bawaanConfig(id) {
    var b = window.KLINIK_BAWAAN || {};
    return (b.config || []).filter(function (x) { return x.__id === id; })[0] || {};
  }

  function fieldUntuk(kol, id) {
    if (kol === 'config') return FIELD_CONFIG[id] || [{ k: 'catatan', l: 'Data (JSON)', t: 'area' }];
    return SKEMA[kol].field;
  }

  function nilaiKe(t, v) {
    if (t === 'baris') return (v || []).join('\n');
    if (t === 'pasangan') return (v || []).map(function (x) { return (x[0] || '') + ' :: ' + (x[1] || ''); }).join('\n');
    if (t === 'pasangan-tt') return (v || []).map(function (x) { return (x.title || '') + ' :: ' + (x.text || ''); }).join('\n');
    if (t === 'jadwal') return (v || []).map(function (x) { return x.hari + ' :: ' + x.jam + ' :: ' + x.sesi; }).join('\n');
    if (t === 'jam') return (v || []).map(function (x) { return [x.sesi, x.jam, x.isi, x.ket, x.buka === false ? 'tutup' : 'buka'].join(' :: '); }).join('\n');
    if (t === 'poli') return (v || []).map(function (x) { return x.slug + ' :: ' + x.nama + ' :: ' + x.kode; }).join('\n');
    if (t === 'banner') return (v || []).map(function (x) { return [x.judul, x.teks, x.cta, x.href].join(' :: '); }).join('\n');
    return v == null ? '' : v;
  }

  function nilaiDari(t, s) {
    var baris = String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var pecah = function (b, n) { var p = b.split('::').map(function (x) { return x.trim(); }); while (p.length < n) p.push(''); return p; };
    if (t === 'baris') return baris;
    if (t === 'pasangan') return baris.map(function (b) { return pecah(b, 2).slice(0, 2); });
    if (t === 'pasangan-tt') return baris.map(function (b) { var p = pecah(b, 2); return { title: p[0], text: p[1] }; });
    if (t === 'jadwal') return baris.map(function (b) { var p = pecah(b, 3); return { hari: p[0], jam: p[1], sesi: (p[2] || 'pagi').toLowerCase() }; });
    if (t === 'jam') return baris.map(function (b) { var p = pecah(b, 5); return { sesi: p[0], jam: p[1], isi: p[2], ket: p[3], buka: String(p[4]).toLowerCase() !== 'tutup' }; });
    if (t === 'poli') return baris.map(function (b) { var p = pecah(b, 3); return { slug: p[0], nama: p[1], kode: p[2] }; });
    if (t === 'banner') return baris.map(function (b) { var p = pecah(b, 4); return { judul: p[0], teks: p[1], cta: p[2], href: p[3] }; });
    if (t === 'angka') return Number(s) || 0;
    return s;
  }

  function kBuka(id) {
    var sk = SKEMA[K.koleksi];
    var d = id ? (K.data[K.koleksi] || []).filter(function (x) { return x.__id === id; })[0] : null;
    var baru = !d;
    if (!d) d = {};
    /* Isi aslinya ikut disimpan: koleksi daftar ditimpa seluruhnya saat build,
       jadi kunci yang tidak punya kolom di formulir harus dibawa kembali —
       kalau tidak, ia lenyap begitu item disunting. */
    var asal = {};
    Object.keys(d).forEach(function (k) {
      if (k === '__id' || k === '__urut' || k === '__aktif') return;
      asal[k] = d[k];
    });
    sedang = { koleksi: K.koleksi, idLama: id || '', baru: baru, asal: asal };

    var fields = fieldUntuk(K.koleksi, id || '');
    var html = '<div class="kt-f"><label>ID item ' + (sk.kunci ? '' : '<span class="req">*</span>') + '</label>' +
      '<input id="f-__id" value="' + esc(id || '') + '"' + (sk.kunci || !baru ? ' readonly' : '') + ' placeholder="huruf-kecil-dan-tanda-hubung">' +
      '<span class="kt-h">' + (baru ? 'Dipakai sebagai penanda unik. Untuk layanan &amp; artikel, isi sama dengan slug.' : 'ID tidak bisa diubah setelah dibuat.') + '</span></div>';

    html += fields.map(function (f) {
      var v = nilaiKe(f.t, d[f.k]);
      var kb = 'f-' + f.k;
      var inti;

      /* Kolom bersarang (mis. alamat klinik): satu blok berisi beberapa isian.
         Bila item CMS belum punya kunci ini, isinya diambil dari data bawaan
         situs supaya admin tidak melihat kotak kosong padahal situs ada isinya. */
      if (f.t === 'grup') {
        var isi = (d[f.k] && typeof d[f.k] === 'object') ? d[f.k]
          : (K.koleksi === 'config' ? (bawaanConfig(id)[f.k] || {}) : {});
        var dalam = f.sub.map(function (sf) {
          var sid = kb + '__' + sf.k;
          var sv = isi[sf.k] == null ? '' : isi[sf.k];
          return '<div class="kt-f"><label for="' + sid + '">' + esc(sf.l) + '</label>' +
            '<input id="' + sid + '" value="' + esc(sv) + '">' +
            (sf.h ? '<span class="kt-h">' + sf.h + '</span>' : '') + '</div>';
        }).join('');
        return '<div class="kt-f full kt-grup"><label>' + esc(f.l) + '</label>' +
          (f.h ? '<span class="kt-h">' + f.h + '</span>' : '') +
          '<div class="kt-grup-in">' + dalam + '</div></div>';
      }

      if (f.t === 'centang') {
        inti = '<label class="kt-cek"><input type="checkbox" id="' + kb + '"' + (d[f.k] ? ' checked' : '') + '> <span>' + esc(f.l) + '</span></label>';
        return '<div class="kt-f full">' + inti + (f.h ? '<span class="kt-h">' + f.h + '</span>' : '') + '</div>';
      }
      if (f.t === 'pilih') inti = '<select id="' + kb + '">' + f.opsi.map(function (o) { return '<option' + (o === d[f.k] ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      else if (f.t === 'ikon') inti = '<select id="' + kb + '">' + IKON.map(function (o) { return '<option' + (o === d[f.k] ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      else if (f.t === 'angka') inti = '<input type="number" id="' + kb + '" value="' + esc(v) + '">';
      else if (f.t === 'tanggal') inti = '<input type="date" id="' + kb + '" value="' + esc(v) + '">';
      else if (f.t === 'teks') inti = '<input id="' + kb + '" value="' + esc(v) + '">';
      else inti = '<textarea id="' + kb + '" rows="' + (/baris|pasangan|jadwal|jam|poli|banner/.test(f.t) ? 6 : 3) + '">' + esc(v) + '</textarea>';

      var lebar = /area|baris|pasangan|jadwal|jam|poli|banner/.test(f.t) ? ' full' : '';
      return '<div class="kt-f' + lebar + '"><label for="' + kb + '">' + esc(f.l) + (f.wajib ? ' <span class="req">*</span>' : '') + '</label>' +
        inti + (f.h ? '<span class="kt-h">' + f.h + '</span>' : '') + '</div>';
    }).join('');

    $('#kt-modal-j').textContent = (baru ? 'Tambah ' : 'Edit ') + sk.tunggal;
    $('#kt-modal-b').innerHTML = html;
    $('#kt-modal-s').className = 'fstatus';
    $('#kt-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    var f1 = $('#kt-modal-b input, #kt-modal-b textarea'); if (f1) f1.focus();
  }

  function kTutup() { $('#kt-modal').hidden = true; document.body.style.overflow = ''; sedang = null; }

  function kSimpan() {
    if (!sedang) return;
    var kol = sedang.koleksi;
    var id = ($('#f-__id').value || '').trim().toLowerCase();
    var box = $('#kt-modal-s');

    if (!id) { box.className = 'fstatus show bad'; box.innerHTML = '<div>ID item wajib diisi.</div>'; return; }
    if (!/^[a-z0-9-]+$/.test(id)) {
      box.className = 'fstatus show bad';
      box.innerHTML = '<div>ID hanya boleh huruf kecil, angka, dan tanda hubung. Contoh: <strong>poli-anak</strong>.</div>'; return;
    }
    if (sedang.baru && (K.data[kol] || []).some(function (x) { return x.__id === id; })) {
      box.className = 'fstatus show bad'; box.innerHTML = '<div>ID <strong>' + esc(id) + '</strong> sudah dipakai di daftar ini.</div>'; return;
    }

    var fields = fieldUntuk(kol, sedang.idLama || id);
    /* Berangkat dari isi lama, lalu tiap kolom formulir menimpa atau
       menghapusnya. Kunci yang tidak punya kolom (mis. gambar, data
       lama) ikut terbawa utuh dan tidak hilang diam-diam. */
    var data = JSON.parse(JSON.stringify(sedang.asal || {}));
    var kurang = [], salah = [];

    var cekIsi = function (aturan, label, nilai) {
      if (!aturan || nilai === '') return true;
      if (aturan === 'url' && !/^https?:\/\//i.test(nilai)) {
        salah.push('<strong>' + esc(label) + '</strong> harus diawali https://'); return false;
      }
      if (aturan === 'lintang' || aturan === 'bujur') {
        var n = Number(nilai);
        var batas = aturan === 'lintang' ? 90 : 180;
        if (!isFinite(n) || Math.abs(n) > batas) {
          salah.push('<strong>' + esc(label) + '</strong> harus berupa angka (pakai titik, bukan koma)'); return false;
        }
      }
      return true;
    };

    fields.forEach(function (f) {
      /* Kolom bersarang: rakit kembali jadi satu objek. Bagian yang tidak
         punya isian (mis. kode negara) ikut terbawa dari isi lama. */
      if (f.t === 'grup') {
        var lama = (sedang.asal && typeof sedang.asal[f.k] === 'object' && sedang.asal[f.k]) || {};
        var obj = JSON.parse(JSON.stringify(lama));
        var adaIsi = false;
        f.sub.forEach(function (sf) {
          var sel = $('#f-' + f.k + '__' + sf.k); if (!sel) return;
          var raw = String(sel.value == null ? '' : sel.value).trim();
          if (!cekIsi(sf.cek, sf.l, raw)) return;
          if (raw === '') { delete obj[sf.k]; return; }
          obj[sf.k] = sf.t === 'angka' ? Number(raw) : raw;
          adaIsi = true;
        });
        /* Jangan pernah menulis objek kosong — itu akan menimpa data bawaan
           situs dengan kekosongan. Lebih baik kuncinya tidak ditulis. */
        if (adaIsi) data[f.k] = obj; else delete data[f.k];
        return;
      }

      var el = $('#f-' + f.k); if (!el) return;
      var v = f.t === 'centang' ? el.checked : nilaiDari(f.t, el.value);
      if (f.wajib && (v === '' || v == null)) kurang.push(f.l);
      if (f.cek && typeof v === 'string') cekIsi(f.cek, f.l, v.trim());
      if (f.t === 'centang') { if (v) data[f.k] = true; else delete data[f.k]; }
      else if (v !== '' && !(Array.isArray(v) && !v.length)) data[f.k] = v;
      else delete data[f.k];
    });

    if (kurang.length) {
      box.className = 'fstatus show bad';
      box.innerHTML = '<div>Masih kosong: <strong>' + esc(kurang.join(', ')) + '</strong>.</div>'; return;
    }
    if (salah.length) {
      box.className = 'fstatus show bad';
      box.innerHTML = '<div>' + salah.join('<br>') + '</div>'; return;
    }
    if ((kol === 'services' || kol === 'articles') && data.slug && data.slug !== id) {
      box.className = 'fstatus show bad';
      box.innerHTML = '<div>Slug (<strong>' + esc(data.slug) + '</strong>) harus sama dengan ID item (<strong>' + esc(id) + '</strong>).</div>'; return;
    }

    var btn = $('#kt-modal-simpan'); btn.disabled = true;
    box.className = 'fstatus show'; box.innerHTML = '<div>Menyimpan…</div>';

    kApi('kontenSimpan', { koleksi: kol, id: id, idLama: sedang.idLama, data: data })
      .then(function () { kTutup(); kPesan('ok', 'Tersimpan. Tekan <strong>Terbitkan</strong> agar tayang di situs.'); return window.kontenMuat(); })
      .catch(function (e) { box.className = 'fstatus show bad'; box.innerHTML = '<div>' + esc(e.message) + '</div>'; })
      .then(function () { btn.disabled = false; });
  }

  /* ============================================= INTERAKSI ===== */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;

    if (t.dataset.kol) { K.koleksi = t.dataset.kol; kGambar(); return; }
    if (t.dataset.edit !== undefined && t.dataset.edit) { kBuka(t.dataset.edit); return; }

    if (t.dataset.hapus) {
      var sk = SKEMA[K.koleksi];
      var it = (K.data[K.koleksi] || []).filter(function (x) { return x.__id === t.dataset.hapus; })[0] || {};
      var nm = sk.label(it) || t.dataset.hapus;
      var extra = K.koleksi === 'services' || K.koleksi === 'articles'
        ? '\n\nHalamannya di situs juga akan hilang setelah diterbitkan.' : '';
      if (!confirm('Hapus "' + nm + '"?' + extra + '\n\nTindakan ini tidak bisa dibatalkan.')) return;
      t.disabled = true;
      kApi('kontenHapus', { koleksi: K.koleksi, id: t.dataset.hapus })
        .then(function () { kPesan('ok', 'Dihapus. Tekan <strong>Terbitkan</strong> agar perubahan tayang.'); return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', err.message); t.disabled = false; });
      return;
    }

    if (t.dataset.mati) {
      var it2 = (K.data[K.koleksi] || []).filter(function (x) { return x.__id === t.dataset.mati; })[0];
      if (!it2) return;
      var salin = JSON.parse(JSON.stringify(it2));
      delete salin.__id; delete salin.__urut; delete salin.__aktif;
      t.disabled = true;
      kApi('kontenSimpan', { koleksi: K.koleksi, id: it2.__id, data: salin, aktif: it2.__aktif === false })
        .then(function () { kPesan('ok', it2.__aktif === false ? 'Ditampilkan kembali.' : 'Disembunyikan dari situs.'); return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', err.message); t.disabled = false; });
      return;
    }

    if (t.dataset.naik || t.dataset.turun) {
      var naik = !!t.dataset.naik, id = t.dataset.naik || t.dataset.turun;
      var arr = (K.data[K.koleksi] || []).map(function (x) { return x.__id; });
      var i = arr.indexOf(id), j = naik ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= arr.length) return;
      arr[i] = arr[j]; arr[j] = id;
      kApi('kontenUrut', { koleksi: K.koleksi, urutan: arr })
        .then(function () { return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', err.message); });
      return;
    }

    if (t.id === 'kt-tambah') { kBuka(''); return; }
    if (t.id === 'kt-modal-batal' || t.id === 'kt-modal-x') { kTutup(); return; }
    if (t.id === 'kt-modal-simpan') { kSimpan(); return; }

    if (t.id === 'kt-seed') {
      if (!confirm('Salin seluruh isi situs yang sekarang tayang ke editor ini?\n\nItem yang sudah ada di editor tidak akan ditimpa.')) return;
      t.disabled = true;
      kApi('kontenSeed', { bawaan: window.KLINIK_BAWAAN || {} })
        .then(function (r) { kPesan('ok', (r.ditulis || 0) + ' item disalin' + (r.dilewati ? ', ' + r.dilewati + ' dilewati karena sudah ada' : '') + '.'); return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', err.message); })
        .then(function () { t.disabled = false; });
      return;
    }

    if (t.id === 'kt-terbitkan') {
      if (!confirm('Terbitkan sekarang?\n\nSitus akan dibangun ulang oleh Netlify. Perubahan biasanya tayang dalam 1–2 menit.')) return;
      t.disabled = true; t.textContent = 'Mengirim…';
      kApi('kontenTerbitkan', {})
        .then(function () { kPesan('ok', 'Permintaan terkirim. Situs sedang dibangun ulang — cek kembali 1–2 menit lagi.'); return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', esc(err.message)); })
        .then(function () { t.disabled = false; t.textContent = 'Terbitkan'; });
      return;
    }

    if (t.id === 'kt-hook-simpan') {
      var url = ($('#kt-hook').value || '').trim();
      t.disabled = true;
      kApi('kontenSetHook', { url: url })
        .then(function (r) { kPesan('ok', r.terpasang ? 'Build hook tersimpan.' : 'Build hook dikosongkan.'); return window.kontenMuat(); })
        .catch(function (err) { kPesan('bad', err.message); })
        .then(function () { t.disabled = false; });
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#kt-modal').hidden) kTutup();
  });
})();
