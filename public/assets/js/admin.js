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
  var state = { token: null, user: '', daftar: [], pesan: [] };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };

  /* Dibuka agar admin-konten.js bisa memakai sesi & endpoint yang sama */
  window.__adminApi = function (a, p) { return api(a, p); };

  /* --------------------------------------------------- API */
  function api(action, payload) {
    if (DEMO) return demoApi(action, payload);
    return fetch(CFG.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: state.token, data: payload || {} })
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || j.ok !== true) throw new Error((j && j.error) || 'Gagal');
        return j;
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
              { id: 'R-003', ts: kemarin + 'T18:05:00', nama: 'Contoh Pasien C', umur: '8 tahun', alamat: 'Nglegok, Kab. Blitar', keluhan: 'Rencana khitan.', hp: '628555111222', layanan: 'Pelayanan Khitan', tanggal: kemarin, sesi: 'Fleksibel — atur oleh admin', status: 'Selesai' }
            ],
            pesan: [{ id: 'P-001', ts: hari + 'T09:00:00', nama: 'Contoh Pengirim', hp: '628111222333', subjek: 'Pertanyaan layanan', pesan: 'Apakah hari Minggu buka?' }]
          });
        }
        res({ ok: true });
      }, 320);
    });
  }

  /* ------------------------------------------------- LOGIN */
  var fLogin = $('#form-login');
  fLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    var box = $('#login-status'), btn = $('#btn-login');
    var user = $('#user').value.trim(), pass = $('#pass').value;
    if (!user || !pass) { show(box, 'bad', 'Nama pengguna dan kata sandi wajib diisi.'); return; }
    btn.disabled = true; btn.textContent = 'Memeriksa…';
    api('login', { user: user, pass: pass }).then(function (r) {
      state.token = r.token; state.user = r.user || user;
      try { sessionStorage.setItem(TKEY, r.token); } catch (err) {}
      enter();
    }).catch(function (err) {
      show(box, 'bad', esc(err.message || 'Login gagal. Periksa kembali kredensial Anda.'));
    }).then(function () { btn.disabled = false; btn.textContent = 'Masuk'; });
  });

  function show(el, type, msg) {
    el.className = 'fstatus show ' + type;
    el.innerHTML = '<div>' + msg + '</div>';
  }

  function enter() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#who').textContent = state.user;
    $('#demo-note').hidden = !DEMO;
    load();
  }

  $('#logout').addEventListener('click', function () {
    state.token = null;
    try { sessionStorage.removeItem(TKEY); } catch (e) {}
    location.reload();
  });
  $('#refresh').addEventListener('click', load);

  /* -------------------------------------------------- TABS */
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      $$('.tabpane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === b.dataset.tab); });
    });
  });

  /* -------------------------------------------------- LOAD */
  function load() {
    api('list').then(function (r) {
      state.daftar = r.daftar || []; state.pesan = r.pesan || [];
      fillFilters(); renderAll();
    }).catch(function (err) {
      alert('Gagal memuat data: ' + err.message);
    });
  }

  function fillFilters() {
    var sel = $('#f-layanan');
    var list = (CFG.services || []).slice();
    state.daftar.forEach(function (d) { if (list.indexOf(d.layanan) < 0) list.push(d.layanan); });
    sel.innerHTML = '<option value="">Semua layanan</option>' + list.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
  }

  ['#q', '#f-status', '#f-layanan', '#f-tanggal'].forEach(function (s) {
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
    var today = new Date().toISOString().slice(0, 10);
    // set() aman terhadap kartu KPI yang dihapus dari HTML —
    // satu id hilang tidak boleh menghentikan seluruh render.
    var set = function (id, nilai) { var el = $(id); if (el) el.textContent = nilai; };
    set('#k-hari', state.daftar.filter(function (d) { return (d.tanggal || '').slice(0, 10) === today; }).length);
    set('#k-baru', state.daftar.filter(function (d) { return d.status === 'Baru'; }).length);
    set('#k-pesan', state.pesan.length);
  }

  function filtered() {
    var q = ($('#q').value || '').toLowerCase();
    var st = $('#f-status').value, lay = $('#f-layanan').value, tg = $('#f-tanggal').value;
    return state.daftar.filter(function (d) {
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
    var no = String(d.noKartu || '').replace(/[^0-9]/g, '');
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

  function renderDaftar() {
    var rows = filtered();
    $('#empty-daftar').hidden = rows.length > 0;
    $('#tb-daftar').innerHTML = rows.map(function (d) {
      var wa = 'https://wa.me/' + String(d.hp || '').replace(/\D/g, '') +
        '?text=' + encodeURIComponent('Halo ' + d.nama + ', pendaftaran Anda di Klinik Pratama Sehat Sejahtera untuk layanan ' + d.layanan + ' pada ' + d.tanggal + ' telah kami terima. Nomor antrean Anda: ');
      return '<tr>' +
        '<td>' + jam(d.ts) + '</td>' +
        '<td><b style="color:var(--ink)">' + esc(d.nama) + '</b><br><span style="color:var(--muted);font-size:12px">' + esc(d.umur || '') + ' · ' + esc(d.id || '') + '</span></td>' +
        '<td style="max-width:190px">' + esc(d.alamat || '-') + '</td>' +
        '<td><a href="' + wa + '" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600">' + esc(d.hp) + '</a></td>' +
        '<td style="white-space:nowrap">' + kartuSel(d) + '</td>' +
        '<td>' + esc(d.layanan) + '</td>' +
        '<td>' + esc(d.tanggal) + '<br><span style="color:var(--muted);font-size:12px">' + esc(d.sesi || '') + '</span></td>' +
        '<td style="max-width:240px">' + esc(d.keluhan) + '</td>' +
        '<td><span class="pill p-' + esc((d.status || 'baru').toLowerCase()) + '">' + esc(d.status || 'Baru') + '</span></td>' +
        '<td><div class="act">' +
          '<button data-set="Konfirmasi" data-id="' + esc(d.id) + '">Konfirmasi</button>' +
          '<button data-set="Selesai" data-id="' + esc(d.id) + '">Selesai</button>' +
          '<button data-set="Batal" data-id="' + esc(d.id) + '">Batal</button>' +
        '</div></td></tr>';
    }).join('');
  }

  $('#tb-daftar').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-set]'); if (!b) return;
    var id = b.dataset.id, st = b.dataset.set;
    b.disabled = true;
    api('updateStatus', { id: id, status: st }).then(function () {
      var row = state.daftar.find(function (d) { return d.id === id; });
      if (row) row.status = st;
      renderKpi(); renderDaftar();
    }).catch(function (err) { alert('Gagal memperbarui: ' + err.message); b.disabled = false; });
  });


  /* =============================================== ANTREAN === */
  var QA = { tanggal: '', bukaOnline: false, poli: [], antre: [], maksPanggil: 3, lewatiN: 2 };
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
    if (aksi === 'antreanBuka') QA.bukaOnline = !!p.buka;
    if (aksi === 'antreanReset') { QA.antre = []; QA.bukaOnline = false; }
    if (aksi === 'antreanTambah') {
      var cfg = QA.poli.filter(function (x) { return x.slug === p.poli; })[0] || QA.poli[0];
      var n = QA.antre.filter(function (r) { return r.poli === cfg.slug; }).length + 1;
      var kd = cfg.kode + '-' + ('0' + n).slice(-2);
      QA.antre.push({ id: 'd' + Date.now(), poli: cfg.slug, no: n, kode: kd, nik: p.nik || '',
        nama: p.nama, umur: p.umur || '', hp: p.hp || '', sumber: 'offline', status: 'menunggu', panggil: 0 });
      return Promise.resolve({ ok: true, kode: kd, no: n, poli: cfg.slug, demo: true });
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
      poli: QA.poli, antre: QA.antre, maksPanggil: 3, lewatiN: 2, demo: true });
  }

  function qaApi(aksi, payload) {
    if (DEMO) return qaDemo(aksi, payload || {});
    return api(aksi, payload);
  }

  function qaMuat() {
    return qaApi('antreanAdmin', {}).then(function (r) {
      QA.tanggal = r.tanggal; QA.bukaOnline = !!r.bukaOnline;
      QA.poli = r.poli || QA.poli; QA.antre = r.antre || [];
      QA.maksPanggil = r.maksPanggil || 3; QA.lewatiN = r.lewatiN || 2;
      qaGambar();
      var nunggu = QA.antre.filter(function (r2) { return r2.status === 'menunggu' || r2.status === 'tunggu'; }).length;
      var kAntre = $('#k-antre'); if (kAntre) kAntre.textContent = nunggu;
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
            return '<div class="qa-r ' + esc(r.status) + '">' +
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
  }

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

  var qaAdd = $('#qa-tambah');
  if (qaAdd) qaAdd.addEventListener('click', function () {
    var nama = ($('#qa-nama').value || '').trim();
    if (!nama) { qaPesan('bad', 'Nama pasien wajib diisi.'); $('#qa-nama').focus(); return; }
    qaAdd.disabled = true;
    qaApi('antreanTambah', {
      poli: $('#qa-poli').value, nama: nama, umur: ($('#qa-umur').value || '').trim(),
      hp: ($('#qa-hp').value || '').trim(),
      noKartu: ($('#qa-nik').value || '').replace(/[^0-9]/g, ''),
      jenisKartu: 'KTP', sumber: 'offline'
    }).then(function (r) {
      qaPesan('ok', 'Pasien masuk antrean dengan nomor <strong>' + esc(r.kode || '') + '</strong>.');
      $('#qa-nama').value = ''; $('#qa-umur').value = ''; $('#qa-hp').value = ''; $('#qa-nik').value = '';
      $('#qa-nama').focus();
      return qaMuat();
    }).catch(function (e) { qaPesan('bad', e.message); }).then(function () { qaAdd.disabled = false; });
  });

  $('#qa-nama') && $('#qa-nama').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); qaAdd.click(); }
  });

  /* Segarkan papan tiap 20 detik selama tab antrean terbuka */
  setInterval(function () {
    if (!state.token) return;
    var pane = document.querySelector('.tabpane[data-pane="antrean"]');
    if (pane && pane.classList.contains('on') && !document.hidden) qaMuat();
  }, 20000);

  function renderPesan() {
    $('#empty-pesan').hidden = state.pesan.length > 0;
    $('#tb-pesan').innerHTML = state.pesan.map(function (p) {
      var wa = 'https://wa.me/' + String(p.hp || '').replace(/\D/g, '');
      return '<tr><td>' + jam(p.ts) + '</td><td><b style="color:var(--ink)">' + esc(p.nama) + '</b></td>' +
        '<td><a href="' + wa + '" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600">' + esc(p.hp) + '</a></td>' +
        '<td>' + esc(p.subjek) + '</td><td style="max-width:360px">' + esc(p.pesan) + '</td>' +
        '<td><div class="act"><a class="btn btn-ghost" style="padding:6px 12px;font-size:12px;min-height:0" href="' + wa + '" target="_blank" rel="noopener">Balas</a></div></td></tr>';
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
    var cols = ['id', 'ts', 'nama', 'umur', 'alamat', 'keluhan', 'hp', 'layanan', 'tanggal', 'sesi', 'status'];
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
    if (t) { state.token = t; state.user = DEMO ? 'admin (demo)' : 'admin'; enter(); }
  } catch (e) {}
})();
