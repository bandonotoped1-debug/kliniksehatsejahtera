/** ============================================================
 *  KLINIK PRATAMA SEHAT SEJAHTERA — BACKEND GOOGLE APPS SCRIPT
 *  ------------------------------------------------------------
 *  Satu file, tanpa dependensi. Berfungsi sebagai:
 *    • REST endpoint untuk website (doGet / doPost)
 *    • Lapisan akses ke Google Spreadsheet (database)
 *    • Autentikasi panel admin berbasis token sesi
 *    • Pengirim rekap otomatis (email / WhatsApp gateway / webhook AI)
 *
 *  LANGKAH PASANG (sekali saja):
 *   1. Buat Spreadsheet baru → Extensions → Apps Script
 *   2. Tempel seluruh isi file ini, simpan
 *   3. Jalankan fungsi  setup()  sekali (beri izin saat diminta)
 *   4. Project Settings → Script Properties, isi:
 *        ADMIN_USER      = admin
 *        ADMIN_PASS_HASH = (hasil dari fungsi buatHash("katasandiAnda"))
 *        ADMIN_EMAIL     = email penerima rekap
 *        WA_ADMIN        = 6289653502700
 *        WA_ADMIN_KHITAN = 6287840301148   (admin khusus layanan khitan)
 *        WA_TOPDOKTER    = 6285755591040   (admin konsultasi Top Dokter)
 *        WA_GATEWAY_URL  = (opsional) endpoint Fonnte/Wablas
 *        WA_GATEWAY_TOKEN= (opsional) token gateway
 *        AI_WEBHOOK_URL  = (opsional) webhook n8n / chatbot AI
 *   5. Deploy → New deployment → Web app
 *        Execute as     : Me
 *        Who has access : Anyone
 *   6. Salin URL /exec → tempel ke src/data/site.js → CONFIG.gasUrl
 *      lalu jalankan `node build.js`
 * ============================================================ */

var SHEETS = {
  PENDAFTARAN: 'Pendaftaran',
  TESTIMONI:   'Testimoni',
  PESAN:       'Pesan',
  TOPDOKTER:   'TopDokter',
  ANTREAN:     'AntreanHari',   // data harian, dikosongkan tiap pergantian hari
  KONTEN:      'Konten',        // CMS: menu, layanan, dokter, artikel, dll.
  LOG:         'Log'
};

var HEADERS = {
  Pendaftaran: ['id','ts','nama','umur','alamat','keluhan','hp','jenisKartu','noKartu','layanan','tanggal','sesi','status','catatan','sumber'],
  Testimoni:   ['id','ts','nama','area','layanan','rating','pesan','izin','status'],
  Pesan:       ['id','ts','nama','hp','subjek','pesan','status'],
  TopDokter:   ['id','ts','jenisKartu','noKartu','nama','umur','berat','alamat','jenisObat','keluhan','hp','status','catatan'],
  AntreanHari: ['id','tanggal','ts','poli','no','kode','nama','umur','alamat','keluhan','hp','jenisKartu','noKartu','sumber','status','panggil','kembaliSetelah','catatan'],
  Konten:      ['koleksi','id','urut','data','aktif','updated','oleh'],
  Log:         ['ts','aksi','detail','ip']
};

/* =================================================== UTIL === */
function props_()   { return PropertiesService.getScriptProperties(); }
function ss_()      { return SpreadsheetApp.getActiveSpreadsheet(); }
function json_(o)   { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function tz_()      { return 'Asia/Jakarta'; }
function now_()     { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm:ss"); }
function today_()   { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    sh.appendRow(HEADERS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#E9F6D3');
  }
  return sh;
}

function rows_(name) {
  var sh = sheet_(name);
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var head = vals[0];
  return vals.slice(1).map(function (r) {
    var o = {};
    head.forEach(function (h, i) {
      var v = r[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz_(), h === 'ts' ? "yyyy-MM-dd'T'HH:mm:ss" : 'yyyy-MM-dd');
      o[h] = v === '' ? '' : v;
    });
    return o;
  });
}

function nextId_(name, prefix) {
  var sh = sheet_(name);
  var n = Math.max(0, sh.getLastRow() - 1) + 1;
  return prefix + '-' + today_().replace(/-/g, '').slice(2) + '-' + ('000' + n).slice(-3);
}

function log_(aksi, detail) {
  try { sheet_(SHEETS.LOG).appendRow([now_(), aksi, String(detail).slice(0, 500), '']); } catch (e) {}
}

function str_(v) { return String(v == null ? '' : v).trim(); }

/** Bersihkan input agar tidak ada formula injection di spreadsheet. */
function safe_(v) {
  var s = str_(v).slice(0, 2000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** Nomor kartu/NIK: hanya angka, maksimal 20 digit. Kosong bila tidak diisi. */
function noKartu_(v) {
  var d = String(v == null ? '' : v).replace(/[^0-9]/g, '').slice(0, 20);
  return d.length >= 6 ? "'" + d : '';   // awalan ' agar Spreadsheet tidak mengubahnya jadi notasi ilmiah
}

function normHp_(v) {
  var d = str_(v).replace(/[^0-9]/g, '');
  if (d.indexOf('0') === 0) d = '62' + d.slice(1);
  else if (d.indexOf('8') === 0) d = '62' + d;
  return d;
}

/* ================================================== SETUP === */
function setup() {
  Object.keys(HEADERS).forEach(function (n) { sheet_(n); });
  var p = props_();
  if (!p.getProperty('ADMIN_USER')) p.setProperty('ADMIN_USER', 'admin');
  if (!p.getProperty('ADMIN_PASS_HASH')) {
    // kata sandi awal: ubahsaya123  — SEGERA GANTI
    p.setProperty('ADMIN_PASS_HASH', buatHash('ubahsaya123'));
  }
  if (!p.getProperty('WA_ADMIN')) p.setProperty('WA_ADMIN', '6289653502700');
  if (!p.getProperty('WA_ADMIN_KHITAN')) p.setProperty('WA_ADMIN_KHITAN', '6287840301148');
  if (!p.getProperty('WA_TOPDOKTER')) p.setProperty('WA_TOPDOKTER', '6285755591040');
  pasangTriggerRekap();
  pasangTriggerResetAntrean();
  Logger.log('Setup selesai. Kata sandi awal: ubahsaya123 — segera ganti lewat buatHash().');
}

/** Jalankan manual di editor untuk membuat hash kata sandi baru. */
function buatHash(katasandi) {
  var salt = props_().getProperty('SALT');
  if (!salt) { salt = Utilities.getUuid(); props_().setProperty('SALT', salt); }
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + katasandi, Utilities.Charset.UTF_8);
  var hash = raw.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  Logger.log('ADMIN_PASS_HASH = ' + hash);
  return hash;
}

/* ================================================== AUTH === */
function cekLogin_(user, pass) {
  var p = props_();
  var gagal = Number(CacheService.getScriptCache().get('gagal_' + user) || 0);
  if (gagal >= 5) throw new Error('Terlalu banyak percobaan. Coba lagi 15 menit lagi.');
  if (str_(user) !== str_(p.getProperty('ADMIN_USER')) || buatHashDiam_(pass) !== p.getProperty('ADMIN_PASS_HASH')) {
    CacheService.getScriptCache().put('gagal_' + user, String(gagal + 1), 900);
    log_('login-gagal', user);
    throw new Error('Nama pengguna atau kata sandi salah.');
  }
  CacheService.getScriptCache().remove('gagal_' + user);
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('sesi_' + token, user, 21600); // 6 jam
  log_('login-sukses', user);
  return { token: token, user: user };
}

function buatHashDiam_(katasandi) {
  var salt = props_().getProperty('SALT') || '';
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + str_(katasandi), Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function wajibAdmin_(token) {
  var u = token ? CacheService.getScriptCache().get('sesi_' + token) : null;
  if (!u) throw new Error('Sesi berakhir. Silakan masuk kembali.');
  return u;
}

/* ================================================== ROUTES === */
function doGet(e) {
  var a = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    if (a === 'ping') return json_({ ok: true, service: 'Klinik SSS API', time: now_() });
    if (a === 'testimoni') {
      // testimoni publik yang sudah dimoderasi
      var list = rows_(SHEETS.TESTIMONI)
        .filter(function (t) { return t.status === 'Tayang'; })
        .slice(-12)
        .map(function (t) { return { nama: t.nama, area: t.area, service: t.layanan, rating: Number(t.rating) || 5, text: t.pesan }; });
      return json_({ ok: true, data: list });
    }
    if (a === 'slot') return json_({ ok: true, data: hitungSlot_(e.parameter.tanggal || today_()) });
    if (a === 'antrean') return json_(antreanPublik_());
    if (a === 'konten') return json_(kontenPublik_());
    if (a === 'cekAntrean') return json_(antreanCek_(e.parameter.kode));
    return json_({ ok: false, error: 'Aksi tidak dikenal' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) {}
  var action = str_(body.action);
  var d = body.data || {};

  try {
    switch (action) {
      case 'pendaftaran':     return json_(simpanPendaftaran_(d, body.meta || {}));
      case 'testimoni':       return json_(simpanTestimoni_(d));
      case 'kontak':          return json_(simpanPesan_(d));
      case 'topdokter':       return json_(simpanTopDokter_(d));
      case 'login':           return json_(Object.assign({ ok: true }, cekLogin_(d.user, d.pass)));
      case 'list':            wajibAdmin_(body.token); return json_(daftarSemua_());
      case 'updateStatus':    wajibAdmin_(body.token); return json_(ubahStatus_(SHEETS.PENDAFTARAN, d.id, d.status, d.catatan));
      case 'updateTestimoni': wajibAdmin_(body.token); return json_(ubahStatus_(SHEETS.TESTIMONI, d.id, d.status));
      case 'kirimRekap':      wajibAdmin_(body.token); kirimRekapHarian(); return json_({ ok: true });

      /* ------------------------------------------------ ANTREAN */
      case 'antrean':         return json_(antreanPublik_());
      case 'cekAntrean':      return json_(antreanCek_(d.kode));
      case 'antreanDaftar':   return json_(antreanTambah_(d, 'online'));
      case 'antreanAdmin':    wajibAdmin_(body.token); return json_(antreanAdmin_());
      case 'antreanTambah':   wajibAdmin_(body.token); return json_(antreanTambah_(d, d.sumber === 'online' ? 'online' : 'offline'));
      case 'antreanBuka':     wajibAdmin_(body.token); return json_(antreanBukaOnline_(d.buka));
      case 'antreanAksi':     wajibAdmin_(body.token); return json_(antreanAksi_(d));
      case 'antreanReset':    wajibAdmin_(body.token); resetAntreanHarian(); return json_({ ok: true });

      /* ------------------------------------------------- KONTEN */
      case 'konten':          return json_(kontenPublik_());
      case 'kontenAdmin':     wajibAdmin_(body.token); return json_(kontenAdmin_());
      case 'kontenSimpan':    return json_(kontenSimpan_(d, wajibAdmin_(body.token)));
      case 'kontenHapus':     return json_(kontenHapus_(d, wajibAdmin_(body.token)));
      case 'kontenUrut':      return json_(kontenUrut_(d, wajibAdmin_(body.token)));
      case 'kontenSeed':      return json_(kontenSeed_(d, wajibAdmin_(body.token)));
      case 'kontenTerbitkan': return json_(kontenTerbitkan_(wajibAdmin_(body.token)));
      case 'kontenSetHook':   return json_(kontenSetHook_(d, wajibAdmin_(body.token)));
      default: return json_({ ok: false, error: 'Aksi tidak dikenal: ' + action });
    }
  } catch (err) {
    log_('error', action + ' :: ' + err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ============================================ PENDAFTARAN === */
function simpanPendaftaran_(d, meta) {
  if (!str_(d.nama) || !str_(d.umur) || !str_(d.alamat) || !str_(d.keluhan)) throw new Error('Data pasien belum lengkap (nama, umur, alamat, keluhan).');
  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var id = nextId_(SHEETS.PENDAFTARAN, 'REG');
    var hp = normHp_(d.hp);
    sheet_(SHEETS.PENDAFTARAN).appendRow([
      id, now_(), safe_(d.nama), safe_(d.umur), safe_(d.alamat), safe_(d.keluhan),
      hp, safe_(d.jenisKartu), noKartu_(d.noKartu), safe_(d.layanan), safe_(d.tanggal), safe_(d.sesi),
      'Baru', '', safe_(meta.src || 'web')
    ]);
    var antrean = hitungAntrean_(d.tanggal, d.sesi);
    notifikasiAdmin_(id, d, antrean);
    kirimKeChatbotAI_({ event: 'pendaftaran_baru', id: id, data: d, antrean: antrean });
    return { ok: true, id: id, antrean: antrean };
  } finally { lock.releaseLock(); }
}

/** Nomor urut sementara pada tanggal + sesi yang sama. */
function hitungAntrean_(tanggal, sesi) {
  var tgl = str_(tanggal) || today_();
  var n = rows_(SHEETS.PENDAFTARAN).filter(function (r) {
    return str_(r.tanggal).slice(0, 10) === tgl && str_(r.sesi) === str_(sesi) && r.status !== 'Batal';
  }).length;
  var kode = /Pagi/i.test(str_(sesi)) ? 'P' : /Sore|Malam/i.test(str_(sesi)) ? 'S' : 'F';
  return kode + ('00' + n).slice(-2);
}

/** Sisa kuota per sesi — dipakai halaman publik bila ingin menampilkan slot. */
function hitungSlot_(tanggal) {
  var KUOTA = { 'Pagi': 40, 'Sore': 40 };
  var list = rows_(SHEETS.PENDAFTARAN).filter(function (r) { return str_(r.tanggal).slice(0, 10) === tanggal && r.status !== 'Batal'; });
  var pagi = list.filter(function (r) { return /Pagi/i.test(str_(r.sesi)); }).length;
  var sore = list.filter(function (r) { return /Sore|Malam/i.test(str_(r.sesi)); }).length;
  return { tanggal: tanggal, pagi: Math.max(0, KUOTA.Pagi - pagi), sore: Math.max(0, KUOTA.Sore - sore) };
}

/* =============================================== TESTIMONI === */
function simpanTestimoni_(d) {
  if (!str_(d.nama) || !str_(d.pesan)) throw new Error('Testimoni belum lengkap.');
  var id = nextId_(SHEETS.TESTIMONI, 'TST');
  sheet_(SHEETS.TESTIMONI).appendRow([
    id, now_(), safe_(d.nama), safe_(d.area), safe_(d.layanan), safe_(d.rating), safe_(d.pesan), safe_(d.izin), 'Menunggu'
  ]);
  kirimKeChatbotAI_({ event: 'testimoni_baru', id: id, data: d });
  return { ok: true, id: id };
}

/* =================================================== PESAN === */
function simpanPesan_(d) {
  if (!str_(d.nama) || !str_(d.pesan)) throw new Error('Pesan belum lengkap.');
  var id = nextId_(SHEETS.PESAN, 'MSG');
  sheet_(SHEETS.PESAN).appendRow([id, now_(), safe_(d.nama), normHp_(d.hp), safe_(d.subjek), safe_(d.pesan), 'Baru']);
  notifikasiEmail_('Pesan baru dari website', d.nama + ' (' + d.hp + ')\nPerihal: ' + d.subjek + '\n\n' + d.pesan);
  kirimKeChatbotAI_({ event: 'pesan_baru', id: id, data: d });
  return { ok: true, id: id };
}


/* ================================================ TOP DOKTER === */
function simpanTopDokter_(d) {
  if (!str_(d.nama) || !str_(d.keluhan) || !str_(d.noKartu)) {
    throw new Error('Data Top Dokter belum lengkap (nama, nomor kartu, keluhan).');
  }
  var id = nextId_(SHEETS.TOPDOKTER, 'TD');
  var hp = normHp_(d.hp);
  sheet_(SHEETS.TOPDOKTER).appendRow([
    id, now_(), safe_(d.jenisKartu), noKartu_(d.noKartu), safe_(d.nama), safe_(d.umur),
    safe_(d.berat), safe_(d.alamat), safe_(d.jenisObat), safe_(d.keluhan), hp, 'Baru', ''
  ]);

  var teks = 'KONSULTASI TOP DOKTER BARU (' + id + ')\n' +
    safe_(d.nama) + ' · ' + safe_(d.umur) + ' · ' + safe_(d.berat) + ' kg\n' +
    safe_(d.jenisKartu) + ' ' + samarKartu_(d.noKartu) + '\n' +
    'Bentuk obat: ' + safe_(d.jenisObat) + '\n' +
    'Keluhan: ' + safe_(d.keluhan) + '\n' +
    'Balas ke: https://wa.me/' + hp;
  kirimWhatsApp_(props_().getProperty('WA_TOPDOKTER') || props_().getProperty('WA_ADMIN'), teks);
  notifikasiEmail_('Top Dokter baru — ' + safe_(d.nama), teks);
  kirimKeChatbotAI_({ event: 'topdokter_baru', id: id, data: d });
  return { ok: true, id: id };
}

/* =================================================== ADMIN === */
function daftarSemua_() {
  var batas = new Date(Date.now() - 60 * 864e5);
  var bStr = Utilities.formatDate(batas, tz_(), 'yyyy-MM-dd');
  return {
    ok: true,
    daftar: rows_(SHEETS.PENDAFTARAN).filter(function (r) { return str_(r.ts).slice(0, 10) >= bStr; }).reverse(),
    testi:  rows_(SHEETS.TESTIMONI).reverse(),
    pesan:  rows_(SHEETS.PESAN).reverse()
  };
}

function ubahStatus_(sheetName, id, status, catatan) {
  if (!id) throw new Error('ID tidak ditemukan.');
  var sh = sheet_(sheetName);
  var vals = sh.getDataRange().getValues();
  var head = vals[0];
  var cId = head.indexOf('id'), cSt = head.indexOf('status'), cCt = head.indexOf('catatan');
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][cId]) === String(id)) {
      sh.getRange(i + 1, cSt + 1).setValue(status);
      if (catatan && cCt > -1) sh.getRange(i + 1, cCt + 1).setValue(safe_(catatan));
      log_('ubah-status', sheetName + ' ' + id + ' → ' + status);
      return { ok: true };
    }
  }
  throw new Error('Data dengan ID ' + id + ' tidak ditemukan.');
}

/* ============================================= NOTIFIKASI === */
function samarKartu_(v) {
  var d = String(v || '').replace(/[^0-9]/g, '');
  return d ? '•••• ' + d.slice(-4) : '';
}

function notifikasiAdmin_(id, d, antrean) {
  var teks =
    '*PENDAFTARAN BARU* (' + id + ')\n' +
    'Antrean sementara: *' + antrean + '*\n' +
    '────────────────\n' +
    'Nama    : ' + d.nama + '\n' +
    'Umur    : ' + d.umur + '\n' +
    'Alamat  : ' + d.alamat + '\n' +
    'Keluhan : ' + d.keluhan + '\n' +
    '────────────────\n' +
    'Layanan : ' + d.layanan + '\n' +
    'Jadwal  : ' + d.tanggal + ' — ' + d.sesi + '\n' +
    'No. WA  : ' + normHp_(d.hp);
  // Layanan tertentu punya admin khusus (mis. Khitan)
  var tujuan = /khitan/i.test(str_(d.layanan))
    ? (props_().getProperty('WA_ADMIN_KHITAN') || props_().getProperty('WA_ADMIN'))
    : props_().getProperty('WA_ADMIN');
  kirimWhatsApp_(tujuan, teks);
  notifikasiEmail_('Pendaftaran baru — ' + d.nama + ' (' + d.layanan + ')', teks.replace(/\*/g, ''));
}

function notifikasiEmail_(subjek, isi) {
  var to = props_().getProperty('ADMIN_EMAIL');
  if (!to) return;
  try { MailApp.sendEmail(to, '[Klinik SSS] ' + subjek, isi); } catch (e) { log_('email-gagal', e); }
}

/**
 * Kirim WhatsApp lewat gateway pihak ketiga (Fonnte / Wablas / WA Business API).
 * Kosongkan WA_GATEWAY_URL bila belum berlangganan — fungsi ini akan dilewati
 * dan admin tetap menerima notifikasi email.
 */
function kirimWhatsApp_(tujuan, pesan) {
  var url = props_().getProperty('WA_GATEWAY_URL');
  var token = props_().getProperty('WA_GATEWAY_TOKEN');
  if (!url || !tujuan) return;
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      headers: token ? { Authorization: token } : {},
      payload: { target: tujuan, message: pesan },
      muteHttpExceptions: true
    });
  } catch (e) { log_('wa-gagal', e); }
}

/**
 * Teruskan event ke Chatbot AI / n8n untuk pengolahan lanjutan
 * (klasifikasi keluhan, balasan otomatis, rekap pintar ke admin).
 */
function kirimKeChatbotAI_(payload) {
  var url = props_().getProperty('AI_WEBHOOK_URL');
  if (!url) return;
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) { log_('ai-gagal', e); }
}

/* ================================================== REKAP === */


/* =================================================================
 * KONTEN (CMS) — menu, layanan, dokter, fasilitas, artikel, dll.
 * -----------------------------------------------------------------
 * Disimpan di sheet "Konten": satu baris = satu item.
 *   koleksi | id | urut | data(JSON) | aktif | updated | oleh
 *
 * build.js menarik seluruh isinya saat situs dibangun, lalu
 * menimpa data bawaan di src/data/site.js. Bila endpoint ini tidak
 * terjangkau, build tetap berjalan memakai data bawaan.
 * ================================================================= */

var KOLEKSI = ['nav','services','doctors','apoteker','facilities','partners','pharmacies','produk','articles','config'];

function cekKoleksi_(k) {
  if (KOLEKSI.indexOf(str_(k)) < 0) throw new Error('Koleksi tidak dikenal: ' + str_(k));
  return str_(k);
}

/** Seluruh konten, dikelompokkan per koleksi & diurutkan. */
function kontenSemua_(sertakanNonaktif) {
  var out = {};
  KOLEKSI.forEach(function (k) { out[k] = []; });

  rows_(SHEETS.KONTEN).forEach(function (r) {
    var k = str_(r.koleksi);
    if (!out[k]) return;
    if (!sertakanNonaktif && String(r.aktif).toLowerCase() === 'tidak') return;
    var obj = null;
    try { obj = JSON.parse(r.data); } catch (x) { return; }
    if (!obj || typeof obj !== 'object') return;
    obj.__id = str_(r.id);
    obj.__urut = Number(r.urut) || 0;
    obj.__aktif = String(r.aktif).toLowerCase() !== 'tidak';
    out[k].push(obj);
  });

  KOLEKSI.forEach(function (k) {
    out[k].sort(function (a, b) { return a.__urut - b.__urut; });
  });
  return out;
}

/** Dipakai build.js — tanpa token, hanya membaca. */
function kontenPublik_() {
  var m = kontenMeta_();
  return { ok: true, waktu: now_(), terbitTerakhir: m.terbitTerakhir || '',
           perubahan: Number(m.perubahan) || 0, konten: kontenSemua_(false) };
}

/** Dipakai panel admin — termasuk item yang dinonaktifkan. */
function kontenAdmin_() {
  var m = kontenMeta_();
  return { ok: true, koleksi: KOLEKSI, konten: kontenSemua_(true),
           perubahan: Number(m.perubahan) || 0, terbitTerakhir: m.terbitTerakhir || '',
           adaBuildHook: !!props_().getProperty('NETLIFY_BUILD_HOOK') };
}

/* ------------------------------------------------------- META */
function kontenMeta_() {
  var raw = props_().getProperty('KONTEN_META');
  try { return raw ? JSON.parse(raw) : {}; } catch (x) { return {}; }
}
function simpanKontenMeta_(m) { props_().setProperty('KONTEN_META', JSON.stringify(m)); }

/** Setiap perubahan menaikkan penghitung "belum terbit". */
function tandaiBerubah_() {
  var m = kontenMeta_();
  m.perubahan = (Number(m.perubahan) || 0) + 1;
  m.ubahTerakhir = now_();
  simpanKontenMeta_(m);
}

/* --------------------------------------------------- SIMPAN */
function kontenSimpan_(d, user) {
  var koleksi = cekKoleksi_(d.koleksi);
  var id = str_(d.id);
  if (!id) throw new Error('ID item wajib diisi.');
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('ID hanya boleh huruf kecil, angka, dan tanda hubung. Contoh: poli-anak');

  var isi = d.data;
  if (typeof isi === 'string') { try { isi = JSON.parse(isi); } catch (x) { throw new Error('Data bukan JSON yang sah.'); } }
  if (!isi || typeof isi !== 'object') throw new Error('Data item kosong.');

  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var sh = sheet_(SHEETS.KONTEN);
    var head = HEADERS.Konten;
    var nilai = sh.getDataRange().getValues();
    var iKol = head.indexOf('koleksi'), iId = head.indexOf('id');
    var baris = -1;

    for (var i = 1; i < nilai.length; i++) {
      if (String(nilai[i][iKol]) === koleksi && String(nilai[i][iId]) === id) { baris = i + 1; break; }
    }

    // id lama diganti (rename) — hapus baris lama setelah menulis yang baru
    var idLama = str_(d.idLama);
    var urut = Number(d.urut);
    if (!urut) {
      if (baris > 0) urut = Number(nilai[baris - 1][head.indexOf('urut')]) || 0;
      else urut = (kontenSemua_(true)[koleksi].length + 1) * 10;
    }
    var aktif = d.aktif === false ? 'tidak' : 'ya';
    var isiRow = [koleksi, id, urut, JSON.stringify(isi), aktif, now_(), str_(user)];

    if (baris > 0) sh.getRange(baris, 1, 1, head.length).setValues([isiRow]);
    else sh.appendRow(isiRow);

    if (idLama && idLama !== id) kontenHapus_({ koleksi: koleksi, id: idLama }, user, true);

    tandaiBerubah_();
    log_('konten-simpan', koleksi + '/' + id + ' oleh ' + str_(user));
    return { ok: true, koleksi: koleksi, id: id, urut: urut };
  } finally { lock.releaseLock(); }
}

/* ---------------------------------------------------- HAPUS */
function kontenHapus_(d, user, diam) {
  var koleksi = cekKoleksi_(d.koleksi);
  var id = str_(d.id);
  var sh = sheet_(SHEETS.KONTEN);
  var head = HEADERS.Konten;
  var nilai = sh.getDataRange().getValues();
  var iKol = head.indexOf('koleksi'), iId = head.indexOf('id');

  for (var i = nilai.length - 1; i >= 1; i--) {
    if (String(nilai[i][iKol]) === koleksi && String(nilai[i][iId]) === id) {
      sh.deleteRow(i + 1);
      if (!diam) { tandaiBerubah_(); log_('konten-hapus', koleksi + '/' + id + ' oleh ' + str_(user)); }
      return { ok: true, koleksi: koleksi, id: id };
    }
  }
  throw new Error('Item tidak ditemukan: ' + koleksi + '/' + id);
}

/* --------------------------------------------------- URUTAN */
function kontenUrut_(d, user) {
  var koleksi = cekKoleksi_(d.koleksi);
  var urutan = d.urutan || [];          // array id sesuai urutan baru
  if (!urutan.length) throw new Error('Daftar urutan kosong.');

  var sh = sheet_(SHEETS.KONTEN);
  var head = HEADERS.Konten;
  var nilai = sh.getDataRange().getValues();
  var iKol = head.indexOf('koleksi'), iId = head.indexOf('id'), iUrut = head.indexOf('urut') + 1;

  for (var i = 1; i < nilai.length; i++) {
    if (String(nilai[i][iKol]) !== koleksi) continue;
    var pos = urutan.indexOf(String(nilai[i][iId]));
    if (pos >= 0) sh.getRange(i + 1, iUrut).setValue((pos + 1) * 10);
  }
  tandaiBerubah_();
  log_('konten-urut', koleksi + ' oleh ' + str_(user));
  return { ok: true, koleksi: koleksi };
}

/* ------------------------------ ISI AWAL DARI DATA BAWAAN */
/** Dipanggil sekali dari panel admin: menyalin data bawaan situs
 *  ke sheet Konten agar bisa diedit. Tidak menimpa yang sudah ada. */
function kontenSeed_(d, user) {
  var isi = d.bawaan || {};
  var ditulis = 0, dilewati = 0;
  var adaSekarang = kontenSemua_(true);

  KOLEKSI.forEach(function (k) {
    var daftar = isi[k];
    if (!daftar || !daftar.length) return;
    var sudah = {};
    adaSekarang[k].forEach(function (x) { sudah[x.__id] = true; });

    daftar.forEach(function (item, i) {
      var id = str_(item.__id || item.slug || item.id || item.name || item.label || ('item-' + (i + 1)));
      id = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      if (!id) id = 'item-' + (i + 1);
      if (sudah[id]) { dilewati++; return; }
      delete item.__id; delete item.__urut; delete item.__aktif;
      sheet_(SHEETS.KONTEN).appendRow([k, id, (i + 1) * 10, JSON.stringify(item), 'ya', now_(), str_(user)]);
      sudah[id] = true; ditulis++;
    });
  });

  if (ditulis) tandaiBerubah_();
  log_('konten-seed', ditulis + ' item oleh ' + str_(user));
  return { ok: true, ditulis: ditulis, dilewati: dilewati };
}

/* ------------------------------------------------- TERBITKAN */
/** Memicu build ulang Netlify lewat Build Hook. */
function kontenTerbitkan_(user) {
  var hook = props_().getProperty('NETLIFY_BUILD_HOOK');
  if (!hook) {
    throw new Error('Build Hook Netlify belum dipasang. Buka Netlify → Site configuration → Build & deploy → Build hooks → Add build hook, lalu tempel URL-nya di Pengaturan panel admin.');
  }
  var res = UrlFetchApp.fetch(hook, { method: 'post', payload: '{}', contentType: 'application/json', muteHttpExceptions: true });
  var kode = res.getResponseCode();
  if (kode < 200 || kode >= 300) throw new Error('Netlify menolak permintaan (kode ' + kode + '). Periksa kembali URL build hook.');

  var m = kontenMeta_();
  m.perubahan = 0;
  m.terbitTerakhir = now_();
  m.terbitOleh = str_(user);
  simpanKontenMeta_(m);
  log_('konten-terbit', 'oleh ' + str_(user));
  return { ok: true, terbitTerakhir: m.terbitTerakhir };
}

/** Menyimpan URL build hook dari panel admin. */
function kontenSetHook_(d, user) {
  var url = str_(d.url);
  if (url && !/^https:\/\/api\.netlify\.com\/build_hooks\//.test(url)) {
    throw new Error('URL tidak dikenali. Build hook Netlify selalu diawali https://api.netlify.com/build_hooks/');
  }
  props_().setProperty('NETLIFY_BUILD_HOOK', url);
  log_('konten-hook', (url ? 'dipasang' : 'dikosongkan') + ' oleh ' + str_(user));
  return { ok: true, terpasang: !!url };
}

/* =================================================================
 * ANTREAN HARIAN — ringan & otomatis reset tiap pergantian hari
 * -----------------------------------------------------------------
 * Sumber kebenaran : sheet "AntreanHari" (dikosongkan saat tanggal berubah)
 * Meta ringan      : ScriptProperties  ANTREAN_META  (JSON kecil)
 * Cache baca publik: CacheService 15 detik (agar polling tidak membebani)
 *
 * Aturan pemanggilan:
 *   • Dipanggil 3x tanpa respons  → status "terlewat" (kuning)
 *   • Pasien terlewat dikembalikan setelah 2 pasien berikutnya diproses
 *   • Pasien offline (datang langsung) selalu di depan pasien online
 *   • Nomor online baru mengantre setelah admin menekan "Buka Antrean Online"
 * ================================================================= */

/* Poli yang memakai nomor antrean. Harus sama persis dengan
   ANTREAN.poli di src/data/site.js. Tambah baris di sini bila
   kelak khitan/vaksin ikut memakai papan antrean. */
var ANTREAN_POLI = [
  { slug: 'poli-umum', nama: 'Poli Umum', kode: 'U' },
  { slug: 'poli-gigi', nama: 'Poli Gigi', kode: 'G' }
];

var ST = {
  MENUNGGU: 'menunggu',   // putih
  DIPANGGIL: 'dipanggil', // putih + berkedip
  DILAYANI: 'dilayani',   // hijau
  SELESAI: 'selesai',     // abu-abu
  TERLEWAT: 'terlewat',   // kuning
  BATAL: 'batal'
};

var MAKS_PANGGIL = 3;   // dipanggil 3x tanpa respons → terlewat
var LEWATI_N     = 2;   // dilewati sebanyak 2 pasien sebelum diproses ulang
var MAKS_PUTARAN = 1;   // dikembalikan sekali; kalau masih absen, tunggu tindakan admin

function poliCfg_(slug) {
  for (var i = 0; i < ANTREAN_POLI.length; i++) if (ANTREAN_POLI[i].slug === slug) return ANTREAN_POLI[i];
  return null;
}

/* -------------------------------------------------- META RINGAN */
function metaAntrean_() {
  var raw = props_().getProperty('ANTREAN_META');
  var m = null;
  try { m = raw ? JSON.parse(raw) : null; } catch (x) { m = null; }
  if (!m || m.tanggal !== today_()) {
    m = { tanggal: today_(), bukaOnline: false, dilayani: {}, urut: {} };
    ANTREAN_POLI.forEach(function (p) { m.dilayani[p.slug] = 0; m.urut[p.slug] = 0; });
    props_().setProperty('ANTREAN_META', JSON.stringify(m));
    kosongkanAntrean_();                 // hari baru → papan bersih
  }
  return m;
}

function simpanMeta_(m) {
  m.tanggal = today_();
  props_().setProperty('ANTREAN_META', JSON.stringify(m));
  CacheService.getScriptCache().remove('antrean_publik');
}

function kosongkanAntrean_() {
  var sh = sheet_(SHEETS.ANTREAN);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  CacheService.getScriptCache().remove('antrean_publik');
}

/* ------------------------------------------------ BACA / TULIS */
function barisAntrean_() {
  return rows_(SHEETS.ANTREAN).filter(function (r) { return str_(r.tanggal) === today_(); });
}

function tulisKolom_(id, kolom, nilai) {
  var sh = sheet_(SHEETS.ANTREAN);
  var head = HEADERS.AntreanHari;
  var data = sh.getDataRange().getValues();
  var ci = head.indexOf(kolom) + 1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][head.indexOf('id')]) === String(id)) {
      sh.getRange(i + 1, ci).setValue(nilai);
      CacheService.getScriptCache().remove('antrean_publik');
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------- TAMBAH ANTRE */
/** sumber: 'offline' (datang langsung) | 'online' (daftar dari web/WA) */
function antreanTambah_(d, sumber) {
  var cfg = poliCfg_(str_(d.poli));
  if (!cfg) throw new Error('Poli tidak dikenal: ' + str_(d.poli));
  if (!str_(d.nama)) throw new Error('Nama pasien wajib diisi.');

  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var m = metaAntrean_();
    var online = sumber === 'online';

    // Online sebelum antrean dibuka → masuk daftar tunggu, belum dapat nomor
    var dapatNomor = !online || m.bukaOnline === true;
    var no = 0, kode = '—';
    if (dapatNomor) {
      m.urut[cfg.slug] = (m.urut[cfg.slug] || 0) + 1;
      no = m.urut[cfg.slug];
      kode = cfg.kode + '-' + ('0' + no).slice(-2);
    }

    var id = 'A' + new Date().getTime().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
    sheet_(SHEETS.ANTREAN).appendRow([
      id, today_(), now_(), cfg.slug, no, kode,
      safe_(d.nama), safe_(d.umur), safe_(d.alamat), safe_(d.keluhan),
      normHp_(d.hp), safe_(d.jenisKartu), noKartu_(d.noKartu), online ? 'online' : 'offline',
      dapatNomor ? ST.MENUNGGU : 'tunggu', 0, '', ''
    ]);
    simpanMeta_(m);
    return { ok: true, id: id, kode: kode, no: no, poli: cfg.slug, menungguDibuka: !dapatNomor };
  } finally { lock.releaseLock(); }
}

/* ------------------------- BUKA ANTREAN ONLINE (offline diutamakan) */
function antreanBukaOnline_(buka) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var m = metaAntrean_();
    m.bukaOnline = buka !== false;
    var diberi = 0;

    if (m.bukaOnline) {
      // Seluruh pendaftar online yang menunggu kini dapat nomor,
      // mengantre PERSIS di belakang pasien offline yang sudah tercatat.
      var tunggu = barisAntrean_()
        .filter(function (r) { return str_(r.status) === 'tunggu'; })
        .sort(function (a, b) { return str_(a.ts) < str_(b.ts) ? -1 : 1; });

      tunggu.forEach(function (r) {
        var cfg = poliCfg_(str_(r.poli)); if (!cfg) return;
        m.urut[cfg.slug] = (m.urut[cfg.slug] || 0) + 1;
        var no = m.urut[cfg.slug];
        tulisKolom_(r.id, 'no', no);
        tulisKolom_(r.id, 'kode', cfg.kode + '-' + ('0' + no).slice(-2));
        tulisKolom_(r.id, 'status', ST.MENUNGGU);
        diberi++;
        if (normHp_(r.hp)) {
          kirimWhatsApp_(normHp_(r.hp),
            'Assalamualaikum ' + str_(r.nama) + ', antrean online ' + cfg.nama +
            ' sudah dibuka. Nomor antrean Anda: *' + cfg.kode + '-' + ('0' + no).slice(-2) + '*.\n' +
            'Pantau giliran Anda di ' + (props_().getProperty('SITE_URL') || '') + '/antrean.html');
        }
      });
    }
    simpanMeta_(m);
    log_('antrean-buka-online', String(m.bukaOnline) + ' (' + diberi + ' nomor diberikan)');
    return { ok: true, bukaOnline: m.bukaOnline, diberiNomor: diberi };
  } finally { lock.releaseLock(); }
}

/* ------------------------------------- SIAPA PASIEN BERIKUTNYA */
/** Terlewat yang sudah jatuh tempo didahulukan, baru nomor urut biasa. */
function berikutnya_(poli, list, m) {
  var dilayani = (m.dilayani && m.dilayani[poli]) || 0;
  var antre = list.filter(function (r) { return str_(r.poli) === poli; });

  var balik = antre
    .filter(function (r) { return str_(r.status) === ST.TERLEWAT && str_(r.kembaliSetelah) !== '' && Number(r.kembaliSetelah) <= dilayani; })
    .sort(function (a, b) { return Number(a.no) - Number(b.no); });
  if (balik.length) return balik[0];

  var nunggu = antre
    .filter(function (r) { return str_(r.status) === ST.MENUNGGU; })
    .sort(function (a, b) { return Number(a.no) - Number(b.no); });
  return nunggu.length ? nunggu[0] : null;
}

/* ------------------------------------------------------- AKSI */
function antreanAksi_(d) {
  var aksi = str_(d.aksi);
  var poli = str_(d.poli);
  if (!poliCfg_(poli)) throw new Error('Poli tidak dikenal.');

  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var m = metaAntrean_();
    var list = barisAntrean_();
    var row = null;

    if (str_(d.id)) {
      row = list.filter(function (r) { return String(r.id) === str_(d.id); })[0] || null;
    }

    /* --- PANGGIL: ambil pasien berikutnya, atau ulangi panggilan --- */
    if (aksi === 'panggil') {
      if (!row) {
        var aktif = list.filter(function (r) {
          return str_(r.poli) === poli && str_(r.status) === ST.DIPANGGIL;
        })[0];
        row = aktif || berikutnya_(poli, list, m);
      }
      if (!row) return { ok: true, kosong: true, pesan: 'Tidak ada pasien yang menunggu.' };

      // Pasien terlewat yang kembali gilirannya dapat jatah 3 panggilan BARU,
      // bukan melanjutkan hitungan lama (kalau tidak, ia langsung terlewat lagi).
      var putaran = Number(row.catatan || 0);
      if (str_(row.status) === ST.TERLEWAT) {
        putaran += 1;
        tulisKolom_(row.id, 'catatan', putaran);
        tulisKolom_(row.id, 'panggil', 0);
        row.panggil = 0;
      }

      var n = Number(row.panggil || 0) + 1;
      tulisKolom_(row.id, 'panggil', n);
      tulisKolom_(row.id, 'status', ST.DIPANGGIL);

      // Panggilan ke-3 tanpa respons → otomatis terlewat
      if (n >= MAKS_PANGGIL) {
        m.dilayani[poli] = (m.dilayani[poli] || 0) + 1;
        tulisKolom_(row.id, 'status', ST.TERLEWAT);

        // Putaran ke-2 masih dikembalikan; sesudah itu berhenti berputar
        // dan menunggu admin mengembalikannya secara manual.
        var lagi = putaran < MAKS_PUTARAN;
        tulisKolom_(row.id, 'kembaliSetelah', lagi ? (m.dilayani[poli] || 0) + LEWATI_N : '');
        simpanMeta_(m);

        if (normHp_(row.hp)) {
          kirimWhatsApp_(normHp_(row.hp), 'Nomor antrean *' + str_(row.kode) + '* sudah dipanggil ' +
            MAKS_PANGGIL + ' kali tanpa respons. ' + (lagi
              ? 'Anda dilewati sementara dan akan dipanggil kembali setelah ' + LEWATI_N + ' pasien berikutnya. Mohon segera menuju ruang periksa.'
              : 'Silakan lapor ke petugas pendaftaran untuk dimasukkan kembali ke antrean.'));
        }
        return { ok: true, id: row.id, kode: row.kode, status: ST.TERLEWAT, panggil: n,
                 otomatisTerlewat: true, putaran: putaran, akanKembali: lagi };
      }

      simpanMeta_(m);
      return { ok: true, id: row.id, kode: row.kode, nama: row.nama, status: ST.DIPANGGIL, panggil: n, sisaPanggil: MAKS_PANGGIL - n };
    }

    if (!row) throw new Error('Pasien tidak ditemukan.');

    /* --- MULAI DILAYANI (hijau) --- */
    if (aksi === 'mulai') {
      tulisKolom_(row.id, 'status', ST.DILAYANI);
      simpanMeta_(m);
      return { ok: true, id: row.id, status: ST.DILAYANI };
    }

    /* --- SELESAI (abu-abu) --- */
    if (aksi === 'selesai') {
      if (str_(row.status) !== ST.SELESAI) m.dilayani[poli] = (m.dilayani[poli] || 0) + 1;
      tulisKolom_(row.id, 'status', ST.SELESAI);
      simpanMeta_(m);
      return { ok: true, id: row.id, status: ST.SELESAI };
    }

    /* --- LEWATI manual (kuning) --- */
    if (aksi === 'lewati') {
      var put = Number(row.catatan || 0) + 1;
      m.dilayani[poli] = (m.dilayani[poli] || 0) + 1;
      tulisKolom_(row.id, 'status', ST.TERLEWAT);
      tulisKolom_(row.id, 'catatan', put);
      tulisKolom_(row.id, 'kembaliSetelah', put <= MAKS_PUTARAN ? (m.dilayani[poli] || 0) + LEWATI_N : '');
      simpanMeta_(m);
      return { ok: true, id: row.id, status: ST.TERLEWAT, putaran: put };
    }

    /* --- KEMBALIKAN ke antrean (batal terlewat) --- */
    if (aksi === 'kembalikan') {
      tulisKolom_(row.id, 'status', ST.MENUNGGU);
      tulisKolom_(row.id, 'panggil', 0);
      tulisKolom_(row.id, 'catatan', 0);
      tulisKolom_(row.id, 'kembaliSetelah', '');
      simpanMeta_(m);
      return { ok: true, id: row.id, status: ST.MENUNGGU };
    }

    if (aksi === 'batal') {
      tulisKolom_(row.id, 'status', ST.BATAL);
      simpanMeta_(m);
      return { ok: true, id: row.id, status: ST.BATAL };
    }

    /* --- PENGINGAT WHATSAPP --- */
    if (aksi === 'ingatkan') {
      var hp = normHp_(row.hp);
      if (!hp) throw new Error('Pasien ini tidak punya nomor WhatsApp.');
      var sisa = list.filter(function (r) {
        return str_(r.poli) === poli && str_(r.status) === ST.MENUNGGU && Number(r.no) < Number(row.no);
      }).length;
      kirimWhatsApp_(hp, 'Assalamualaikum ' + str_(row.nama) + '. Nomor antrean Anda *' + str_(row.kode) +
        '* di ' + poliCfg_(poli).nama + '. Sisa ' + sisa + ' pasien lagi sebelum giliran Anda. ' +
        'Mohon sudah berada di klinik ya.');
      return { ok: true, id: row.id, terkirim: true, sisa: sisa };
    }

    throw new Error('Aksi antrean tidak dikenal: ' + aksi);
  } finally { lock.releaseLock(); }
}

/* ----------------------------------------- DATA UNTUK ADMIN */
function antreanAdmin_() {
  var m = metaAntrean_();
  return {
    ok: true, tanggal: m.tanggal, bukaOnline: !!m.bukaOnline,
    dilayani: m.dilayani, maksPanggil: MAKS_PANGGIL, lewatiN: LEWATI_N,
    poli: ANTREAN_POLI,
    antre: barisAntrean_().map(function (r) {
      return {
        id: r.id, ts: r.ts, poli: r.poli, no: Number(r.no) || 0, kode: r.kode,
        nama: r.nama, umur: r.umur, alamat: r.alamat, keluhan: r.keluhan, hp: r.hp,
        jenisKartu: r.jenisKartu, noKartu: r.noKartu,
        sumber: r.sumber, status: r.status, panggil: Number(r.panggil) || 0,
        kembaliSetelah: r.kembaliSetelah
      };
    })
  };
}

/* ---------------------------------------- DATA UNTUK PUBLIK */
/** Nama disamarkan & keluhan tidak pernah dikirim ke halaman publik. */
function samarkan_(nama) {
  var p = str_(nama).split(/\s+/);
  if (!p[0]) return 'Pasien';
  return p[0] + (p[1] ? ' ' + p[1].charAt(0).toUpperCase() + '.' : '');
}

function antreanPublik_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('antrean_publik');
  if (hit) { try { return JSON.parse(hit); } catch (x) {} }

  var m = metaAntrean_();
  var list = barisAntrean_();
  var out = { ok: true, tanggal: m.tanggal, bukaOnline: !!m.bukaOnline, waktu: now_(), poli: [] };

  ANTREAN_POLI.forEach(function (p) {
    var isi = list.filter(function (r) {
      return str_(r.poli) === p.slug && str_(r.status) !== 'tunggu' && str_(r.status) !== ST.BATAL;
    }).sort(function (a, b) { return Number(a.no) - Number(b.no); });

    var sedang = isi.filter(function (r) { return str_(r.status) === ST.DILAYANI || str_(r.status) === ST.DIPANGGIL; })[0] || null;

    out.poli.push({
      slug: p.slug, nama: p.nama, kode: p.kode,
      sedangDilayani: sedang ? { kode: sedang.kode, nama: samarkan_(sedang.nama), status: sedang.status } : null,
      menunggu: isi.filter(function (r) { return str_(r.status) === ST.MENUNGGU; }).length,
      selesai: isi.filter(function (r) { return str_(r.status) === ST.SELESAI; }).length,
      terlewat: isi.filter(function (r) { return str_(r.status) === ST.TERLEWAT; }).length,
      daftar: isi.map(function (r) {
        return { kode: r.kode, no: Number(r.no) || 0, nama: samarkan_(r.nama), status: r.status, sumber: r.sumber };
      })
    });
  });

  cache.put('antrean_publik', JSON.stringify(out), 15);
  return out;
}

/** Cek satu nomor antrean — dipakai pasien untuk melihat posisinya. */
function antreanCek_(kode) {
  var k = str_(kode).toUpperCase();
  var row = barisAntrean_().filter(function (r) { return str_(r.kode).toUpperCase() === k; })[0];
  if (!row) return { ok: false, error: 'Nomor antrean tidak ditemukan hari ini.' };
  var m = metaAntrean_();
  var didepan = barisAntrean_().filter(function (r) {
    return str_(r.poli) === str_(row.poli) && str_(r.status) === ST.MENUNGGU && Number(r.no) < Number(row.no);
  }).length;
  return {
    ok: true, kode: row.kode, nama: samarkan_(row.nama), poli: (poliCfg_(row.poli) || {}).nama,
    status: row.status, panggil: Number(row.panggil) || 0, didepan: didepan,
    perkiraanMenit: didepan * 7, bukaOnline: !!m.bukaOnline
  };
}

/** Pembersih harian — dipasang otomatis oleh setup(). */
function resetAntreanHarian() {
  kosongkanAntrean_();
  var m = { tanggal: today_(), bukaOnline: false, dilayani: {}, urut: {} };
  ANTREAN_POLI.forEach(function (p) { m.dilayani[p.slug] = 0; m.urut[p.slug] = 0; });
  props_().setProperty('ANTREAN_META', JSON.stringify(m));
  log_('antrean-reset', today_());
}

/** Trigger harian 00.05 WIB — papan antrean bersih tiap pagi. */
function pasangTriggerResetAntrean() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'resetAntreanHarian') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('resetAntreanHarian').timeBased().atHour(0).nearMinute(5).everyDays(1).create();
}

function pasangTriggerRekap() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'kirimRekapHarian') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('kirimRekapHarian').timeBased().atHour(5).everyDays(1).inTimezone(tz_()).create();
}

function kirimRekapHarian() {
  var tgl = today_();
  var list = rows_(SHEETS.PENDAFTARAN).filter(function (r) { return str_(r.tanggal).slice(0, 10) === tgl && r.status !== 'Batal'; });
  var perLayanan = {};
  list.forEach(function (r) { perLayanan[r.layanan] = (perLayanan[r.layanan] || 0) + 1; });

  var teks = '*REKAP PENDAFTARAN ' + tgl + '*\n' +
    'Total: ' + list.length + ' pasien\n────────────────\n' +
    Object.keys(perLayanan).map(function (k) { return '• ' + k + ': ' + perLayanan[k]; }).join('\n') +
    '\n────────────────\n' +
    list.map(function (r, i) { return (i + 1) + '. ' + r.nama + ' — ' + r.layanan + ' (' + r.sesi + ')'; }).join('\n');

  kirimWhatsApp_(props_().getProperty('WA_ADMIN'), teks);
  notifikasiEmail_('Rekap pendaftaran ' + tgl, teks.replace(/\*/g, ''));
  kirimKeChatbotAI_({ event: 'rekap_harian', tanggal: tgl, total: list.length, perLayanan: perLayanan, list: list });
}
