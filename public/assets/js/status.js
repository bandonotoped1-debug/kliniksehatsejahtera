/* =============================================================
 * status.js — Status buka/tutup layanan, dihitung real-time
 * -------------------------------------------------------------
 * Satu berkas dipakai dua kali:
 *   • saat build (require dari build.js) untuk mengisi HTML awal,
 *   • di browser untuk menghitung ulang tiap menit.
 * Dengan begitu halaman yang sudah lama terbuka, atau yang diambil
 * dari cache service worker, tidak pernah menampilkan "Buka" di
 * tengah malam.
 *
 * Jam SELALU dihitung di Asia/Jakarta, bukan jam perangkat
 * pengunjung — pasien yang sedang di luar negeri tetap melihat
 * status yang benar.
 *
 * Kalau dokter izin, sesi hari itu ditutup. Datanya datang dari
 * Apps Script (?action=status) dan disetel lewat panel admin;
 * kalau permintaan itu gagal, halaman tetap jalan memakai jadwal.
 * ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.KlinikStatus = api;
    if (typeof document !== 'undefined') api.pasang();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var ZONA = 'Asia/Jakarta';

  function keMenit(jam) {
    var p = String(jam || '').split(':');
    return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0);
  }

  function jamRapi(jam) { return String(jam || '').replace(':', '.'); }

  /** Hari & menit menurut WIB, apa pun zona waktu perangkat. */
  function sekarangWIB(d) {
    d = d || new Date();
    try {
      var f = new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONA, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(d);
      var bag = {};
      f.forEach(function (x) { bag[x.type] = x.value; });
      var pekan = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var jam = Number(bag.hour); if (jam === 24) jam = 0;   // sebagian mesin menulis 24:00
      return { hari: pekan[bag.weekday], menit: jam * 60 + Number(bag.minute) };
    } catch (e) {
      return { hari: d.getDay(), menit: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function izinAktif(izin, baris, sesi) {
    if (!izin || !baris.poli || !sesi) return false;
    var p = izin[baris.poli];
    return !!(p && p[sesi.kunci]);
  }

  /** Sesi yang sedang berlangsung sekarang (belum memperhitungkan izin). */
  function sesiSekarang(baris, kini) {
    var list = baris.sesi || [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (s.hari.indexOf(kini.hari) < 0) continue;
      if (kini.menit >= keMenit(s.mulai) && kini.menit < keMenit(s.selesai)) return s;
    }
    return null;
  }

  /** Sesi berikutnya dalam 7 hari ke depan; sesi hari ini yang dokternya izin dilewati. */
  function sesiBerikutnya(baris, kini, izin) {
    var list = baris.sesi || [];
    for (var maju = 0; maju < 8; maju++) {
      var hari = (kini.hari + maju) % 7;
      var calon = list.filter(function (s) {
        if (s.hari.indexOf(hari) < 0) return false;
        if (maju === 0 && keMenit(s.mulai) <= kini.menit) return false;
        if (maju === 0 && izinAktif(izin, baris, s)) return false;
        return true;
      }).sort(function (a, b) { return keMenit(a.mulai) - keMenit(b.mulai); });
      if (calon.length) return { sesi: calon[0], maju: maju, hari: hari };
    }
    return null;
  }

  function tekstBerikutnya(b) {
    if (!b) return 'Jadwal menyusul';
    var jam = jamRapi(b.sesi.mulai);
    if (b.maju === 0) return 'Buka lagi pukul ' + jam;
    if (b.maju === 1) return 'Buka lagi besok ' + jam;
    return 'Buka lagi ' + HARI[b.hari] + ' ' + jam;
  }

  /**
   * Status satu baris kartu.
   * @returns {{status:string, badge:string, ket:string}}
   *   status: buka | tutup | izin | perjanjian
   */
  function hitung(baris, kini, izin) {
    kini = kini || sekarangWIB();
    if (baris.perjanjian) {
      return { status: 'perjanjian', badge: 'Perjanjian', ket: baris.ket || 'Dengan perjanjian' };
    }

    var s = sesiSekarang(baris, kini);
    if (s && izinAktif(izin, baris, s)) {
      return { status: 'izin', badge: 'Dokter izin',
               ket: s.nama + ' hari ini ditiadakan — ' + (tekstBerikutnya(sesiBerikutnya(baris, kini, izin)) || '').toLowerCase() };
    }
    if (s) {
      return { status: 'buka', badge: 'Buka',
               ket: s.nama + ' ' + jamRapi(s.mulai) + '–' + jamRapi(s.selesai) };
    }
    return { status: 'tutup', badge: 'Tutup', ket: tekstBerikutnya(sesiBerikutnya(baris, kini, izin)) };
  }

  /** Klinik dianggap "Live" bila ada satu poli pun yang sedang buka. */
  function hitungKlinik(daftar, kini, izin) {
    kini = kini || sekarangWIB();
    var poli = (daftar || []).filter(function (b) { return !!b.poli; });
    var buka = poli.filter(function (b) { return hitung(b, kini, izin).status === 'buka'; });
    if (buka.length) return { status: 'buka', badge: 'Live', ket: 'Klinik sedang melayani' };

    var calon = null;
    poli.forEach(function (b) {
      var n = sesiBerikutnya(b, kini, izin);
      if (!n) return;
      var skor = n.maju * 1440 + keMenit(n.sesi.mulai);
      if (!calon || skor < calon.skor) calon = { skor: skor, n: n };
    });
    return { status: 'tutup', badge: 'Tutup',
             ket: calon ? tekstBerikutnya(calon.n) : 'Di luar jam pelayanan' };
  }

  /* ================================================== BROWSER === */
  function pasang() {
    var CFG = (typeof window !== 'undefined' && window.KLINIK) || {};
    var daftar = CFG.statusBaris || [];
    if (!daftar.length) return;
    if (!document.querySelector('[data-status-baris], [data-status-live], .q-card[data-poli]')) return;

    var izin = null;
    var demo = !CFG.gasUrl || CFG.gasUrl.indexOf('GANTI_DENGAN') > -1;

    function set(el, teks) { if (el && el.textContent !== teks) el.textContent = teks; }

    function gambar() {
      var kini = sekarangWIB();

      daftar.forEach(function (b) {
        var h = hitung(b, kini, izin);
        var baris = document.querySelector('[data-status-baris="' + b.key + '"]');
        if (baris) {
          baris.setAttribute('data-status', h.status);
          set(baris.querySelector('[data-status-ket]'), h.ket);
          set(baris.querySelector('[data-status-badge]'), h.badge);
        }
        /* Papan antrean: tiap kartu poli memakai slug yang sama. */
        if (b.poli) {
          var kartu = document.querySelector('.q-card[data-poli="' + b.poli + '"]');
          if (kartu) {
            kartu.setAttribute('data-status', h.status);
            set(kartu.querySelector('[data-status-jam]'), h.badge + ' · ' + h.ket);
          }
        }
      });

      var live = document.querySelector('[data-status-live]');
      if (live) {
        var k = hitungKlinik(daftar, kini, izin);
        live.setAttribute('data-status', k.status);
        set(live.querySelector('[data-status-badge]') || live, k.badge);
        live.title = k.ket;
      }
    }

    function tarikIzin() {
      if (demo) return Promise.resolve();
      return fetch(CFG.gasUrl + '?action=status&_=' + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok) { izin = j.izin || null; gambar(); } })
        .catch(function () { /* jadwal tetap dipakai */ });
    }

    gambar();
    tarikIzin();
    setInterval(gambar, 30000);                                  // jam berjalan
    setInterval(function () { if (!document.hidden) tarikIzin(); }, 300000);  // izin dokter
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { gambar(); tarikIzin(); }
    });
  }

  return { HARI: HARI, keMenit: keMenit, jamRapi: jamRapi, sekarangWIB: sekarangWIB,
           hitung: hitung, hitungKlinik: hitungKlinik, sesiBerikutnya: sesiBerikutnya, pasang: pasang };
});
