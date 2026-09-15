# Arsitektur Teknis — Klinik Pratama Sehat Sejahtera

Dokumen ini menjelaskan struktur folder, arsitektur sistem, skema database
spreadsheet, alur data, strategi SEO, dan jalur integrasi BPJS/SATUSEHAT.

---

## 1. Ringkasan Keputusan Arsitektur

| Aspek | Pilihan | Alasan |
|---|---|---|
| Front-end | HTML/CSS/JS statis, **multi-page (MPA)** | Setiap halaman punya URL & meta sendiri → syarat mutlak untuk SEO lokal. Tanpa framework = LCP cepat, bundel JS < 10 KB. |
| Generator | Node.js sederhana (`build.js`), tanpa dependensi | Konten terpusat di satu file data; 19 halaman dihasilkan konsisten. Hasilnya tetap HTML statis murni. |
| Backend | **Google Apps Script** + Google Spreadsheet | Gratis, tanpa server, tanpa biaya bulanan. Admin klinik bisa membuka data langsung dari Google Sheets. |
| Transisi halaman | CSS **View Transitions API** | Perpindahan halaman terasa seperti aplikasi, tanpa satu baris JavaScript pun. |
| Offline | Service Worker (network-first untuk HTML) | Konten selalu segar, tetap bisa dibuka saat sinyal hilang. |
| Pendaftaran | Formulir → Sheets → **deep link WhatsApp** | Tidak butuh WhatsApp Business API berbayar untuk memulai. Data tetap tercatat rapi di sistem. |
| Admin | Halaman terpisah `/admin` + auth di server | Tidak tertaut publik, `noindex`, dan autentikasi sesungguhnya terjadi di Apps Script. |

---

## 2. Struktur Folder

```
klinik-sss/
├── build.js                    ← generator: jalankan `node build.js`
├── src/                        ← SUMBER (yang Anda edit)
│   ├── data/site.js            ← ★ SEMUA KONTEN: profil, layanan, apotek,
│   │                              dokter, artikel, testimoni, SEO, WA, dsb.
│   ├── render.js               ← layout: <head>, header, footer, ikon SVG
│   └── pages.js                ← susunan isi tiap halaman
│
├── public/                     ← HASIL BUILD — folder inilah yang di-deploy
│   ├── index.html              ← Beranda
│   ├── profil.html
│   ├── layanan.html
│   ├── layanan/
│   │   ├── poli-umum.html
│   │   ├── poli-gigi.html
│   │   ├── khitan.html
│   │   ├── farmasi.html
│   │   └── top-dokter.html
│   ├── dokter.html
│   ├── apotek.html
│   ├── testimoni.html
│   ├── artikel.html
│   ├── artikel/<slug>.html     ← 3 artikel (bisa ditambah dari site.js)
│   ├── pendaftaran.html
│   ├── kontak.html
│   ├── kebijakan-privasi.html
│   ├── offline.html            ← fallback PWA saat tidak ada internet
│   │
│   ├── admin/
│   │   └── index.html          ← ★ PANEL ADMIN (tersembunyi, noindex)
│   │
│   ├── assets/
│   │   ├── css/style.css       ← satu file, ±37 KB (±8 KB setelah gzip)
│   │   ├── js/
│   │   │   ├── config.js       ← dibuat otomatis oleh build.js
│   │   │   ├── app.js          ← nav, reveal, PWA, toast (±4 KB)
│   │   │   ├── forms.js        ← pendaftaran, testimoni, kontak
│   │   │   └── admin.js        ← khusus panel admin (tidak dimuat publik)
│   │   ├── img/
│   │   │   ├── logo-klinik.png
│   │   │   ├── og-cover.png    ← gambar share WhatsApp/Facebook
│   │   │   └── fasilitas/*.svg ← ilustrasi ruangan (GANTI dengan foto asli)
│   │   └── icons/              ← ikon PWA 192/512/maskable + favicon
│   │
│   ├── manifest.webmanifest    ← definisi PWA
│   ├── sw.js                   ← service worker
│   ├── robots.txt              ← memblokir /admin dari mesin pencari
│   ├── sitemap.xml
│   ├── _headers                ← header keamanan (Netlify/Cloudflare Pages)
│   └── vercel.json             ← header keamanan (Vercel)
│
├── backend/
│   └── Code.gs                 ← ★ seluruh backend Google Apps Script
│
├── tools/
│   └── gen-illustrations.js    ← membuat ulang ilustrasi fasilitas
│
└── docs/
    └── ARSITEKTUR.md           ← dokumen ini
```

**Aturan emas:** ubah konten di `src/data/site.js`, lalu jalankan `node build.js`.
Jangan mengedit file di `public/` secara langsung — perubahan akan tertimpa.

---

## 3. Diagram Arsitektur

```
┌──────────────────────── PENGUNJUNG / PASIEN ────────────────────────┐
│   HP (PWA terpasang)        Desktop            Mesin pencari Google │
└──────┬──────────────────────────┬──────────────────────┬────────────┘
       │                          │                      │
       ▼                          ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CDN STATIS  (Vercel / Netlify / Cloudflare Pages)  — GRATIS        │
│  • HTML pra-render → LCP < 1,5 s                                    │
│  • Service Worker → bisa dibuka offline                             │
│  • /admin diberi header  X-Robots-Tag: noindex                      │
└──────┬──────────────────────────────────────────┬───────────────────┘
       │ fetch POST (text/plain, tanpa preflight) │
       ▼                                          ▼
┌───────────────────────────────┐    ┌────────────────────────────────┐
│ GOOGLE APPS SCRIPT (Web App)  │    │ wa.me deep link                │
│ backend/Code.gs               │    │ → membuka WhatsApp pasien      │
│ • doPost: pendaftaran,        │    │   berisi ringkasan pendaftaran │
│   testimoni, kontak           │    └────────────────────────────────┘
│ • doGet : testimoni publik    │
│ • login admin (token 6 jam)   │
│ • anti formula-injection      │
└──────┬───────────────┬────────┘
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────────────────────────────────────┐
│ SPREADSHEET  │  │ NOTIFIKASI                                       │
│ • Pendaftaran│  │ • Email ke admin (MailApp)  — aktif langsung     │
│ • Testimoni  │  │ • WhatsApp via gateway      — opsional           │
│ • Pesan      │  │ • Webhook → Chatbot AI / n8n — opsional          │
│ • Log        │  │ • Trigger harian 05.00 WIB: rekap otomatis       │
└──────────────┘  └──────────────────────────────────────────────────┘
       ▲
       │ token sesi
┌──────┴────────────────────────┐
│ PANEL ADMIN  /admin           │
│ • Dashboard KPI               │
│ • Kelola status pendaftaran   │
│ • Moderasi testimoni          │
│ • Rekap & ekspor CSV          │
└───────────────────────────────┘
```

---

## 4. Skema Database (Google Spreadsheet)

Satu Spreadsheet, empat sheet. Dibuat otomatis oleh fungsi `setup()`.

### Sheet `Pendaftaran`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | teks | `REG-260914-001` (otomatis) |
| `ts` | ISO datetime | Waktu submit (Asia/Jakarta) |
| `nama` | teks | **Nama pasien** |
| `umur` | teks | **Umur** (mis. `34 tahun`, `8 bulan`) |
| `alamat` | teks | **Alamat** |
| `keluhan` | teks | **Keluhan** |
| `hp` | teks | Nomor WhatsApp, dinormalkan ke `628xxx` |
| `layanan` | teks | Salah satu dari 5 layanan |
| `tanggal` | tanggal | Rencana kunjungan |
| `sesi` | teks | Pagi / Sore-Malam / Fleksibel |
| `status` | teks | **Baru → Konfirmasi → Selesai / Batal** |
| `catatan` | teks | Diisi admin |
| `sumber` | teks | web / pwa / shortcut |

Empat kolom pertama (**nama, umur, alamat, keluhan**) adalah format inti
pendataan pasien. Sisanya adalah data operasional untuk menghubungi pasien
dan menyusun antrean.

### Pembagian nomor WhatsApp
| Layanan | Nomor tujuan | Diatur di |
|---|---|---|
| Pendaftaran umum, Poli Umum, Poli Gigi, Farmasi, Top Dokter | `0896-5350-2700` | `CONFIG.waNumber` |
| **Pelayanan Khitan** | **`0878-4030-1148`** | `CONFIG.waByService` + Script Property `WA_ADMIN_KHITAN` |

Pemilihan nomor terjadi otomatis di dua tempat: `forms.js` memilih tujuan
`wa.me` berdasarkan layanan yang dipilih pasien, dan `Code.gs` mengarahkan
notifikasi internal ke admin yang tepat. Untuk menambah nomor khusus layanan
lain, cukup tambahkan entri baru di `CONFIG.waByService`.

### Sheet `Testimoni`
`id, ts, nama, area, layanan, rating, pesan, izin, status`
→ status: **Menunggu → Tayang / Ditolak**. Hanya `Tayang` yang tampil publik.

### Sheet `Pesan`
`id, ts, nama, hp, subjek, pesan, status`

### Sheet `Log`
`ts, aksi, detail, ip` — jejak login, perubahan status, dan kegagalan kirim.

**Keamanan data:** setiap nilai disaring `safe_()` agar teks yang diawali
`=`, `+`, `-`, atau `@` tidak dieksekusi sebagai formula spreadsheet.

---

## 5. Alur Pendaftaran (paling penting)

```
Pasien isi formulir  →  validasi di browser
        │
        ├─ (A) POST ke Apps Script  →  baris baru di sheet Pendaftaran
        │        └→ hitung nomor antrean sementara (P01 / S03 / F02)
        │        └→ kirim notifikasi ke admin (email + WA gateway opsional)
        │        └→ kirim event ke webhook Chatbot AI (opsional)
        │
        └─ (B) buka wa.me berisi ringkasan terformat
                 └→ pasien menekan "kirim" → admin membalas nomor antrean
```

**Kalau internet putus atau server gagal:** data disimpan di `localStorage`
perangkat pasien (maks. 20 antrean) dan dikirim ulang otomatis saat online.
WhatsApp tetap dibuka, sehingga pasien tidak pernah kehilangan layanan.

---

## 6. Cara Deploy

### 6.1 Backend (sekali saja, ±10 menit)
1. Buat Google Spreadsheet baru → **Extensions → Apps Script**.
2. Hapus isi `Code.gs`, tempel seluruh isi `backend/Code.gs`, simpan.
3. Jalankan fungsi `setup()` → beri izin akses saat diminta.
4. Jalankan `buatHash("KataSandiBaruAnda")` → salin hasil dari **Execution log**.
5. **Project Settings → Script Properties**, isi:
   - `ADMIN_USER` = `admin`
   - `ADMIN_PASS_HASH` = hasil langkah 4
   - `ADMIN_EMAIL` = email penerima notifikasi
   - `WA_ADMIN` = `6289653502700`
   - *(opsional)* `WA_GATEWAY_URL`, `WA_GATEWAY_TOKEN`, `AI_WEBHOOK_URL`
6. **Deploy → New deployment → Web app**
   → *Execute as:* **Me** · *Who has access:* **Anyone** → salin URL `/exec`.

### 6.2 Front-end
1. Buka `src/data/site.js`, isi `CONFIG.gasUrl` dengan URL langkah 6.
2. Sesuaikan `CONFIG.domain` dengan domain final.
3. Jalankan `node build.js`.
4. Unggah **isi folder `public/`** ke hosting statis pilihan Anda.

**Vercel:** `vercel --prod` dari dalam folder `public`, atau hubungkan repo
dengan *output directory* = `public`.
**Netlify / Cloudflare Pages:** seret folder `public` ke dasbor.

### 6.3 Setelah live
- Daftarkan domain di **Google Search Console**, kirim `sitemap.xml`.
- Buat / klaim **Google Business Profile** — ini penyumbang peringkat lokal terbesar.
- Uji PWA & performa dengan Lighthouse (target: Performance ≥ 95, SEO 100).

---

## 7. Keamanan Panel Admin

Panel admin memakai **tiga lapis**, karena situs statis tidak bisa
menyembunyikan file sepenuhnya:

1. **Tidak terlihat** — tidak ada tautan ke `/admin` dari halaman publik;
   `robots.txt` melarang crawling; header `X-Robots-Tag: noindex, nofollow`.
2. **Autentikasi di server** — nama pengguna & kata sandi diverifikasi oleh
   Apps Script (SHA-256 + salt). Token sesi berumur 6 jam disimpan di
   `sessionStorage`, bukan cookie permanen. Gagal 5× → terkunci 15 menit.
3. **Otorisasi tiap permintaan** — setiap aksi admin (`list`, `updateStatus`,
   dst.) menolak permintaan tanpa token yang sah. Tanpa token, halaman
   `/admin` hanya menampilkan formulir login kosong.

**Sangat disarankan menambahkan lapisan keempat** bila hosting mendukung:
- **Cloudflare Access** (gratis s/d 50 pengguna) di path `/admin/*`, atau
- **HTTP Basic Auth** lewat `_headers` / konfigurasi hosting, atau
- ganti path `/admin` menjadi sesuatu yang tidak mudah ditebak,
  misalnya `/kelola-9f3a/`.

---

## 8. Strategi SEO Lokal (target: peringkat 1 Blitar)

### Kata kunci utama yang sudah dipetakan ke halaman
| Halaman | Kata kunci utama |
|---|---|
| `/` | klinik Blitar, klinik pratama Blitar, klinik terdekat Blitar |
| `/layanan/poli-gigi.html` | dokter gigi Blitar, tambal gigi Blitar, scaling gigi Blitar |
| `/layanan/khitan.html` | khitan Blitar, sunat Blitar, khitan modern Blitar |
| `/layanan/poli-umum.html` | dokter umum Blitar, surat keterangan sehat Blitar |
| `/layanan/farmasi.html` | apotek Blitar, apotek buka malam Blitar |
| `/layanan/top-dokter.html` | konsultasi dokter online Blitar |
| `/apotek.html` | Apotek Mahira Farma, apotek Nglegok, apotek Ngentak |
| `/pendaftaran.html` | daftar online klinik Blitar |

### Yang sudah diterapkan di kode
- `MedicalClinic` schema.org lengkap (alamat, geo, jam buka, layanan, apotek
  sebagai `subOrganization`) di beranda.
- `FAQPage` schema di setiap halaman layanan → berpeluang muncul sebagai
  *rich result* di hasil pencarian.
- `BreadcrumbList` + `Article` schema di artikel.
- Canonical, Open Graph, geo meta (`ID-JI`, koordinat Blitar).
- Sitemap XML dengan prioritas bertingkat, `robots.txt` bersih.
- Judul halaman < 60 karakter berisi **layanan + Blitar**.
- Kecepatan: tanpa framework, CSS satu file, gambar `loading="lazy"`.

### Yang masih harus Anda lakukan di luar kode
1. **Google Business Profile** — lengkapi, unggah foto asli, kumpulkan ulasan.
   Bobotnya paling besar untuk pencarian "klinik terdekat".
2. **Konsistensi NAP** (Name, Address, Phone) di semua direktori online.
3. **Foto asli** — ganti ilustrasi di `assets/img/fasilitas/`.
4. **Artikel rutin** — tambah 2 artikel per bulan lewat `ARTICLES` di `site.js`.
5. **Testimoni asli** — kumpulkan lewat halaman testimoni, moderasi di admin.

---

## 9. Performa

| Teknik | Dampak |
|---|---|
| HTML pra-render, tanpa framework | Tidak ada *hydration*; konten langsung tampil |
| Total JS publik ±9 KB (belum gzip) | *Total Blocking Time* mendekati nol |
| CSS satu berkas, `<link>` biasa | Satu permintaan saja untuk seluruh gaya |
| Font Google dimuat non-blocking (`media="print"` → `onload`) | Teks tampil segera dengan font sistem, lalu berganti |
| `width`/`height` di semua `<img>` | CLS ≈ 0 |
| Apps Script tidak pernah di-cache SW, aset di-cache `immutable` | Data selalu segar, aset instan |
| Permintaan ke Apps Script memakai `text/plain` | Menghindari CORS preflight → hemat 1 *round trip* |
| Timeout 12 detik + antrean offline | Situs tidak pernah "menggantung" walau Apps Script lambat |

---

## 10. Jalur Integrasi BPJS & SATUSEHAT

Aplikasi saat ini **berdiri sendiri**, sesuai permintaan. Arsitekturnya sudah
disiapkan agar integrasi berikutnya cukup menambah satu lapisan, tanpa
mengubah situs publik.

```
                         ┌───────────────────────────┐
  Situs publik  ─────────│  Apps Script (sekarang)   │──── Spreadsheet
  Panel admin   ─────────│  doPost / doGet           │
                         └─────────────┬─────────────┘
                                       │  (nanti)
                         ┌─────────────▼─────────────┐
                         │  LAPISAN PENGHUBUNG       │
                         │  Cloud Functions / n8n    │
                         │  • simpan kredensial      │
                         │  • pemetaan format data   │
                         │  • antrean & retry        │
                         └──────┬─────────────┬──────┘
                                ▼             ▼
                      BPJS (Antrean-RS,   SATUSEHAT
                      VClaim, PCare)      (FHIR R4)
```

**Prinsip yang sudah dipegang sejak sekarang:**
- Data pasien disimpan **atomik** (NIK, tanggal lahir, jenis kelamin terpisah),
  bukan satu blok teks — inilah bentuk yang diminta FHIR dan BPJS.
- `id` pendaftaran bersifat unik dan stabil → dipakai sebagai kunci pemetaan
  ke `Encounter` (SATUSEHAT) atau nomor antrean BPJS.
- Kredensial pihak ketiga **tidak pernah** menyentuh front-end. Situs publik
  hanya bicara ke Apps Script; Apps Script yang bicara ke lapisan penghubung.
- Arah data satu arah keluar: data internal klinik tidak dipublikasikan pada
  aplikasi eksternal, hanya bidang yang diwajibkan regulasi yang dikirim.

**Urutan pengerjaan yang disarankan:**
1. Ajukan registrasi fasilitas di platform SATUSEHAT → dapatkan `organization_id`.
2. Mulai dari *resource* paling sederhana: `Patient` → `Encounter`.
3. BPJS menyusul: mulai dari **Antrean Online**, baru PCare.
4. Bila volume sudah besar (> 200 pendaftaran/hari), pindahkan database dari
   Spreadsheet ke Postgres/Supabase — kontrak API ke front-end tidak berubah.

---

## 11. Integrasi Chatbot AI (tahap berikutnya)

`Code.gs` sudah memanggil `kirimKeChatbotAI_()` pada tiga momen:
`pendaftaran_baru`, `testimoni_baru`, `pesan_baru`, serta `rekap_harian`.

Cukup isi Script Property `AI_WEBHOOK_URL` dengan alamat webhook n8n / Make /
layanan AI Anda, dan payload JSON akan otomatis dikirim:

```json
{
  "event": "pendaftaran_baru",
  "id": "REG-260914-001",
  "antrean": "P07",
  "data": { "nama": "...", "layanan": "...", "keluhan": "..." }
}
```

Ide pemanfaatan: klasifikasi tingkat kegawatan keluhan, saran poli yang tepat,
balasan otomatis konfirmasi antrean, dan ringkasan harian berbahasa natural
untuk admin.

---

## 12. Perawatan Rutin

| Kapan | Yang dilakukan |
|---|---|
| Saat konten berubah | Edit `src/data/site.js` → `node build.js` → deploy ulang |
| Setiap deploy | Naikkan `VERSION` di `public/sw.js` (mis. `klinik-v1.0.1`) agar cache lama bersih |
| Mingguan | Moderasi testimoni, perbarui jadwal dokter |
| Bulanan | Tambah 1–2 artikel, cek Search Console |
| Tahunan | Ganti kata sandi admin lewat `buatHash()` |

---

## 13. Daftar Periksa Sebelum Go-Live

- [ ] Ganti nama dokter & apoteker yang masih berupa placeholder di `DOCTORS`
- [ ] Ganti seluruh `TESTIMONIALS` dengan testimoni asli berizin, atau kosongkan
- [ ] Ganti ilustrasi `assets/img/fasilitas/*.svg` dengan foto asli klinik
- [ ] Pastikan alamat & jam buka tiap cabang apotek sudah tepat
- [ ] Isi `CONFIG.domain` dan `CONFIG.gasUrl`
- [ ] Ganti kata sandi admin dari nilai awal `ubahsaya123`
- [ ] Pasang Cloudflare Access / Basic Auth di `/admin`
- [ ] Verifikasi Google Search Console + kirim sitemap
- [ ] Lengkapi Google Business Profile
- [ ] Tampilkan logo mitra hanya setelah perjanjian resmi berlaku
