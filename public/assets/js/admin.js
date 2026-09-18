/* =============================================================
 * admin.js — Panel admin (SPA kecil, tanpa library)
 * Autentikasi dilakukan di sisi server (Google Apps Script).
 * Halaman ini hanya menyimpan token sesi berumur pendek.
 * ============================================================= */
(function () {
  'use strict';
  var CFG = window.KLINIK || {};
  var TKEY = 'klinik-admin-token';
  var DEMO = !CFG.gasUrl || CFG.gasUrl.indexOf('GANTI_DENGAN') > -1;
  var state = { token: null, user: '', akun: '', peran: 'super', akses: [], daftar: [], pesan: [] };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };

  /* Dibuka agar admin-konten.js bisa memakai sesi & endpoint yang sama */
  window.__adminApi = function (a, p) { return api(a, p); };

  /* --------------------------------------------------- API
   * Apps Script punya dua perilaku yang dulu membuat panel "menggantung":
   *   1. Permintaan pertama setelah lama menganggur bisa perlu belasan
   *      detik (cold start) — tanpa batas waktu, tombol diam selamanya.
   *   2. Bila deployment belum diperbarui / aksesnya bukan "Siapa saja",
   *      server membalas HALAMAN HTML, bukan JSON. r.json() lalu melempar
   *      "Unexpected token '<'" yang tidak berarti apa-apa bagi petugas.
   * Karena itu balasan dibaca sebagai teks dulu, diperiksa, lalu satu kali
   * dicoba ulang untuk kegagalan yang sifatnya sementara.
   * ------------------------------------------------------- */
  var BATAS_MS = 25000;                       // batas tunggu satu percobaan

  function sekaliApi(action, payload, batas) {
    var ctrl = null, jamPutus = null;
    var opsi = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: state.token, data: payload || {} })
    };
    if (window.AbortController) {
      ctrl = new AbortController();
      opsi.signal = ctrl.signal;
      jamPutus = setTimeout(function () { ctrl.abort(); }, batas || BATAS_MS);
    }
    return fetch(CFG.gasUrl, opsi)
      .then(function (r) { return r.text().then(function (t) { return { status: r.status, teks: t }; }); })
      .then(function (res) {
        var t = (res.teks || '').trim();
        if (/^<(!doctype|html)/i.test(t)) {
          var e = new Error('Server Apps Script membalas halaman web, bukan data. ' +
            'Biasanya karena deployment belum diterbitkan ulang (Deploy → Manage deployments → New version) ' +
            'atau aksesnya belum disetel "Anyone".');
          e.sementara = false; throw e;
        }
        var j;
        try { j = JSON.parse(t); }
        catch (x) {
          var e2 = new Error('Balasan server tidak bisa dibaca (status ' + res.status + ').');
          e2.sementara = res.status >= 500; throw e2;
        }
        if (!j || j.ok !== true) {
          var e3 = new Error((j && j.error) || 'Gagal memproses permintaan.');
          e3.sementara = false; throw e3;
        }
        return j;
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') {
          var e = new Error('Server lama membalas (lebih dari ' + Math.round((batas || BATAS_MS) / 1000) + ' detik).');
          e.sementara = true; throw e;
        }
        if (err && err.sementara === undefined) err.sementara = true;   // gangguan jaringan
        throw err;
      })
      .then(function (v) { if (jamPutus) clearTimeout(jamPutus); return v; },
            function (e) { if (jamPutus) clearTimeout(jamPutus); throw e; });
  }

  function api(action, payload, opsi) {
    if (DEMO) return demoApi(action, payload);
    var o = opsi || {};
    var batas = o.batas || BATAS_MS;
    return sekaliApi(action, payload, batas).catch(function (err) {
      if (!err || !err.sementara || o.sekali) throw err;
      if (o.saatUlang) { try { o.saatUlang(); } catch (x) {} }
      return sekaliApi(action, payload, batas);       // satu kali percobaan ulang
    });
  }

  /* ------------------------------------------- data contoh */
  function demoApi(action, p) {
    return new Promise(function (res, rej) {
      setTimeout(function () {
        if (action === 'login') {
          if (p.user === 'admin' && p.pass === 'demo') return res({ ok: true, token: 'demo-token', user: 'admin (demo)' });
          return rej(new Error('Mode demo: gunakan admin / demo'));
        }
        if (action === 'list') {
          var hari = new Date().toISOString().slice(0, 10);
          var kemarin = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
          return res({
            ok: true,
            daftar: [
              { id: 'R-001', ts: hari + 'T06:12:00', nama: 'Contoh Pasien A', umur: '34 tahun', alamat: 'Karangtengah, Sananwetan', keluhan: 'Gigi geraham berlubang dan nyeri.', hp: '628123456789', layanan: 'Poli Gigi', tanggal: hari, sesi: 'Sore/Malam (17.00–20.30)', status: 'Baru' },
              { id: 'R-002', ts: hari + 'T07:40:00', nama: 'Contoh Pasien B', umur: '58 tahun', alamat: 'Kepanjenkidul, Kota Blitar', keluhan: 'Kontrol tekanan darah rutin.', hp: '628987654321', layanan: 'Poli Umum', tanggal: hari, sesi: 'Pagi (06.00–11.30)', status: 'Konfirmasi' },
              { id: 'R-003', ts: kemarin + 'T18:05:00', nama: 'Contoh Pasien C', umur: '8 tahun', alamat: 'Nglegok, Kab. Blitar', keluhan: 'Rencana khitan.', hp: '628555111222', layanan: 'Pelayanan Khitan', tanggal: kemarin, sesi: 'Fleksibel — atur oleh admin', status: 'Selesai',
                tambahan: '{"Usia anak":"8 tahun","Metode yang diinginkan":"Klem"}' }
            ],
            pesan: [{ id: 'P-001', ts: hari + 'T09:00:00', nama: 'Contoh Pengirim', hp: '628111222333', subjek: 'Pertanyaan layanan', pesan: 'Apakah hari Minggu buka?' }],
            peran: 'super', akses: AKSES_DEMO_SEMUA.slice(), user: 'admin (demo)', akun: 'admin'
          });
        }
        if (action === 'adminDaftar') return res({ ok: true, akses: AKSES_DEMO_SEMUA.slice(), daftar: DEMO_AKUN.slice() });
        if (action === 'adminSimpan') return demoAkunSimpan(p, res, rej);
        if (action === 'adminHapus') return demoAkunHapus(p, res, rej);
        if (action === 'gantiSandi') {
          if (!p.baru || p.baru.length < 8) return rej(new Error('Kata sandi baru minimal 8 karakter.'));
          if (p.lama !== 'demo') return rej(new Error('Kata sandi lama salah.'));
          return res({ ok: true });
        }
        if (action === 'updateStatus') return res(demoUbahStatus(p || {}));
        res({ ok: true });
      }, 320);
    });
  }

  /* ---------------------------- akun contoh untuk mode demo ---- */
  var AKSES_DEMO_SEMUA = ['antrean', 'daftar', 'konten', 'pesan', 'rekap'];
  var DEMO_AKUN = [
    { user: 'admin', nama: 'Pemilik Klinik', peran: 'super', akses: AKSES_DEMO_SEMUA.slice(), aktif: true, dibuat: '2026-01-02' },
    { user: 'loket', nama: 'Petugas Loket', peran: 'admin', akses: ['antrean', 'daftar'], aktif: true, dibuat: '2026-03-14' }
  ];

  function demoAkunSimpan(p, res, rej) {
    var user = String(p.user || '').toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(user)) return rej(new Error('Nama pengguna hanya boleh huruf kecil, angka, titik, garis bawah, dan tanda hubung (3–30 karakter).'));
    var peran = p.peran === 'super' ? 'super' : 'admin';
    var akses = peran === 'super' ? AKSES_DEMO_SEMUA.slice() : (p.akses || []);
    if (peran !== 'super' && !akses.length) return rej(new Error('Pilih minimal satu bagian yang boleh diakses.'));
    var lama = DEMO_AKUN.filter(function (x) { return x.user === user; })[0];
    if (!lama && !p.sandi) return rej(new Error('Kata sandi wajib diisi saat membuat akun baru.'));
    if (p.sandi && p.sandi.length < 8) return rej(new Error('Kata sandi minimal 8 karakter.'));
    if (lama && lama.peran === 'super' && (peran !== 'super' || p.aktif === false)) {
      var lain = DEMO_AKUN.filter(function (x) { return x.peran === 'super' && x.aktif && x.user !== user; }).length;
      if (!lain) return rej(new Error('Ini satu-satunya super admin yang aktif. Angkat super admin lain lebih dulu.'));
    }
    var isi = { user: user, nama: p.nama || user, peran: peran, akses: akses,
                aktif: p.aktif !== false, dibuat: lama ? lama.dibuat : '2026-09-18' };
    if (lama) DEMO_AKUN[DEMO_AKUN.indexOf(lama)] = isi; else DEMO_AKUN.push(isi);
    return res({ ok: true, user: user, baru: !lama });
  }

  function demoAkunHapus(p, res, rej) {
    var user = String(p.user || '').toLowerCase();
    if (user === 'admin') return rej(new Error('Anda tidak bisa menghapus akun Anda sendiri.'));
    var a = DEMO_AKUN.filter(function (x) { return x.user === user; })[0];
    if (!a) return rej(new Error('Akun tidak ditemukan: ' + user));
    DEMO_AKUN.splice(DEMO_AKUN.indexOf(a), 1);
    return res({ ok: true, user: user });
  }

  /** Tiruan alur "Konfirmasi → masuk antrean" agar mode demo berperilaku
      sama persis dengan backend Apps Script. */
  function demoUbahStatus(p) {
    var id = p.id, st = p.status;
    var out = { ok: true, id: id, status: st, antrean: null };
    qaDemo('antreanAdmin', {});                       // pastikan papan demo sudah terisi
    var reg = state.daftar.filter(function (d) { return d.id === id; })[0];
    if (!reg) return out;

    if (st === 'Batal') {
      var n = 0;
      QA.antre.forEach(function (r) { if (r.regId === id && r.status !== 'batal') { r.status = 'batal'; n++; } });
      if (n) out.alasan = 'Nomor antrean pasien ini ikut dibatalkan.';
      return out;
    }
    if (st !== 'Konfirmasi') return out;

    var s = String(reg.layanan || '').toLowerCase();
    var cfg = QA.poli.filter(function (x) {
      return s === x.slug || s.indexOf(String(x.nama).toLowerCase()) > -1;
    })[0] || null;
    if (!cfg) { out.alasan = 'Layanan "' + reg.layanan + '" tidak memakai papan antrean. Status tetap diubah menjadi Konfirmasi.'; return out; }

    var hariIni = new Date().toISOString().slice(0, 10);
    if ((reg.tanggal || '').slice(0, 10) !== hariIni) {
      out.alasan = 'Jadwal kunjungan ' + reg.tanggal + ', bukan hari ini — belum dimasukkan ke papan antrean. Konfirmasi ulang pada hari kunjungan.';
      return out;
    }

    var ada = QA.antre.filter(function (r) { return r.regId === id && r.status !== 'batal'; })[0];
    if (ada) {
      out.sudahAda = true;
      out.alasan = 'Pasien ini sudah ada di papan antrean' + (ada.kode && ada.kode !== '—' ? ' dengan nomor ' + ada.kode : ' dan sedang menunggu nomor') + '.';
      return out;
    }

    var dapatNomor = QA.bukaOnline === true;
    var no = 0, kode = '—';
    if (dapatNomor) {
      no = QA.antre.filter(function (r) { return r.poli === cfg.slug && Number(r.no) > 0; }).length + 1;
      kode = cfg.kode + '-' + ('0' + no).slice(-2);
    }
    var baris = { id: 'd' + Date.now(), poli: cfg.slug, no: no, kode: kode, regId: id,
      nama: reg.nama, umur: reg.umur || '', alamat: reg.alamat || '', keluhan: reg.keluhan || '',
      hp: reg.hp || '', jenisKartu: reg.jenisKartu || '', noKartu: reg.noKartu || '',
      sumber: 'online', status: dapatNomor ? 'menunggu' : 'tunggu', panggil: 0 };
    QA.antre.push(baris);
    out.antrean = { masuk: true, id: baris.id, kode: kode, no: no, poli: cfg.slug,
                    poliNama: cfg.nama, menungguDibuka: !dapatNomor };
    return out;
  }

  /* ------------------------------------------------- LOGIN */
  var fLogin = $('#form-login');
  fLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    var box = $('#login-status'), btn = $('#btn-login');
    var user = $('#user').value.trim(), pass = $('#pass').value;
    if (!user || !pass) { show(box, 'bad', 'Nama pengguna dan kata sandi wajib diisi.'); return; }
    btn.disabled = true; btn.textContent = 'Memeriksa…';
    show(box, 'info', 'Menghubungi server…');
    api('login', { user: user, pass: pass }, {
      saatUlang: function () { show(box, 'info', 'Server sedang bangun dari tidur, mencoba sekali lagi…'); }
    }).then(function (r) {
      state.token = r.token; state.user = r.user || user;
      state.akun = r.akun || user;
      if (r.peran) state.peran = r.peran;
      if (r.akses) state.akses = r.akses;      // hak akses sudah ikut di balasan login
      simpanSesi();
      enter();
    }).catch(function (err) {
      show(box, 'bad', esc(err.message || 'Login gagal. Periksa kembali kredensial Anda.'));
    }).then(function () { btn.disabled = false; btn.textContent = 'Masuk'; });
  });

  function show(el, type, msg) {
    el.className = 'fstatus show ' + type;
    el.innerHTML = '<div>' + msg + '</div>';
  }

  /* Sesi disimpan lengkap dengan peran & hak akses supaya panel yang
     dimuat ulang (F5) langsung menampilkan menu yang benar — tidak
     sempat memperlihatkan tab yang sebenarnya tidak boleh dibuka. */
  var SKEY = 'klinik-admin-sesi';

  function simpanSesi() {
    try {
      sessionStorage.setItem(TKEY, state.token);
      sessionStorage.setItem(SKEY, JSON.stringify({
        user: state.user, akun: state.akun, peran: state.peran, akses: state.akses
      }));
    } catch (e) {}
  }

  /* Pilihan jenis kartu diambil dari konfigurasi situs agar formulir
     antrean tidak pernah berbeda dengan formulir pendaftaran online. */
  function isiJenisKartu() {
    var sel = $('#qa-jenis'); if (!sel) return;
    var daftar = CFG.jenisKartu || [];
    if (!daftar.length) return;                 // biarkan pilihan bawaan di HTML
    sel.innerHTML = daftar.map(function (k) {
      return '<option value="' + esc(k.v) + '">' + esc(k.l) + '</option>';
    }).join('');
  }

  function enter() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    isiJenisKartu();
    gambarSapaan();
    $('#who').textContent = state.user;
    $('#demo-note').hidden = !DEMO;
    /* Hak akses sudah diketahui dari balasan login, jadi menu kiri bisa
       langsung benar tanpa menunggu data pendaftaran selesai diambil. */
    terapkanAkses();
    load();
  }

  $('#logout').addEventListener('click', function () {
    state.token = null;
    try { sessionStorage.removeItem(TKEY); sessionStorage.removeItem(SKEY); } catch (e) {}
    location.reload();
  });
  $('#refresh').addEventListener('click', load);

  /* ------------------------------------ MENU & BAGIAN PANEL */
  var JUDUL = {
    antrean: ['Antrean Hari Ini', 'Papan antrean pasien hari ini'],
    daftar:  ['Pendaftaran', 'Pendaftar online yang masuk ke sistem'],
    konten:  ['Konten Situs', 'Isi halaman publik — terbit setelah ditekan Terbitkan'],
    pesan:   ['Pesan Masuk', 'Kiriman dari formulir kontak'],
    rekap:   ['Rekap & Ekspor', 'Ringkasan dan unduhan data'],
    pengguna: ['Pengguna Panel', 'Akun petugas dan hak aksesnya']
  };

  function tutupMenu() {
    var sb = $('#asb'), tirai = $('#asb-tirai');
    if (sb) sb.classList.remove('buka');
    if (tirai) tirai.hidden = true;
  }

  function bukaTab(nama) {
    $$('[data-tab]').forEach(function (x) { x.classList.toggle('on', x.dataset.tab === nama); });
    $$('.tabpane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === nama); });
    var j = JUDUL[nama];
    if (j) {
      var t = $('#atop-judul'), sub = $('#atop-sub');
      if (t) t.textContent = j[0];
      if (sub) sub.textContent = j[1];
    }
    /* Daftar akun baru diambil saat tabnya benar-benar dibuka, dan hanya
       sekali — supaya login tidak menunggu panggilan yang mungkin tak
       pernah dipakai. */
    if (nama === 'pengguna' && !PG.sudah) { PG.sudah = true; pgMuat(); }
    tutupMenu();                      // di layar kecil menu menutup sendiri
    var isi = $('.amain');
    if (isi && isi.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { bukaTab(b.dataset.tab); });
  });

  var burger = $('#aburger');
  if (burger) burger.addEventListener('click', function () {
    var sb = $('#asb'), tirai = $('#asb-tirai');
    var buka = !sb.classList.contains('buka');
    sb.classList.toggle('buka', buka);
    if (tirai) tirai.hidden = !buka;
  });
  ['#asb-tutup', '#asb-tirai'].forEach(function (sel) {
    var el = $(sel); if (el) el.addEventListener('click', tutupMenu);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupMenu(); });

  /* -------------------------------------- SAPAAN & TANGGAL */
  function waktuWIB(opsi) {
    try { return new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: 'Asia/Jakarta' }, opsi)).format(new Date()); }
    catch (e) { return new Intl.DateTimeFormat('id-ID', opsi).format(new Date()); }
  }

  function salam() {
    var jam = Number(waktuWIB({ hour: '2-digit', hour12: false }));
    return jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam';
  }

  function gambarSapaan() {
    var el = $('#salam');
    if (el) el.textContent = salam() + ', ' + (state.user || 'admin');
    var tgl = $('#ahead-tgl span');
    if (tgl) tgl.textContent = waktuWIB({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* Kabar tentang pemuatan data ditaruh di luar tabpane mana pun —
     dulu pesannya masuk ke panel Pendaftaran, jadi tak terlihat kalau
     petugas sedang membuka tab Antrean. */
  function pPesan(tipe, msg) {
    var b = $('#panel-status'); if (!b) return;
    b.className = 'fstatus show ' + tipe;
    b.innerHTML = '<div>' + msg + '</div>';
  }
  function pBersih() { var b = $('#panel-status'); if (b) b.className = 'fstatus'; }

  /* -------------------------------------------------- LOAD
   * Dulu satu kali muat berarti dua panggilan berurutan ke Apps Script
   * (list lalu adminDaftar), padahal daftar akun cuma dipakai di tab
   * Pengguna. Sekarang akun dimuat malas — saat tabnya dibuka. */
  function load() {
    var btn = $('#refresh');
    if (btn) { btn.disabled = true; btn.dataset.teks = btn.textContent; btn.textContent = 'Memuat…'; }
    pPesan('info', 'Memuat data dari server…');
    return api('list', null, {
      saatUlang: function () { pPesan('info', 'Server lambat membalas, mencoba sekali lagi…'); }
    }).then(function (r) {
      state.daftar = r.daftar || []; state.pesan = r.pesan || [];
      if (r.peran) state.peran = r.peran;
      if (r.akses) state.akses = r.akses;
      if (r.user) { state.user = r.user; $('#who').textContent = r.user; }
      if (r.akun) state.akun = r.akun;
      terapkanAkses();
      simpanSesi();
      fillFilters(); renderAll();
      pBersih();
    }).catch(function (err) {
      /* Token kedaluwarsa: tidak ada gunanya menawarkan "coba lagi" —
         langsung kembalikan ke layar masuk. */
      if (/sesi berakhir/i.test(err.message || '')) {
        try { sessionStorage.removeItem(TKEY); sessionStorage.removeItem(SKEY); } catch (x) {}
        state.token = null;
        pBersih();
        $('#app').hidden = true; $('#login').hidden = false;
        show($('#login-status'), 'bad', 'Sesi Anda sudah berakhir. Silakan masuk kembali.');
        return;
      }
      pPesan('bad', esc(err.message || 'Gagal memuat data.') +
        ' <button type="button" id="muat-ulang" class="btn btn-line" style="margin-left:10px;padding:6px 14px;font-size:13px">Coba lagi</button>');
      var ul = $('#muat-ulang'); if (ul) ul.addEventListener('click', load);
    }).then(function () {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.teks || 'Muat ulang'; }
    });
  }

  function fillFilters() {
    var sel = $('#f-layanan');
    var list = (CFG.services || []).slice();
    state.daftar.forEach(function (d) { if (list.indexOf(d.layanan) < 0) list.push(d.layanan); });
    sel.innerHTML = '<option value="">Semua layanan</option>' + list.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
  }

  ['#q', '#f-status', '#f-layanan', '#f-tanggal', '#f-lingkup'].forEach(function (s) {
    var el = $(s); if (el) el.addEventListener('input', renderDaftar);
  });

  /* ------------------------------------------------ RENDER */
  function renderAll() {
    try { renderKpi(); renderDaftar(); renderPesan(); renderRekap(); }
    catch (e) { console.error('render gagal:', e); }
    qaMuat();
    if (window.kontenMuat) window.kontenMuat();
  }

  function renderKpi() {
    var today = hariWIB();
    // set() aman terhadap kartu KPI yang dihapus dari HTML —
    // satu id hilang tidak boleh menghentikan seluruh render.
    var set = function (id, nilai) { var el = $(id); if (el) el.textContent = nilai; };
    var hariIni = state.daftar.filter(function (d) { return (d.tanggal || '').slice(0, 10) === today; }).length;
    var baru = state.daftar.filter(function (d) { return d.status === 'Baru'; }).length;
    set('#k-hari', hariIni);
    set('#k-baru', baru);
    set('#k-pesan', state.pesan.length);

    /* Lencana angka di menu kiri — kosong bila nol, supaya tidak jadi hiasan. */
    lencana('#n-daftar', baru);
    lencana('#n-pesan', state.pesan.length);

    var sub = $('#salam-sub');
    if (sub) {
      sub.textContent = baru
        ? 'Ada ' + baru + ' pendaftaran yang belum dikonfirmasi.'
        : (hariIni ? 'Semua pendaftaran hari ini sudah dikonfirmasi.' : 'Belum ada pendaftaran masuk hari ini.');
    }
    gambarSapaan();
  }

  function lencana(sel, n) {
    var el = $(sel); if (!el) return;
    el.textContent = n > 99 ? '99+' : (n || '');
    el.dataset.nol = n ? '0' : '1';
  }

  /* Tanggal hari ini menurut WIB — bukan menurut jam perangkat, supaya
     panel yang dibuka di HP dengan zona waktu lain tetap sama. */
  function hariWIB() {
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      return p.slice(0, 10);
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  /* Pendaftaran yang tanggal kunjungannya sudah lewat tidak ikut tampil
     pada tampilan bawaan — kecuali statusnya masih Baru/Konfirmasi, yang
     berarti petugas masih punya pekerjaan di baris itu. */
  var PERLU_TINDAKAN = ['Baru', 'Konfirmasi'];

  function lingkupCocok(d, mode, hari) {
    var tg = (d.tanggal || '').slice(0, 10);
    if (mode === 'semua') return true;
    if (!tg) return mode === 'aktif';         // tanpa tanggal: anggap masih aktif
    if (mode === 'hari') return tg === hari;
    if (mode === 'lewat') return tg < hari;
    return tg >= hari || PERLU_TINDAKAN.indexOf(d.status) > -1;   // 'aktif'
  }

  function filtered() {
    var q = ($('#q').value || '').toLowerCase();
    var st = $('#f-status').value, lay = $('#f-layanan').value, tg = $('#f-tanggal').value;
    var lk = $('#f-lingkup'), mode = lk ? lk.value : 'semua';
    var hari = hariWIB();
    return state.daftar.filter(function (d) {
      /* Filter tanggal manual selalu menang atas pilihan lingkup. */
      if (!tg && !lingkupCocok(d, mode, hari)) return false;
      if (st && d.status !== st) return false;
      if (lay && d.layanan !== lay) return false;
      if (tg && (d.tanggal || '').slice(0, 10) !== tg) return false;
      if (q && [d.nama, d.hp, d.alamat, d.keluhan, d.id].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return (b.ts || '').localeCompare(a.ts || ''); });
  }

  function jam(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d)) return esc(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + '<br><span style="color:var(--muted);font-size:12px">' +
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + '</span>';
  }


  /* Nomor kartu ditampilkan tersamar; klik untuk membuka nomor penuh
     agar tidak terbaca orang lain saat layar admin terlihat pasien. */
  function kartuSel(d) {
    // Huruf ikut dipertahankan — nomor rekam medis bisa berbentuk "RM-00123".
    var no = String(d.noKartu || '').replace(/[^A-Za-z0-9]/g, '');
    if (!no) return '<span style="color:var(--muted);font-size:12px">—</span>';
    var jenis = esc(d.jenisKartu || 'Kartu');
    return '<span style="font-size:12px;color:var(--muted)">' + jenis + '</span><br>' +
      '<button class="lihat-kartu" data-no="' + esc(no) + '" title="Klik untuk menampilkan nomor penuh" ' +
      'style="border:0;background:none;padding:0;font-family:var(--ff-h);font-weight:700;font-size:13px;' +
      'color:var(--ink-2);cursor:pointer;letter-spacing:.04em">•••• ' + esc(no.slice(-4)) + '</button>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.lihat-kartu'); if (!b) return;
    var buka = b.dataset.buka === '1';
    b.dataset.buka = buka ? '0' : '1';
    b.textContent = buka ? '•••• ' + b.dataset.no.slice(-4) : b.dataset.no;
    b.title = buka ? 'Klik untuk menampilkan nomor penuh' : 'Klik untuk menyembunyikan';
  });

  /* Jawaban pertanyaan tambahan per layanan disimpan sebagai JSON satu
     sel. Ditampilkan di bawah keluhan supaya petugas melihatnya tanpa
     membuka spreadsheet. */
  function tambahanSel(d) {
    var isi = d.tambahan;
    if (!isi) return '';
    if (typeof isi === 'string') { try { isi = JSON.parse(isi); } catch (e) { return ''; } }
    var kunci = Object.keys(isi || {});
    if (!kunci.length) return '';
    return '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);font-size:12.5px;line-height:1.55">' +
      kunci.map(function (k) {
        return '<span style="color:var(--muted)">' + esc(k) + ':</span> <b style="color:var(--ink-2);font-weight:600">' + esc(isi[k]) + '</b>';
      }).join('<br>') + '</div>';
  }

  function renderDaftar() {
    var rows = filtered();
    var kosong = $('#empty-daftar');
    kosong.hidden = rows.length > 0;
    if (!rows.length) {
      var lk = $('#f-lingkup');
      kosong.textContent = (lk && lk.value === 'aktif' && state.daftar.length)
        ? 'Tidak ada pendaftaran aktif. Pendaftaran yang tanggalnya sudah lewat disembunyikan — pilih "Sudah lewat" atau "Semua tanggal" untuk melihatnya.'
        : 'Belum ada pendaftaran yang cocok dengan filter.';
    }
    $('#tb-daftar').innerHTML = rows.map(function (d) {
      var wa = 'https://wa.me/' + String(d.hp || '').replace(/\D/g, '') +
        '?text=' + encodeURIComponent('Halo ' + d.nama + ', pendaftaran Anda di Klinik Pratama Sehat Sejahtera untuk layanan ' + d.layanan + ' pada ' + d.tanggal + ' telah kami terima. Nomor antrean Anda: ');
      /* data-l dipakai CSS untuk mengubah tabel jadi kartu di layar kecil */
      return '<tr>' +
        '<td data-l="Waktu">' + jam(d.ts) + '</td>' +
        '<td data-l="Pasien"><b style="color:var(--ink)">' + esc(d.nama) + '</b><br><span style="color:var(--muted);font-size:12px">' + esc(d.umur || '') + ' · ' + esc(d.id || '') + '</span></td>' +
        '<td data-l="Alamat" style="max-width:190px">' + esc(d.alamat || '-') + '</td>' +
        '<td data-l="Kontak"><a href="' + wa + '" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600">' + esc(d.hp) + '</a></td>' +
        '<td data-l="Kartu" style="white-space:nowrap">' + kartuSel(d) + '</td>' +
        '<td data-l="Layanan">' + esc(d.layanan) + '</td>' +
        '<td data-l="Jadwal">' + esc(d.tanggal) + '<br><span style="color:var(--muted);font-size:12px">' + esc(d.sesi || '') + '</span></td>' +
        '<td data-l="Keluhan" style="max-width:240px">' + esc(d.keluhan) + tambahanSel(d) + '</td>' +
        '<td data-l="Status"><span class="pill p-' + esc((d.status || 'baru').toLowerCase()) + '">' + esc(d.status || 'Baru') + '</span></td>' +
        '<td data-l="Aksi"><div class="act">' +
          '<button data-set="Konfirmasi" data-id="' + esc(d.id) + '">Konfirmasi</button>' +
          '<button data-set="Selesai" data-id="' + esc(d.id) + '">Selesai</button>' +
          '<button data-set="Batal" data-id="' + esc(d.id) + '">Batal</button>' +
        '</div></td></tr>';
    }).join('');
  }

  /* Pesan di tab Pendaftaran (mis. alasan pasien belum bisa masuk antrean). */
  function dPesan(tipe, msg, tetap) {
    var b = $('#daftar-status'); if (!b) return;
    b.className = 'fstatus show ' + tipe; b.innerHTML = '<div>' + msg + '</div>';
    clearTimeout(b._h);
    /* Pesan gagal memuat menyimpan tombol "Coba lagi" — jangan dihapus sendiri. */
    if (!tetap) b._h = setTimeout(function () { b.className = 'fstatus'; }, 7000);
  }

  /* Konfirmasi bukan sekadar mengganti status: pasien langsung masuk papan
     antrean hari ini (sebagai pasien online, jadi aturan "offline dulu"
     tetap berlaku) lalu tampilan berpindah ke tab Antrean. */
  $('#tb-daftar').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-set]'); if (!b) return;
    var id = b.dataset.id, st = b.dataset.set;
    b.disabled = true;
    api('updateStatus', { id: id, status: st }).then(function (r) {
      var row = state.daftar.find(function (d) { return d.id === id; });
      if (row) row.status = st;
      renderKpi(); renderDaftar();

      var a = r && r.antrean, masuk = !!(a && a.masuk !== false);
      if (masuk) QA.sorot = a.id || '';

      /* Papan antrean ikut berubah saat pasien masuk (Konfirmasi) maupun
         saat nomornya dicabut (Batal) — muat ulang supaya tidak basi. */
      var segar = (masuk || st === 'Batal') ? qaMuat() : Promise.resolve();
      return segar.then(function () {
        if (masuk) {
          bukaTab('antrean');
          qaPesan('ok', a.menungguDibuka
            ? '<strong>' + esc(row ? row.nama : 'Pasien') + '</strong> masuk daftar tunggu ' + esc(a.poliNama || '') +
              '. Nomornya keluar setelah tombol <strong>Buka Antrean Online</strong> ditekan.'
            : '<strong>' + esc(row ? row.nama : 'Pasien') + '</strong> masuk antrean ' + esc(a.poliNama || '') +
              ' dengan nomor <strong>' + esc(a.kode || '') + '</strong>.');
          return;
        }
        if (r && r.alasan) dPesan(r.sudahAda ? 'ok' : 'bad', esc(r.alasan));
        else if (st !== 'Konfirmasi') dPesan('ok', 'Status diubah menjadi <strong>' + esc(st) + '</strong>.');
      });
    }).catch(function (err) {
      dPesan('bad', 'Gagal memperbarui: ' + esc(err.message));
      b.disabled = false;
    });
  });


  /* =============================================== ANTREAN === */
  var QA = { tanggal: '', bukaOnline: false, poli: [], antre: [], izin: {}, maksPanggil: 3, lewatiN: 2 };
  var LABEL = { menunggu: 'Menunggu', dipanggil: 'Dipanggil', dilayani: 'Ditangani',
                selesai: 'Selesai', terlewat: 'Tidak hadir', tunggu: 'Menunggu antrean dibuka' };

  function qaDemo(aksi, p) {
    QA.demo = true;
    if (!QA.poli.length) {
      QA.poli = (CFG.antrean && CFG.antrean.poli) || [{ slug: 'poli-umum', nama: 'Poli Umum', kode: 'U' }];
      QA.tanggal = new Date().toISOString().slice(0, 10);
      QA.antre = [
        { id: 'd1', poli: QA.poli[0].slug, no: 1, kode: QA.poli[0].kode + '-01', nama: 'Contoh Datang Langsung A', hp: '628111', sumber: 'offline', status: 'menunggu', panggil: 0 },
        { id: 'd2', poli: QA.poli[0].slug, no: 2, kode: QA.poli[0].kode + '-02', nama: 'Contoh Datang Langsung B', hp: '628222', sumber: 'offline', status: 'menunggu', panggil: 0 },
        { id: 'd3', poli: QA.poli[0].slug, no: 3, kode: QA.poli[0].kode + '-03', nama: 'Contoh Datang Langsung C', hp: '', sumber: 'offline', status: 'menunggu', panggil: 0 },
        { id: 'd4', poli: QA.poli[1] ? QA.poli[1].slug : QA.poli[0].slug, no: 1, kode: (QA.poli[1] || QA.poli[0]).kode + '-01', nama: 'Contoh Pasien Gigi', hp: '628444', sumber: 'offline', status: 'menunggu', panggil: 0 }
      ];
    }
    if (aksi === 'izinSet') {
      QA.izin = QA.izin || {};
      if (!QA.izin[p.poli]) QA.izin[p.poli] = {};
      if (p.izin !== false) QA.izin[p.poli][p.sesi] = true;
      else delete QA.izin[p.poli][p.sesi];
      return Promise.resolve({ ok: true, izin: QA.izin, demo: true });
    }
    if (aksi === 'antreanBuka') QA.bukaOnline = !!p.buka;
    if (aksi === 'antreanReset') { QA.antre = []; QA.bukaOnline = false; }
    if (aksi === 'antreanTambah') {
      var cfg = QA.poli.filter(function (x) { return x.slug === p.poli; })[0] || QA.poli[0];
      var n = QA.antre.filter(function (r) { return r.poli === cfg.slug && Number(r.no) > 0; }).length + 1;
      var kd = cfg.kode + '-' + ('0' + n).slice(-2);
      var idBaru = 'd' + Date.now();
      QA.antre.push({ id: idBaru, poli: cfg.slug, no: n, kode: kd,
        nama: p.nama, umur: p.umur || '', alamat: p.alamat || '', keluhan: p.keluhan || '',
        hp: p.hp || '', jenisKartu: p.jenisKartu || '', noKartu: p.noKartu || '',
        sumber: 'offline', status: 'menunggu', panggil: 0, regId: '' });
      return Promise.resolve({ ok: true, id: idBaru, kode: kd, no: n, poli: cfg.slug, demo: true });
    }
    if (aksi === 'antreanAksi') {
      var row = QA.antre.filter(function (r) { return r.id === p.id; })[0];
      if (p.aksi === 'panggil' && !row) {
        row = QA.antre.filter(function (r) { return r.poli === p.poli && r.status === 'dipanggil'; })[0] ||
              QA.antre.filter(function (r) { return r.poli === p.poli && r.status === 'menunggu'; })[0];
      }
      if (row) {
        if (p.aksi === 'panggil') {
          row.panggil = (row.status === 'terlewat' ? 0 : row.panggil) + 1;
          var habis = row.panggil >= QA.maksPanggil;
          row.status = habis ? 'terlewat' : 'dipanggil';
          return Promise.resolve(habis
            ? { ok: true, id: row.id, kode: row.kode, status: 'terlewat', panggil: row.panggil, otomatisTerlewat: true, akanKembali: true, demo: true }
            : { ok: true, id: row.id, kode: row.kode, nama: row.nama, status: 'dipanggil', panggil: row.panggil, sisaPanggil: QA.maksPanggil - row.panggil, demo: true });
        }
        else if (p.aksi === 'mulai') row.status = 'dilayani';
        else if (p.aksi === 'selesai') row.status = 'selesai';
        else if (p.aksi === 'lewati') row.status = 'terlewat';
        else if (p.aksi === 'kembalikan') { row.status = 'menunggu'; row.panggil = 0; }
        else if (p.aksi === 'batal') row.status = 'batal';
        if (p.aksi === 'ingatkan') return Promise.resolve({ ok: true, id: row.id, terkirim: true, sisa: 0, demo: true });
      }
    }
    return Promise.resolve({ ok: true, tanggal: QA.tanggal, bukaOnline: QA.bukaOnline,
      poli: QA.poli, antre: QA.antre, izin: QA.izin || {}, maksPanggil: 3, lewatiN: 2, demo: true });
  }

  function qaApi(aksi, payload) {
    if (DEMO) return qaDemo(aksi, payload || {});
    return api(aksi, payload);
  }

  function qaMuat() {
    if (!bolehLihat('antrean')) return Promise.resolve();
    return qaApi('antreanAdmin', {}).then(function (r) {
      QA.tanggal = r.tanggal; QA.bukaOnline = !!r.bukaOnline;
      QA.poli = r.poli || QA.poli; QA.antre = r.antre || [];
      QA.maksPanggil = r.maksPanggil || 3; QA.lewatiN = r.lewatiN || 2;
      QA.izin = r.izin || {};
      qaGambar(); izinGambar();
      var nunggu = QA.antre.filter(function (r2) { return r2.status === 'menunggu' || r2.status === 'tunggu'; }).length;
      var kAntre = $('#k-antre'); if (kAntre) kAntre.textContent = nunggu;
      lencana('#n-antrean', nunggu);
    }).catch(function (e) { qaPesan('bad', 'Gagal memuat antrean: ' + e.message); });
  }

  function qaPesan(tipe, msg) {
    var b = $('#qa-status'); if (!b) return;
    b.className = 'fstatus show ' + tipe; b.innerHTML = '<div>' + msg + '</div>';
    clearTimeout(b._h); b._h = setTimeout(function () { b.className = 'fstatus'; }, 5000);
  }

  function qaGambar() {
    var tgl = $('#qa-tgl'); if (tgl) tgl.textContent = QA.tanggal ? '· ' + QA.tanggal : '';
    var flag = $('#qa-flag'), tg = $('#qa-toggle');
    if (flag) {
      flag.className = 'qa-flag ' + (QA.bukaOnline ? 'on' : 'off');
      flag.textContent = QA.bukaOnline ? 'Antrean online terbuka' : 'Antrean online tertutup';
    }
    if (tg) {
      tg.className = QA.bukaOnline ? 'tutup' : 'buka';
      tg.textContent = QA.bukaOnline ? 'Tutup Antrean Online' : 'Buka Antrean Online';
    }

    var sel = $('#qa-poli');
    if (sel && sel.options.length !== QA.poli.length) {
      sel.innerHTML = QA.poli.map(function (p) { return '<option value="' + esc(p.slug) + '">' + esc(p.nama) + '</option>'; }).join('');
    }

    $('#qa-grid').innerHTML = QA.poli.map(function (p) {
      var isi = QA.antre.filter(function (r) { return r.poli === p.slug && r.status !== 'batal'; })
        .sort(function (a, b) { return (Number(a.no) || 999) - (Number(b.no) || 999); });
      var aktif = isi.filter(function (r) { return r.status === 'dipanggil' || r.status === 'dilayani'; })[0];
      var nunggu = isi.filter(function (r) { return r.status === 'menunggu'; }).length;

      var kepala = '<div class="qa-h"><b>' + esc(p.nama) + '</b><small>' + nunggu + ' menunggu · ' + isi.length + ' total</small></div>';

      var blokAktif = '<div class="qa-aktif">' + (aktif
        ? '<div class="no">' + esc(aktif.kode) +
          (aktif.panggil ? '<span class="pc">panggilan ke-' + aktif.panggil + ' dari ' + QA.maksPanggil + '</span>' : '') + '</div>' +
          '<div class="nm">' + esc(aktif.nama) + (aktif.umur ? ' · ' + esc(aktif.umur) : '') + '</div>' +
          '<div class="qa-btns">' +
            '<button class="pri" data-qa="panggil" data-poli="' + esc(p.slug) + '" data-id="' + esc(aktif.id) + '">Panggil lagi</button>' +
            '<button data-qa="mulai" data-poli="' + esc(p.slug) + '" data-id="' + esc(aktif.id) + '">Mulai layani</button>' +
            '<button data-qa="selesai" data-poli="' + esc(p.slug) + '" data-id="' + esc(aktif.id) + '">Selesai</button>' +
            '<button data-qa="lewati" data-poli="' + esc(p.slug) + '" data-id="' + esc(aktif.id) + '">Tidak hadir</button>' +
            (aktif.hp ? '<button data-qa="ingatkan" data-poli="' + esc(p.slug) + '" data-id="' + esc(aktif.id) + '">Ingatkan WA</button>' : '') +
          '</div>'
        : '<div class="nm" style="margin:0 0 9px">Belum ada pasien yang dipanggil.</div>' +
          '<div class="qa-btns"><button class="pri" data-qa="panggil" data-poli="' + esc(p.slug) + '">Panggil berikutnya</button></div>'
      ) + '</div>';

      var baris = isi.length
        ? '<div class="qa-rows">' + isi.map(function (r) {
            return '<div class="qa-r ' + esc(r.status) + (QA.sorot && r.id === QA.sorot ? ' sorot' : '') + '">' +
              '<span class="k">' + esc(r.kode || '—') + '</span>' +
              '<span class="n">' + esc(r.nama) + '</span>' +
              '<span class="src ' + esc(r.sumber) + '">' + (r.sumber === 'online' ? 'online' : 'langsung') + '</span>' +
              '<span style="font-size:11.5px;color:var(--muted);min-width:86px;text-align:right">' + esc(LABEL[r.status] || r.status) + '</span>' +
              '<span class="qa-btns">' +
                (r.status === 'terlewat' ? '<button data-qa="kembalikan" data-poli="' + esc(p.slug) + '" data-id="' + esc(r.id) + '">Kembalikan</button>' : '') +
                (r.status === 'menunggu' ? '<button data-qa="panggil" data-poli="' + esc(p.slug) + '" data-id="' + esc(r.id) + '">Panggil</button>' : '') +
                (r.hp ? '<button data-qa="ingatkan" data-poli="' + esc(p.slug) + '" data-id="' + esc(r.id) + '">WA</button>' : '') +
              '</span></div>';
          }).join('') + '</div>'
        : '<div class="qa-kosong">Belum ada pasien di poli ini.</div>';

      return '<div class="qa-col">' + kepala + blokAktif + baris + '</div>';
    }).join('');

    /* Sorotan baris baru hanya untuk sekali gambar, lalu luruh sendiri. */
    if (QA.sorot) {
      var el = $('#qa-grid .qa-r.sorot');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      clearTimeout(QA._sorotH);
      QA._sorotH = setTimeout(function () {
        QA.sorot = '';
        $$('#qa-grid .qa-r.sorot').forEach(function (x) { x.classList.remove('sorot'); });
      }, 8000);
    }
  }

  /* ------------------------------------------- DOKTER IZIN */
  /* Mematikan satu sesi poli untuk hari ini. Halaman publik membacanya
     lewat ?action=status, jadi efeknya langsung tanpa build ulang. */
  var SESI_IZIN = [{ kunci: 'pagi', nama: 'pagi' }, { kunci: 'malam', nama: 'malam' }];

  function izinGambar() {
    var kotak = $('#qa-izin-sw'); if (!kotak) return;
    kotak.innerHTML = QA.poli.map(function (p) {
      return SESI_IZIN.map(function (s) {
        var izin = !!((QA.izin || {})[p.slug] || {})[s.kunci];
        return '<button data-izin-poli="' + esc(p.slug) + '" data-izin-sesi="' + esc(s.kunci) + '"' +
          (izin ? ' class="izin"' : '') + ' title="' + (izin ? 'Klik untuk membuka kembali' : 'Klik bila dokter izin') + '">' +
          '<span class="s"></span>' + esc(p.nama) + ' ' + esc(s.nama) +
          ' · ' + (izin ? 'izin' : 'ada') + '</button>';
      }).join('');
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-izin-poli]'); if (!b) return;
    var poli = b.dataset.izinPoli, sesi = b.dataset.izinSesi;
    var kini = !!((QA.izin || {})[poli] || {})[sesi];
    b.disabled = true;
    qaApi('izinSet', { poli: poli, sesi: sesi, izin: !kini }).then(function (r) {
      QA.izin = r.izin || QA.izin;
      izinGambar();
      var nama = (QA.poli.filter(function (p) { return p.slug === poli; })[0] || {}).nama || poli;
      qaPesan('ok', kini
        ? '<strong>' + esc(nama) + '</strong> sesi ' + esc(sesi) + ' dibuka kembali.'
        : '<strong>' + esc(nama) + '</strong> sesi ' + esc(sesi) + ' ditutup hari ini — beranda dan papan antrean publik ikut berubah.');
    }).catch(function (err) { qaPesan('bad', err.message); })
      .then(function () { b.disabled = false; });
  });

  /* --------------------------------------------- interaksi */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-qa]'); if (!b) return;
    b.disabled = true;
    qaApi('antreanAksi', { aksi: b.dataset.qa, poli: b.dataset.poli, id: b.dataset.id || '' })
      .then(function (r) {
        if (r && r.kosong) qaPesan('bad', r.pesan || 'Tidak ada pasien yang menunggu.');
        else if (r && r.otomatisTerlewat) {
          qaPesan('bad', 'Nomor ' + esc(r.kode) + ' dipanggil ' + QA.maksPanggil + 'x tanpa respons — ditandai tidak hadir' +
            (r.akanKembali === false ? '. Putaran habis, kembalikan manual bila pasien datang.' : ' dan akan dipanggil lagi setelah ' + QA.lewatiN + ' pasien.'));
        }
        else if (r && r.terkirim) qaPesan('ok', 'Pengingat WhatsApp terkirim.');
        else if (r && r.sisaPanggil !== undefined) qaPesan('ok', 'Memanggil ' + esc(r.kode || '') + ' — sisa ' + r.sisaPanggil + ' panggilan.');
        return qaMuat();
      })
      .catch(function (err) { qaPesan('bad', err.message); })
      .then(function () { b.disabled = false; });
  });

  var qaT = $('#qa-toggle');
  if (qaT) qaT.addEventListener('click', function () {
    var mau = !QA.bukaOnline;
    if (mau && !confirm('Buka antrean online sekarang?\n\nSemua pendaftar online yang menunggu akan langsung mendapat nomor, mengantre di belakang pasien yang sudah tercatat.')) return;
    qaT.disabled = true;
    qaApi('antreanBuka', { buka: mau }).then(function (r) {
      qaPesan('ok', mau ? 'Antrean online dibuka. ' + (r.diberiNomor || 0) + ' nomor diberikan.' : 'Antrean online ditutup.');
      return qaMuat();
    }).catch(function (e) { qaPesan('bad', e.message); }).then(function () { qaT.disabled = false; });
  });

  var qaR = $('#qa-reset');
  if (qaR) qaR.addEventListener('click', function () {
    if (!confirm('Kosongkan seluruh papan antrean hari ini?\n\nTindakan ini tidak bisa dibatalkan.')) return;
    qaApi('antreanReset', {}).then(function () { qaPesan('ok', 'Papan antrean dikosongkan.'); return qaMuat(); })
      .catch(function (e) { qaPesan('bad', e.message); });
  });

  /* Kolomnya sengaja disamakan dengan formulir pendaftaran online supaya
     data pasien datang langsung sama lengkapnya dengan pendaftar online. */
  var qaAdd = $('#qa-tambah'), qaForm = $('#qa-form');
  var QA_ISIAN = ['#qa-nama', '#qa-umur', '#qa-hp', '#qa-nik', '#qa-alamat', '#qa-keluhan'];
  var nilai = function (s) { var el = $(s); return el ? (el.value || '').trim() : ''; };

  /* Nomor rekam medis boleh berhuruf dan pendek; kartu lain tetap
     angka saja. Menyaring semuanya jadi digit akan membuang isian. */
  function bersihKartu(jenis, no) {
    var k = (CFG.jenisKartu || []).filter(function (x) { return x.v === jenis; })[0];
    return (k && k.format === 'bebas')
      ? String(no).replace(/[^A-Za-z0-9 .\/-]/g, '').slice(0, 30)
      : String(no).replace(/[^0-9]/g, '').slice(0, 20);
  }

  if (qaForm) qaForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var nama = nilai('#qa-nama');
    if (!nama) { qaPesan('bad', 'Nama pasien wajib diisi.'); $('#qa-nama').focus(); return; }
    qaAdd.disabled = true;
    qaApi('antreanTambah', {
      poli: $('#qa-poli').value,
      nama: nama,
      umur: nilai('#qa-umur'),
      hp: nilai('#qa-hp'),
      alamat: nilai('#qa-alamat'),
      keluhan: nilai('#qa-keluhan'),
      jenisKartu: nilai('#qa-jenis') || 'KTP',
      noKartu: bersihKartu(nilai('#qa-jenis'), nilai('#qa-nik')),
      sumber: 'offline'
    }).then(function (r) {
      QA.sorot = r.id || '';
      qaPesan('ok', '<strong>' + esc(nama) + '</strong> masuk antrean dengan nomor <strong>' + esc(r.kode || '') + '</strong>.');
      QA_ISIAN.forEach(function (s) { var el = $(s); if (el) el.value = ''; });
      $('#qa-nama').focus();
      return qaMuat();
    }).catch(function (e) { qaPesan('bad', e.message); }).then(function () { qaAdd.disabled = false; });
  });

  /* Segarkan papan tiap 20 detik selama tab antrean terbuka */
  setInterval(function () {
    if (!state.token) return;
    var pane = document.querySelector('.tabpane[data-pane="antrean"]');
    if (pane && pane.classList.contains('on') && !document.hidden) qaMuat();
  }, 20000);

  /* =================================================== AKUN PANEL ===
   * Super admin mengelola akun; setiap orang bisa mengganti kata
   * sandinya sendiri. Bagian yang tidak diberi akses disembunyikan dari
   * menu — dan datanya memang tidak dikirim server, jadi menyembunyikan
   * menu bukan satu-satunya pengaman.
   * ================================================================= */
  var AKSES_LABEL = { antrean: 'Antrean', daftar: 'Pendaftaran', konten: 'Konten Situs',
                      pesan: 'Pesan Masuk', rekap: 'Rekap & Ekspor' };
  var PG = { daftar: [], akses: ['antrean', 'daftar', 'konten', 'pesan', 'rekap'], sunting: null, sudah: false };

  function bolehLihat(bagian) {
    return state.peran === 'super' || (state.akses || []).indexOf(bagian) > -1;
  }

  /** Sembunyikan menu yang tidak boleh dibuka akun ini. */
  function terapkanAkses() {
    var pertama = '';
    $$('[data-tab]').forEach(function (b) {
      var t = b.dataset.tab;
      var boleh = t === 'pengguna' ? state.peran === 'super' : bolehLihat(t);
      b.hidden = !boleh;
      if (boleh && !pertama) pertama = t;
    });
    var aktif = $$('[data-tab]').filter(function (b) { return b.classList.contains('on'); })[0];
    if ((!aktif || aktif.hidden) && pertama) bukaTab(pertama);
  }

  function pgPesan(tipe, msg) {
    var b = $('#pg-status'); if (!b) return;
    b.className = 'fstatus show ' + tipe; b.innerHTML = '<div>' + msg + '</div>';
    clearTimeout(b._h); b._h = setTimeout(function () { b.className = 'fstatus'; }, 6000);
  }

  function pgMuat() {
    if (state.peran !== 'super') return Promise.resolve();
    return api('adminDaftar').then(function (r) {
      PG.daftar = r.daftar || [];
      PG.akses = r.akses || PG.akses;
      var cat = $('#pg-catatan'), catT = $('#pg-catatan-t');
      if (cat) {
        cat.hidden = !r.catatan;
        cat.className = 'kt-terbit' + (r.catatan ? ' ada' : '');
        if (catT) catT.textContent = r.catatan || '';
      }
      pgGambar();
    }).catch(function (e) { pgPesan('bad', esc(e.message)); });
  }

  function pgGambar() {
    var kotak = $('#pg-list'); if (!kotak) return;
    if (!PG.daftar.length) {
      kotak.innerHTML = '<div class="kt-kosong">Belum ada akun tersimpan.<br>Buat akun super admin lebih dulu — sesudah itu akun bawaan berhenti dipakai.</div>';
      return;
    }
    kotak.innerHTML = PG.daftar.map(function (a) {
      var akses = a.peran === 'super'
        ? '<span class="pg-chip">semua bagian</span>'
        : (a.akses || []).map(function (k) { return '<span class="pg-chip">' + esc(AKSES_LABEL[k] || k) + '</span>'; }).join('');
      return '<div class="kt-r' + (a.aktif ? '' : ' mati') + '">' +
        '<div class="kt-n"><b>' + esc(a.nama || a.user) + ' <span class="pg-peran ' + esc(a.peran) + '">' +
          (a.peran === 'super' ? 'Super admin' : 'Admin') + '</span></b>' +
          '<span>' + esc(a.user) + (a.aktif ? '' : ' · dinonaktifkan') + '</span>' +
          '<div style="margin-top:6px">' + akses + '</div></div>' +
        '<div class="kt-a">' +
          '<button data-pg-edit="' + esc(a.user) + '">Edit</button>' +
          '<button class="bahaya" data-pg-hapus="' + esc(a.user) + '">Hapus</button>' +
        '</div></div>';
    }).join('');
  }

  function pgBuka(user) {
    var a = PG.daftar.filter(function (x) { return x.user === user; })[0] || null;
    PG.sunting = a ? a.user : '';
    $('#pg-modal-j').textContent = a ? 'Edit akun' : 'Tambah akun';
    $('#pg-user').value = a ? a.user : '';
    $('#pg-user').readOnly = !!a;
    $('#pg-nama').value = a ? (a.nama || '') : '';
    $('#pg-peran').value = a ? a.peran : 'admin';
    $('#pg-sandi').value = '';
    $('#pg-sandi-h').textContent = a
      ? 'Kosongkan bila kata sandinya tidak diubah. Mengisi di sini akan menggantinya.'
      : 'Wajib diisi untuk akun baru. Minimal 8 karakter.';
    $('#pg-aktif').checked = a ? a.aktif !== false : true;
    $('#pg-akses').innerHTML = PG.akses.map(function (k) {
      var ada = a ? (a.akses || []).indexOf(k) > -1 : (k === 'antrean' || k === 'daftar');
      return '<label><input type="checkbox" value="' + esc(k) + '"' + (ada ? ' checked' : '') + '> ' +
        esc(AKSES_LABEL[k] || k) + '</label>';
    }).join('');
    pgSyncPeran();
    $('#pg-modal-s').className = 'fstatus';
    $('#pg-modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function pgTutup() { $('#pg-modal').hidden = true; document.body.style.overflow = ''; PG.sunting = null; }

  /* Super admin selalu punya semua akses — centangnya dimatikan supaya
     tidak terlihat seolah bisa dibatasi. */
  function pgSyncPeran() {
    var super_ = $('#pg-peran').value === 'super';
    var blok = $('#pg-akses-blok');
    if (blok) blok.style.opacity = super_ ? '.45' : '1';
    $$('#pg-akses input').forEach(function (c) {
      c.disabled = super_;
      if (super_) c.checked = true;
    });
  }

  function pgSimpan() {
    var box = $('#pg-modal-s');
    var akses = $$('#pg-akses input:checked').map(function (c) { return c.value; });
    var btn = $('#pg-modal-simpan'); btn.disabled = true;
    box.className = 'fstatus show'; box.innerHTML = '<div>Menyimpan…</div>';
    api('adminSimpan', {
      user: ($('#pg-user').value || '').trim().toLowerCase(),
      nama: ($('#pg-nama').value || '').trim(),
      peran: $('#pg-peran').value,
      akses: akses,
      sandi: $('#pg-sandi').value,
      aktif: $('#pg-aktif').checked
    }).then(function (r) {
      pgTutup();
      pgPesan('ok', r.baru ? 'Akun <strong>' + esc(r.user) + '</strong> dibuat.' : 'Akun <strong>' + esc(r.user) + '</strong> diperbarui.');
      return pgMuat();
    }).catch(function (e) {
      box.className = 'fstatus show bad'; box.innerHTML = '<div>' + esc(e.message) + '</div>';
    }).then(function () { btn.disabled = false; });
  }

  document.addEventListener('click', function (e) {
    var ed = e.target.closest('[data-pg-edit]');
    if (ed) return pgBuka(ed.dataset.pgEdit);

    var hp = e.target.closest('[data-pg-hapus]');
    if (hp) {
      var u = hp.dataset.pgHapus;
      if (!confirm('Hapus akun "' + u + '"?\n\nOrang ini tidak akan bisa masuk lagi. Tindakan ini tidak bisa dibatalkan.')) return;
      hp.disabled = true;
      return api('adminHapus', { user: u }).then(function () {
        pgPesan('ok', 'Akun <strong>' + esc(u) + '</strong> dihapus.');
        return pgMuat();
      }).catch(function (err) { pgPesan('bad', esc(err.message)); hp.disabled = false; });
    }
  });

  ['#pg-tambah'].forEach(function (sel) {
    var el = $(sel); if (el) el.addEventListener('click', function () { pgBuka(''); });
  });
  ['#pg-modal-x', '#pg-modal-batal'].forEach(function (sel) {
    var el = $(sel); if (el) el.addEventListener('click', pgTutup);
  });
  var pgP = $('#pg-peran'); if (pgP) pgP.addEventListener('change', pgSyncPeran);
  var pgS = $('#pg-modal-simpan'); if (pgS) pgS.addEventListener('click', pgSimpan);

  /* --------------------------------------- ganti kata sandi sendiri */
  function sdTutup() { $('#sd-modal').hidden = true; document.body.style.overflow = ''; }
  var sdBtn = $('#btn-sandi');
  if (sdBtn) sdBtn.addEventListener('click', function () {
    ['#sd-lama', '#sd-baru', '#sd-ulang'].forEach(function (s2) { var el = $(s2); if (el) el.value = ''; });
    $('#sd-status').className = 'fstatus';
    $('#sd-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#sd-lama').focus();
  });
  ['#sd-x', '#sd-batal'].forEach(function (sel) {
    var el = $(sel); if (el) el.addEventListener('click', sdTutup);
  });
  var sdS = $('#sd-simpan');
  if (sdS) sdS.addEventListener('click', function () {
    var box = $('#sd-status');
    var lama = $('#sd-lama').value, baru = $('#sd-baru').value, ulang = $('#sd-ulang').value;
    var salah = !lama ? 'Isi kata sandi sekarang.'
      : baru.length < 8 ? 'Kata sandi baru minimal 8 karakter.'
      : baru !== ulang ? 'Ulangan kata sandi belum sama.' : '';
    if (salah) { box.className = 'fstatus show bad'; box.innerHTML = '<div>' + salah + '</div>'; return; }
    sdS.disabled = true;
    box.className = 'fstatus show'; box.innerHTML = '<div>Menyimpan…</div>';
    api('gantiSandi', { lama: lama, baru: baru }).then(function () {
      sdTutup();
      alert('Kata sandi berhasil diganti. Pakai yang baru saat masuk berikutnya.');
    }).catch(function (e) {
      box.className = 'fstatus show bad'; box.innerHTML = '<div>' + esc(e.message) + '</div>';
    }).then(function () { sdS.disabled = false; });
  });

  function renderPesan() {
    $('#empty-pesan').hidden = state.pesan.length > 0;
    $('#tb-pesan').innerHTML = state.pesan.map(function (p) {
      var wa = 'https://wa.me/' + String(p.hp || '').replace(/\D/g, '');
      return '<tr><td data-l="Waktu">' + jam(p.ts) + '</td><td data-l="Nama"><b style="color:var(--ink)">' + esc(p.nama) + '</b></td>' +
        '<td data-l="Kontak"><a href="' + wa + '" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600">' + esc(p.hp) + '</a></td>' +
        '<td data-l="Perihal">' + esc(p.subjek) + '</td><td data-l="Pesan" style="max-width:360px">' + esc(p.pesan) + '</td>' +
        '<td data-l="Aksi"><div class="act"><a class="btn btn-ghost" style="padding:6px 12px;font-size:12px;min-height:0" href="' + wa + '" target="_blank" rel="noopener">Balas</a></div></td></tr>';
    }).join('');
  }

  function renderRekap() {
    var byLay = {}, byHari = {};
    state.daftar.forEach(function (d) {
      byLay[d.layanan] = (byLay[d.layanan] || 0) + 1;
      var h = (d.tanggal || d.ts || '').slice(0, 10);
      if (h) byHari[h] = (byHari[h] || 0) + 1;
    });
    var maxL = Math.max.apply(null, Object.keys(byLay).map(function (k) { return byLay[k]; }).concat([1]));
    $('#rekap-layanan').innerHTML = Object.keys(byLay).sort(function (a, b) { return byLay[b] - byLay[a]; }).map(function (k) {
      return '<div><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:5px"><b style="color:var(--ink);font-family:var(--ff-h)">' + esc(k) + '</b><span>' + byLay[k] + '</span></div>' +
        '<div style="height:8px;background:var(--line-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:' + Math.round(byLay[k] / maxL * 100) + '%;background:linear-gradient(90deg,var(--g-400),var(--g-600))"></div></div></div>';
    }).join('') || '<p style="color:var(--muted);font-size:14px">Belum ada data.</p>';

    var hariKeys = Object.keys(byHari).sort().slice(-14);
    var maxH = Math.max.apply(null, hariKeys.map(function (k) { return byHari[k]; }).concat([1]));
    $('#rekap-hari').innerHTML = hariKeys.map(function (k) {
      return '<div style="display:flex;align-items:center;gap:12px;font-size:13.5px"><span style="width:96px;color:var(--muted)">' + k + '</span>' +
        '<div style="flex:1;height:7px;background:var(--line-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:' + Math.round(byHari[k] / maxH * 100) + '%;background:var(--g-500)"></div></div>' +
        '<b style="width:28px;text-align:right;color:var(--ink)">' + byHari[k] + '</b></div>';
    }).join('') || '<p style="color:var(--muted);font-size:14px">Belum ada data.</p>';
  }

  /* ------------------------------------------------ EKSPOR */
  $('#export-csv').addEventListener('click', function () {
    var cols = ['id', 'ts', 'nama', 'umur', 'alamat', 'keluhan', 'hp', 'layanan', 'tanggal', 'sesi', 'status', 'tambahan'];
    var csv = [cols.join(',')].concat(state.daftar.map(function (d) {
      return cols.map(function (c) { return '"' + String(d[c] == null ? '' : d[c]).replace(/"/g, '""') + '"'; }).join(',');
    })).join('\r\n');
    var url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'pendaftaran-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  $('#copy-wa').addEventListener('click', function () {
    var today = new Date().toISOString().slice(0, 10);
    var list = state.daftar.filter(function (d) { return (d.tanggal || '').slice(0, 10) === today; });
    var txt = '*REKAP PENDAFTARAN ' + today + '*\nTotal: ' + list.length + ' pasien\n\n' +
      list.map(function (d, i) { return (i + 1) + '. ' + d.nama + ' — ' + d.layanan + ' (' + d.sesi + ') [' + d.status + ']'; }).join('\n');
    navigator.clipboard.writeText(txt).then(function () { alert('Rekap disalin. Tinggal tempel di WhatsApp.'); },
      function () { prompt('Salin teks berikut:', txt); });
  });

  /* ------------------------------------------ sesi tersimpan */
  try {
    var t = sessionStorage.getItem(TKEY);
    if (t) {
      state.token = t;
      state.user = DEMO ? 'admin (demo)' : 'admin';
      try {
        var s = JSON.parse(sessionStorage.getItem(SKEY) || '{}');
        if (s.user) state.user = s.user;
        if (s.akun) state.akun = s.akun;
        if (s.peran) state.peran = s.peran;
        if (s.akses) state.akses = s.akses;
      } catch (x) {}
      enter();
    }
  } catch (e) {}
})();
