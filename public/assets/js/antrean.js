/* =============================================================
 * antrean.js — Papan antrean publik (real-time)
 * Menarik data dari Apps Script setiap N detik, tanpa library.
 * Berhenti menyegarkan saat tab tidak terlihat agar hemat kuota.
 * ============================================================= */
(function () {
  'use strict';
  var CFG = window.KLINIK || {};
  var A = CFG.antrean || { pollDetik: 15, poli: [] };
  var DEMO = !CFG.gasUrl || CFG.gasUrl.indexOf('GANTI_DENGAN') > -1;
  var JEDA = Math.max(8, Number(A.pollDetik) || 15) * 1000;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };

  var papan = $('.q-grid');
  if (!papan) return;

  var timer = null, gagal = 0;

  /* ------------------------------------------------ DATA DEMO */
  function demo() {
    var buat = function (kode, n, sekarang, lewat) {
      var d = [];
      for (var i = 1; i <= n; i++) {
        var st = i === lewat ? 'terlewat'
          : i < sekarang ? 'selesai'
          : i === sekarang ? 'dilayani' : 'menunggu';
        d.push({ kode: kode + '-' + ('0' + i).slice(-2), no: i, nama: 'Pasien ' + i, status: st, sumber: i % 3 ? 'offline' : 'online' });
      }
      return d;
    };
    var poli = (A.poli || []).map(function (p, idx) {
      var n = [8, 5][idx] || 5, skr = [4, 3][idx] || 2, lwt = [2, 1][idx] || 1;
      var daftar = buat(p.kode, n, skr, lwt);
      var sdg = daftar.filter(function (r) { return r.status === 'dilayani'; })[0] || null;
      return {
        slug: p.slug, nama: p.nama, kode: p.kode,
        sedangDilayani: sdg ? { kode: sdg.kode, nama: sdg.nama, status: 'dilayani' } : null,
        menunggu: daftar.filter(function (r) { return r.status === 'menunggu'; }).length,
        selesai: daftar.filter(function (r) { return r.status === 'selesai'; }).length,
        terlewat: daftar.filter(function (r) { return r.status === 'terlewat'; }).length,
        daftar: daftar
      };
    });
    return Promise.resolve({ ok: true, demo: true, bukaOnline: true, poli: poli, waktu: new Date().toISOString() });
  }

  /* ---------------------------------------------------- AMBIL */
  function ambil() {
    if (DEMO) return demo();
    return fetch(CFG.gasUrl + '?action=antrean&_=' + Date.now(), { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error(j && j.error || 'Gagal memuat'); return j; });
  }

  function cek(kode) {
    if (DEMO) {
      return Promise.resolve({ ok: true, kode: kode.toUpperCase(), nama: 'Pasien Contoh', poli: 'Poli Umum',
        status: 'menunggu', didepan: 3, perkiraanMenit: 21, demo: true });
    }
    return fetch(CFG.gasUrl + '?action=cekAntrean&kode=' + encodeURIComponent(kode), { method: 'GET' })
      .then(function (r) { return r.json(); });
  }

  /* --------------------------------------------------- STATUS */
  function tandaStatus(kelas, teks) {
    var box = $('#q-status'); if (!box) return;
    box.className = 'q-status ' + kelas;
    $('#q-status-t').textContent = teks;
  }

  function jamLokal(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d)) return '';
      return ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2);
    } catch (e) { return ''; }
  }

  /* -------------------------------------------------- GAMBAR */
  function gambar(data) {
    var tutup = $('#q-tutup');
    if (tutup) tutup.hidden = data.bukaOnline !== false;

    (data.poli || []).forEach(function (p) {
      var kartu = papan.querySelector('[data-poli="' + p.slug + '"]');
      if (!kartu) return;

      var now = $('.q-now', kartu);
      var sek = $('[data-f="sekarang"]', kartu);
      var nm = $('[data-f="sekarangNama"]', kartu);

      if (p.sedangDilayani) {
        sek.textContent = p.sedangDilayani.kode;
        nm.textContent = p.sedangDilayani.nama || '';
        now.classList.toggle('call', p.sedangDilayani.status === 'dipanggil');
      } else {
        sek.textContent = '—';
        nm.textContent = p.menunggu ? 'Menunggu dipanggil petugas' : 'Belum ada antrean';
        now.classList.remove('call');
      }

      $('[data-f="menunggu"]', kartu).textContent = p.menunggu || 0;
      $('[data-f="selesai"]', kartu).textContent = p.selesai || 0;
      $('[data-f="terlewat"]', kartu).textContent = p.terlewat || 0;

      var total = (p.daftar || []).length;
      $('[data-f="ringkas"]', kartu).textContent = total
        ? total + ' pasien hari ini'
        : 'Belum ada pasien';

      var list = $('[data-f="daftar"]', kartu);
      if (!total) {
        list.innerHTML = '<span class="q-empty">Antrean masih kosong.</span>';
      } else {
        list.innerHTML = p.daftar.map(function (r) {
          var judul = esc(r.nama) + ' · ' + (r.sumber === 'online' ? 'daftar online' : 'datang langsung');
          return '<span class="q-no ' + esc(r.status) + '" title="' + judul + '">' + esc(r.kode) + '</span>';
        }).join('');
      }
    });

    var jam = jamLokal(data.waktu) || jamLokal(new Date().toISOString());
    tandaStatus('live', (data.demo ? 'Mode demo · ' : 'Diperbarui ') + jam + ' WIB');
    gagal = 0;
  }

  /* ------------------------------------------------ PENYEGARAN */
  function segarkan() {
    return ambil().then(gambar).catch(function () {
      gagal++;
      tandaStatus('off', gagal > 2
        ? 'Tidak terhubung ke server antrean. Coba muat ulang halaman.'
        : 'Gagal menyegarkan, mencoba lagi…');
    });
  }

  function mulai() { hentikan(); segarkan(); timer = setInterval(segarkan, JEDA); }
  function hentikan() { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hentikan(); else mulai();
  });
  addEventListener('online', mulai);
  addEventListener('offline', function () { hentikan(); tandaStatus('off', 'Perangkat Anda sedang offline.'); });

  mulai();

  /* ------------------------------------------------ CEK NOMOR */
  var form = $('#form-cek');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = $('#cek-status');
      var kode = ($('#cek-kode').value || '').trim().toUpperCase();
      if (!/^[A-Z]-?\d{1,3}$/.test(kode)) {
        box.className = 'fstatus show bad';
        box.innerHTML = '<div>Format nomor belum benar. Contoh yang benar: <strong>U-07</strong>.</div>';
        return;
      }
      if (kode.indexOf('-') < 0) kode = kode.charAt(0) + '-' + ('0' + kode.slice(1)).slice(-2);
      box.className = 'fstatus show';
      box.innerHTML = '<div>Mencari nomor ' + esc(kode) + '…</div>';

      cek(kode).then(function (j) {
        if (!j || j.ok !== true) {
          box.className = 'fstatus show bad';
          box.innerHTML = '<div>' + esc((j && j.error) || 'Nomor tidak ditemukan hari ini.') + '</div>';
          return;
        }
        var label = { menunggu: 'Belum dipanggil', dipanggil: 'Sedang dipanggil — segera ke ruang periksa',
          dilayani: 'Sedang ditangani dokter', selesai: 'Sudah selesai dilayani',
          terlewat: 'Terlewat — lapor ke petugas pendaftaran' }[j.status] || j.status;
        box.className = 'fstatus show ok';
        box.innerHTML = '<div><strong>' + esc(j.kode) + '</strong> · ' + esc(j.poli || '') +
          '<br>Status: <strong>' + esc(label) + '</strong>' +
          (j.status === 'menunggu'
            ? '<br>Sisa <strong>' + (j.didepan || 0) + ' pasien</strong> sebelum giliran Anda' +
              ' (perkiraan ± ' + (j.perkiraanMenit || 0) + ' menit).'
            : '') +
          (j.demo ? '<br><em>Mode demo — Apps Script belum terpasang.</em>' : '') + '</div>';
      }).catch(function () {
        box.className = 'fstatus show bad';
        box.innerHTML = '<div>Gagal menghubungi server. Periksa koneksi Anda.</div>';
      });
    });
  }

  /* -------------------------------------------- BANNER BERGANTI */
  var banners = $$('.q-banner');
  if (banners.length > 1) {
    var bi = 0;
    setInterval(function () {
      banners[bi].classList.remove('on');
      bi = (bi + 1) % banners.length;
      banners[bi].classList.add('on');
    }, 7000);
  }
})();
