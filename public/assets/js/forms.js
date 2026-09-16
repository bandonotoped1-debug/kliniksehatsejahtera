/* =============================================================
 * forms.js — Pendaftaran, testimoni, kontak
 * Alur: validasi → simpan ke Google Sheets (Apps Script)
 *        → buka WhatsApp berisi ringkasan → antrean dikonfirmasi admin
 * Bila offline / server gagal: data diantrekan di perangkat dan
 * WhatsApp tetap terbuka supaya pasien tidak kehilangan layanan.
 * ============================================================= */
(function () {
  'use strict';
  var CFG = window.KLINIK || {};
  var QKEY = 'klinik-queue-v1';

  /* ------------------------------------------------- utilities */
  function $(s, r) { return (r || document).querySelector(s); }
  function status(el, type, msg) {
    if (!el) return;
    el.className = 'fstatus show ' + type;
    el.innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/>' +
      (type === 'ok' ? '<path d="m8.5 12 2.5 2.5L16 9.5"/>' : '<path d="M12 8v5M12 16h.01"/>') + '</svg><div>' + msg + '</div>';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function normHp(v) {
    var d = String(v || '').replace(/[^0-9]/g, '');
    if (d.indexOf('0') === 0) d = '62' + d.slice(1);
    else if (d.indexOf('8') === 0) d = '62' + d;
    return d;
  }
  function markInvalid(field, bad) {
    var f = field.closest('.field');
    if (f) f.classList.toggle('invalid', bad);
  }
  function validate(form) {
    var ok = true, first = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      var bad = false;
      if (el.type === 'checkbox') bad = !el.checked;
      else if (el.type === 'radio') bad = !form.querySelector('[name="' + el.name + '"]:checked');
      else if (el.type === 'tel') bad = normHp(el.value).length < 10;
      else bad = !String(el.value).trim();
      if (bad) { ok = false; if (!first) first = el; }
      markInvalid(el, bad);
    });
    if (first) first.focus();
    return ok;
  }
  function data(form) {
    var o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o;
  }

  /* ---------------------------------------- kirim ke Apps Script */
  function send(payload) {
    if (!CFG.gasUrl || CFG.gasUrl.indexOf('GANTI_DENGAN') > -1) {
      return Promise.reject(new Error('BELUM_DIKONFIGURASI'));
    }
    var ctl = new AbortController();
    var to = setTimeout(function () { ctl.abort(); }, 12000);
    return fetch(CFG.gasUrl, {
      method: 'POST',
      // text/plain menghindari CORS preflight ke Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctl.signal
    }).then(function (r) {
      clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'Gagal menyimpan');
      return j;
    });
  }

  /* ------------------------------------------- antrean offline */
  function queue(payload) {
    try {
      var q = JSON.parse(localStorage.getItem(QKEY) || '[]');
      q.push({ at: Date.now(), payload: payload });
      localStorage.setItem(QKEY, JSON.stringify(q.slice(-20)));
    } catch (e) {}
  }
  function flush() {
    var q;
    try { q = JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { return; }
    if (!q.length) return;
    var rest = [];
    var jobs = q.map(function (item) {
      return send(item.payload).catch(function () { rest.push(item); });
    });
    Promise.all(jobs).then(function () {
      try { localStorage.setItem(QKEY, JSON.stringify(rest)); } catch (e) {}
      if (rest.length < q.length && window.toast) window.toast('Data yang tertunda berhasil dikirim.');
    });
  }
  addEventListener('online', flush);
  if (navigator.onLine) setTimeout(flush, 2500);

  /** Nomor tujuan: khusus per layanan bila ada (mis. Khitan), jika tidak pakai nomor utama. */
  function waTarget(layanan) {
    var m = (CFG.waByService || {})[layanan];
    return (m && m.number) || CFG.waNumber || '';
  }

  function openWa(text, layanan) {
    var url = 'https://wa.me/' + waTarget(layanan) + '?text=' + encodeURIComponent(text);
    var w = window.open(url, '_blank');
    if (!w) location.href = url;
  }

  /* ============================================ PENDAFTARAN === */
  var fDaftar = $('#form-daftar');
  if (fDaftar) {
    // prefill layanan dari query ?layanan=
    var pre = new URLSearchParams(location.search).get('layanan');
    if (pre) {
      var r = fDaftar.querySelector('[name="layanan"][value="' + CSS.escape(pre) + '"]');
      if (r) r.checked = true;
    }
    // batasi tanggal kunjungan: hari ini s/d 30 hari ke depan
    var tgl = $('#tanggal');
    if (tgl) {
      var t = new Date(), max = new Date(Date.now() + 30 * 864e5);
      tgl.min = t.toISOString().slice(0, 10);
      tgl.max = max.toISOString().slice(0, 10);
      if (!tgl.value) tgl.value = tgl.min;
    }
    /* Layanan tertentu (khitan, bekam, vaksinasi umrah/haji) punya admin
       sendiri. Catatannya ikut nama & nomor layanan yang dipilih. */
    var noteKhusus = $('#note-khusus');
    function syncNote() {
      if (!noteKhusus) return;
      var sel = fDaftar.querySelector('[name="layanan"]:checked');
      var m = sel && (CFG.waByService || {})[sel.value];
      noteKhusus.style.display = m ? 'flex' : 'none';
      if (!m) return;
      var lay = $('#note-khusus-lay'), no = $('#note-khusus-no');
      if (lay) lay.textContent = sel.value;
      if (no) no.textContent = m.display || '';
    }
    fDaftar.addEventListener('change', syncNote);
    syncNote();

    /* Petunjuk & aturan isian mengikuti jenis kartu yang dipilih.
       Nomor rekam medis sengaja dibiarkan bebas bentuk — di klinik
       nomornya bisa pendek dan memakai huruf ("RM-00123"), jadi kalau
       dipaksa 6 digit angka seperti kartu lain, isiannya akan terbuang. */
    var jk = $('#jenisKartu'), nk = $('#noKartu');
    var DAFTAR_KARTU = CFG.jenisKartu || [];
    var kartuAktif = function () {
      var v = jk ? jk.value : '';
      return DAFTAR_KARTU.filter(function (k) { return k.v === v; })[0] || DAFTAR_KARTU[0] || { format: 'angka', min: 6 };
    };

    fDaftar.addEventListener('input', function (e) {
      if (e.target.matches('[required]')) markInvalid(e.target, false);
      if (e.target.id === 'noKartu') {
        var k = kartuAktif();
        e.target.value = k.format === 'bebas'
          ? e.target.value.replace(/[^A-Za-z0-9 ./-]/g, '').slice(0, 30)
          : e.target.value.replace(/[^0-9]/g, '').slice(0, 20);
        markInvalid(e.target, false);
      }
    });

    function syncKartu() {
      if (!jk || !nk) return;
      var k = kartuAktif();
      nk.placeholder = k.ph || 'Nomor kartu';
      nk.inputMode = k.format === 'bebas' ? 'text' : 'numeric';
      var hint = nk.parentNode.querySelector('.hint');
      if (hint) {
        hint.textContent = k.h
          ? 'Opsional — ' + k.h
          : 'Opsional — ' + String(k.ph || 'nomor kartu').toLowerCase() + '. Bisa juga diisi saat datang.';
      }
      /* Nomor yang sudah diketik untuk jenis lain ikut dibersihkan
         agar tidak terbawa dalam bentuk yang tidak sah. */
      if (nk.value) nk.value = k.format === 'bebas'
        ? nk.value.replace(/[^A-Za-z0-9 ./-]/g, '').slice(0, 30)
        : nk.value.replace(/[^0-9]/g, '').slice(0, 20);
      markInvalid(nk, false);
    }
    if (jk) { jk.addEventListener('change', syncKartu); syncKartu(); }

    /** Pesan kesalahan bila nomor tidak cocok dengan jenis kartunya. */
    function salahKartu(k, nilai) {
      if (!nilai) return '';
      if (k.format === 'bebas') {
        return nilai.length < (k.min || 3)
          ? 'Nomor rekam medis terlalu pendek. Kosongkan saja bila belum ingat — bisa dicari petugas saat Anda datang.' : '';
      }
      if (k.panjang && nilai.length !== k.panjang) {
        return 'Nomor ' + (k.l || k.v) + ' harus ' + k.panjang + ' digit. Kosongkan saja bila belum ingat — bisa diisi saat datang.';
      }
      if (!k.panjang && nilai.length < (k.min || 6)) return 'Nomor kartu terlalu pendek. Kosongkan saja bila belum ingat.';
      return '';
    }

    fDaftar.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = $('#reg-status');
      if (!validate(fDaftar)) { status(box, 'bad', 'Beberapa kolom masih kosong atau belum benar. Periksa bagian yang ditandai merah.'); return; }

      var d = data(fDaftar);
      d.hp = normHp(d.hp);

      // Nomor kartu bersifat opsional, tetapi bila diisi harus masuk akal
      var elKartu = $('#noKartu');
      if (elKartu && d.noKartu) {
        var pesanKartu = salahKartu(kartuAktif(), d.noKartu);
        if (pesanKartu) {
          markInvalid(elKartu, true);
          status(box, 'bad', pesanKartu);
          elKartu.focus();
          return;
        }
      }
      var payload = { action: 'pendaftaran', data: d, meta: { ts: new Date().toISOString(), ua: navigator.userAgent.slice(0, 120), src: new URLSearchParams(location.search).get('src') || 'web' } };

      var pesan =
        '*PENDAFTARAN PASIEN — KLINIK PRATAMA SEHAT SEJAHTERA*\n' +
        '━━━━━━━━━━━━━━━━━━━━\n' +
        '*Nama*\t\t: ' + d.nama + '\n' +
        '*Umur*\t\t: ' + d.umur + '\n' +
        '*Alamat*\t: ' + d.alamat + '\n' +
        (d.noKartu ? '*' + (d.jenisKartu || 'Kartu') + '*\t: \u2022\u2022\u2022\u2022 ' + d.noKartu.slice(-4) + ' _(nomor lengkap ada di sistem)_\n' : '') +
        '*Keluhan*\t: ' + d.keluhan + '\n' +
        '━━━━━━━━━━━━━━━━━━━━\n' +
        '*Layanan*\t: ' + d.layanan + '\n' +
        '*Jadwal*\t: ' + d.tanggal + ' — ' + d.sesi + '\n' +
        '*No. WA*\t: ' + d.hp + '\n\n' +
        'Mohon dikonfirmasi nomor antreannya. Terima kasih 🙏';

      var btn = $('#btn-daftar');
      if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan…'; }

      send(payload).then(function (res) {
        status(box, 'ok', '<strong>Pendaftaran tersimpan.</strong>' + (res.antrean ? ' Nomor antrean sementara Anda: <strong>' + res.antrean + '</strong>.' : '') + ' WhatsApp akan terbuka — cukup tekan kirim agar admin mengonfirmasi.');
        openWa(pesan + (res.antrean ? '\n\n_Kode pendaftaran: ' + res.antrean + '_' : ''), d.layanan);
        fDaftar.reset();
      }).catch(function (err) {
        queue(payload);
        var belum = err && err.message === 'BELUM_DIKONFIGURASI';
        status(box, belum ? 'ok' : 'bad',
          belum
            ? '<strong>Mode demo.</strong> URL Apps Script belum dipasang, jadi data belum masuk spreadsheet — namun WhatsApp tetap terbuka berisi ringkasan pendaftaran Anda.'
            : '<strong>Data disimpan sementara di perangkat Anda</strong> karena koneksi ke server sedang bermasalah. WhatsApp tetap dibuka agar admin bisa langsung memproses pendaftaran Anda.');
        openWa(pesan, d.layanan);
      }).then(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Kirim Pendaftaran'; }
      });
    });
  }

  /* ============================================== TESTIMONI === */
  var fTesti = $('#form-testimoni');
  if (fTesti) {
    fTesti.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = $('#testi-status');
      if (!validate(fTesti)) { status(box, 'bad', 'Lengkapi dulu kolom yang ditandai.'); return; }
      var d = data(fTesti);
      send({ action: 'testimoni', data: d, meta: { ts: new Date().toISOString() } })
        .then(function () { status(box, 'ok', '<strong>Terima kasih!</strong> Testimoni Anda kami terima dan akan tayang setelah dimoderasi.'); fTesti.reset(); })
        .catch(function (err) {
          queue({ action: 'testimoni', data: d, meta: { ts: new Date().toISOString() } });
          status(box, err.message === 'BELUM_DIKONFIGURASI' ? 'ok' : 'bad',
            err.message === 'BELUM_DIKONFIGURASI'
              ? '<strong>Mode demo.</strong> Testimoni belum terkirim ke spreadsheet karena URL Apps Script belum dipasang.'
              : 'Testimoni disimpan sementara dan akan dikirim otomatis saat koneksi pulih.');
        });
    });
  }

  /* ================================================= KONTAK === */

  /* ============================================ TOP DOKTER === */
  var fTop = $('#form-topdokter');
  if (fTop) {
    var tdKartu = $('#td-jenisKartu'), tdNo = $('#td-noKartu');
    function tdSync() {
      if (!tdKartu || !tdNo) return;
      var bpjs = tdKartu.value === 'BPJS';
      tdNo.placeholder = bpjs ? '13 digit nomor kartu BPJS' : '16 digit NIK pada KTP';
      tdNo.dataset.panjang = bpjs ? '13' : '16';
      var hint = tdNo.parentNode.querySelector('.hint');
      if (hint) hint.textContent = bpjs ? 'Nomor kartu BPJS, 13 digit.' : 'Nomor NIK pada KTP, 16 digit.';
    }
    if (tdKartu) { tdKartu.addEventListener('change', tdSync); tdSync(); }

    fTop.addEventListener('input', function (e) {
      if (e.target.matches('[required]')) markInvalid(e.target, false);
      if (e.target.id === 'td-noKartu') e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 20);
    });

    fTop.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = $('#td-status');
      if (!validate(fTop)) { status(box, 'bad', 'Beberapa kolom masih kosong atau belum benar. Periksa bagian yang ditandai merah.'); return; }

      var d = data(fTop);
      d.hp = normHp(d.hp);

      var wajib = Number((tdNo && tdNo.dataset.panjang) || 0);
      if (wajib && d.noKartu.length !== wajib) {
        markInvalid(tdNo, true);
        status(box, 'bad', 'Nomor ' + d.jenisKartu + ' harus ' + wajib + ' digit.');
        tdNo.focus(); return;
      }

      var berat = parseFloat(d.berat);
      if (!(berat > 0 && berat <= 300)) {
        markInvalid($('#td-berat'), true);
        status(box, 'bad', 'Berat badan belum masuk akal. Isi dalam kilogram, contoh: 58.');
        $('#td-berat').focus(); return;
      }

      var payload = { action: 'topdokter', data: d, meta: { ts: new Date().toISOString(), src: 'top-dokter' } };

      var pesan =
        '*KONSULTASI TOP DOKTER — KLINIK PRATAMA SEHAT SEJAHTERA*\n' +
        '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
        '*Kartu*\t\t: ' + d.jenisKartu + ' — ' + d.noKartu + '\n' +
        '*Nama*\t\t: ' + d.nama + '\n' +
        '*Umur*\t\t: ' + d.umur + '\n' +
        '*Berat badan*\t: ' + d.berat + ' kg\n' +
        '*Alamat*\t: ' + d.alamat + '\n' +
        '*Bentuk obat*\t: ' + d.jenisObat + '\n' +
        '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
        '*Keluhan*\n' + d.keluhan + '\n\n' +
        '*No. WA*\t: ' + d.hp + '\n\n' +
        'Mohon dibantu konsultasinya. Terima kasih \ud83d\ude4f';

      var btn = $('#btn-topdokter');
      if (btn) { btn.disabled = true; btn.textContent = 'Menyiapkan…'; }

      send(payload).then(function () {
        status(box, 'ok', '<strong>Data pasien tersimpan.</strong> WhatsApp admin Top Dokter akan terbuka — cukup tekan kirim agar dokter segera menerima keluhan Anda.');
        openWa(pesan, 'Top Dokter');
        fTop.reset(); tdSync();
      }).catch(function (err) {
        queue(payload);
        var belum = err && err.message === 'BELUM_DIKONFIGURASI';
        status(box, belum ? 'ok' : 'bad', belum
          ? '<strong>Mode demo.</strong> URL Apps Script belum dipasang, jadi data belum masuk spreadsheet — namun WhatsApp tetap terbuka berisi ringkasan konsultasi Anda.'
          : '<strong>Data disimpan sementara di perangkat Anda</strong> karena koneksi sedang bermasalah. WhatsApp tetap dibuka agar admin bisa langsung memproses.');
        openWa(pesan, 'Top Dokter');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || 'Kirim ke Admin Top Dokter'; }
      });
    });

    var btnTd = $('#btn-topdokter');
    if (btnTd) btnTd.dataset.label = btnTd.innerHTML;
  }

  var fKontak = $('#form-kontak');
  if (fKontak) {
    fKontak.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = $('#kontak-status');
      if (!validate(fKontak)) { status(box, 'bad', 'Lengkapi dulu kolom yang ditandai.'); return; }
      var d = data(fKontak); d.hp = normHp(d.hp);
      var pesan = '*PESAN DARI WEBSITE*\nNama: ' + d.nama + '\nNo. WA: ' + d.hp + '\nPerihal: ' + (d.subjek || '-') + '\n\n' + d.pesan;
      send({ action: 'kontak', data: d, meta: { ts: new Date().toISOString() } })
        .then(function () { status(box, 'ok', '<strong>Pesan terkirim.</strong> Admin kami akan membalas pada jam praktik.'); fKontak.reset(); })
        .catch(function () { openWa(pesan); status(box, 'ok', 'Pesan Anda kami teruskan lewat WhatsApp — cukup tekan kirim.'); });
    });
  }
})();
