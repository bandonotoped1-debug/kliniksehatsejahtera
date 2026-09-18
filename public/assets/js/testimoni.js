/* =============================================================
 * testimoni.js — Tayangan testimoni berjalan otomatis
 * -------------------------------------------------------------
 * Dipakai halaman layanan khitan. Berjalan sendiri tiap beberapa
 * detik, TAPI:
 *   • berhenti saat disentuh, di-hover, atau salah satu isinya
 *     sedang difokus keyboard — supaya tidak berpindah di tengah
 *     orang membaca,
 *   • berhenti saat tab tidak terlihat (hemat baterai),
 *   • tidak berjalan sama sekali bila pengunjung memilih
 *     "kurangi animasi" di pengaturan perangkatnya,
 *   • tetap bisa digeser manual lewat tombol atau titik navigasi.
 *
 * Gambar memakai tautan yang ditempel admin. Kalau tautannya mati,
 * gambarnya disembunyikan dan kartu tetap utuh — bukan ikon rusak.
 * ============================================================= */
(function () {
  'use strict';

  var akar = document.querySelector('[data-testi]');
  if (!akar) return;

  var rel = akar.querySelector('.ts-rel');
  var kartu = Array.prototype.slice.call(akar.querySelectorAll('.ts-i'));
  if (kartu.length < 1) return;

  var titik = Array.prototype.slice.call(akar.querySelectorAll('.ts-dot'));
  var JEDA = Math.max(3000, Number(akar.dataset.jeda) || 6000);
  var pelan = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var kini = 0, timer = null, tahan = false;

  /* Gambar yang tautannya mati tidak boleh menyisakan ikon rusak. */
  akar.querySelectorAll('.ts-img img').forEach(function (img) {
    img.addEventListener('error', function () {
      var bungkus = img.closest('.ts-img');
      if (bungkus) bungkus.remove();
    });
  });

  function ke(i, halus) {
    kini = (i + kartu.length) % kartu.length;
    if (rel) {
      rel.style.scrollBehavior = (halus && !pelan) ? 'smooth' : 'auto';
      rel.scrollTo({ left: kartu[kini].offsetLeft - rel.offsetLeft, behavior: (halus && !pelan) ? 'smooth' : 'auto' });
    }
    titik.forEach(function (d, n) {
      d.classList.toggle('on', n === kini);
      d.setAttribute('aria-current', n === kini ? 'true' : 'false');
    });
  }

  function jalan() {
    if (pelan || kartu.length < 2) return;      // satu kartu tidak perlu berjalan
    berhenti();
    timer = setInterval(function () {
      if (tahan || document.hidden) return;
      ke(kini + 1, true);
    }, JEDA);
  }
  function berhenti() { if (timer) { clearInterval(timer); timer = null; } }

  ['mouseenter', 'touchstart', 'focusin'].forEach(function (ev) {
    akar.addEventListener(ev, function () { tahan = true; }, { passive: true });
  });
  ['mouseleave', 'touchend', 'focusout'].forEach(function (ev) {
    akar.addEventListener(ev, function () { tahan = false; }, { passive: true });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) jalan(); });

  titik.forEach(function (d, n) {
    d.addEventListener('click', function () { ke(n, true); jalan(); });
  });
  var prev = akar.querySelector('[data-ts="prev"]');
  var next = akar.querySelector('[data-ts="next"]');
  if (prev) prev.addEventListener('click', function () { ke(kini - 1, true); jalan(); });
  if (next) next.addEventListener('click', function () { ke(kini + 1, true); jalan(); });

  /* Geser manual dengan jari juga memperbarui titik navigasi. */
  if (rel) {
    var tunggu = null;
    rel.addEventListener('scroll', function () {
      clearTimeout(tunggu);
      tunggu = setTimeout(function () {
        var dekat = 0, jarak = Infinity;
        kartu.forEach(function (k, n) {
          var d = Math.abs((k.offsetLeft - rel.offsetLeft) - rel.scrollLeft);
          if (d < jarak) { jarak = d; dekat = n; }
        });
        kini = dekat;
        titik.forEach(function (d, n) { d.classList.toggle('on', n === kini); });
      }, 120);
    }, { passive: true });
  }

  ke(0, false);
  jalan();
})();
