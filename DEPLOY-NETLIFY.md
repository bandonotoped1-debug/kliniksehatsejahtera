# Deploy ke Netlify

Situs ini adalah **static site + PWA**. Folder yang dipublikasikan adalah `public/`,
dihasilkan oleh `node build.js`.

---

## Cara 1 — Drag & drop (paling cepat, tanpa akun/Git)

1. Buka <https://app.netlify.com/drop>
2. **Seret folder `public/`** (bukan folder root, bukan zip berisi root) ke area drop.
3. Situs langsung online di `https://<nama-acak>.netlify.app` dan bisa diakses publik.
4. Ganti nama alamat di **Site configuration - Change site name**.

> Inilah penyebab error *"Page not found"* sebelumnya: yang ter-deploy adalah folder
> root (isinya `build.js`, `src/`, dll) yang tidak punya `index.html`.
> Yang benar adalah isi folder `public/`.

---

## Cara 2 — Dari Git (rekomendasi, auto-deploy tiap update)

1. Push repo ini ke GitHub/GitLab.
2. Netlify - **Add new site - Import an existing project** - pilih repo.
3. Netlify membaca `netlify.toml` otomatis:
   - Build command : `node build.js`
   - Publish dir   : `public`
   - Node version  : 20
4. Klik **Deploy**. Situs publik langsung aktif.

---

## Cara 3 — Netlify CLI

```bash
npm i -g netlify-cli
netlify login
netlify deploy --dir=public --prod
```

---

## Setelah online — 3 hal yang perlu diisi

### 1. Alamat situs (canonical & sitemap)
Deploy dari Git otomatis memakai variabel `URL` dari Netlify.
Kalau pakai domain sendiri, set di **Site configuration - Environment variables**:

```
SITE_URL = https://klinikanda.com
```

lalu **Deploys - Trigger deploy - Clear cache and deploy site**.

### 2. Backend formulir (Google Apps Script)
Edit `src/data/site.js` - `CONFIG.gasUrl`, isi URL Web App Apps Script Anda
(deploy `backend/Code.gs` sebagai Web App, akses *Anyone*). Lalu build ulang.

### 3. Naikkan versi service worker tiap deploy besar
`public/sw.js` baris `const VERSION = 'klinik-v1.1.0';` - naikkan angkanya
supaya cache lama pengunjung otomatis dibersihkan.

---

## Cek PWA setelah online

Buka situs di Chrome - **DevTools - Application**:

- **Manifest** — nama, ikon 192/512, maskable, `display: standalone`
- **Service Workers** — status *activated and is running*
- **Lighthouse - Installable** (butuh HTTPS; Netlify sudah HTTPS otomatis)

Di HP: menu browser - **Install app / Tambah ke Layar Utama**.
Di iPhone (Safari): tombol **Bagikan - Tambah ke Layar Utama**.

> PWA hanya aktif di **HTTPS** atau `localhost`. Membuka `index.html`
> lewat `file://` tidak akan mendaftarkan service worker — itu normal.

## Uji lokal

```bash
node build.js
python3 -m http.server 5173 --directory public
# buka http://localhost:5173
```

---

# Fitur Antrean — langkah pemasangan tambahan

Antrean berjalan di Google Apps Script yang sama. Setelah menempel ulang
`backend/Code.gs` (versi terbaru) ke proyek Apps Script Anda:

1. Jalankan ulang fungsi `setup()` — ini membuat sheet **AntreanHari**
   dan memasang trigger harian `resetAntreanHarian` (00.05 WIB).
2. **Deploy - Manage deployments - Edit - New version - Deploy.**
   Tanpa versi baru, endpoint lama yang dipakai situs tidak ikut berubah.
3. (Opsional) Script Properties - `SITE_URL` = alamat situs Anda,
   dipakai pada tautan di pesan WhatsApp pembukaan antrean.

## Alur harian yang dipakai petugas

1. Buka `/admin` - tab **Antrean Hari Ini**.
2. Catat pasien yang **datang langsung** lewat kolom "Tambah ke Antrean".
   Mereka mendapat nomor lebih dulu.
3. Tekan **Buka Antrean Online**. Semua pendaftar online yang menunggu
   langsung mendapat nomor, mengantre di belakang pasien offline,
   dan menerima nomornya lewat WhatsApp.
4. Tekan **Panggil berikutnya**. Bila pasien tidak merespons, tekan
   **Panggil lagi** — pada panggilan ke-3 sistem otomatis menandainya
   *tidak hadir* dan menjadwalkan ulang setelah 2 pasien berikutnya.
5. **Mulai layani** (hijau) - **Selesai** (abu-abu).
6. Papan publik di `/antrean.html` menyegar sendiri tiap 15 detik.

## Mengubah aturan antrean

Semua di bagian atas modul antrean pada `backend/Code.gs`:

| Konstanta | Arti | Bawaan |
|---|---|---|
| `MAKS_PANGGIL` | Berapa kali dipanggil sebelum ditandai tidak hadir | 3 |
| `LEWATI_N` | Berapa pasien dilewati sebelum dipanggil ulang | 2 |
| `MAKS_PUTARAN` | Berapa kali pasien dikembalikan otomatis | 1 |
| `ANTREAN_POLI` | Poli yang memakai nomor antrean | Poli Umum, Poli Gigi |

> `ANTREAN_POLI` di `backend/Code.gs` harus **sama persis** dengan
> `ANTREAN.poli` di `src/data/site.js`. Ubah keduanya bila menambah poli.

## Data antrean tidak disimpan permanen

Sheet `AntreanHari` hanya menampung antrean hari berjalan dan dikosongkan
otomatis saat tanggal berganti, jadi spreadsheet tidak membengkak.
Rekap pendaftaran tetap tersimpan permanen di sheet `Pendaftaran`.

## Privasi papan publik

Halaman `/antrean.html` hanya menerima nomor antrean dan nama yang
disingkat (contoh: "Budi S."). Keluhan, alamat, nomor HP, dan nomor
KTP/kartu tidak pernah dikirim ke halaman publik.


---

# Perubahan versi terbaru — yang perlu Anda lengkapi

## 1. Nama apoteker (WAJIB diisi)
`src/data/site.js` - array `APOTEKER` masih berisi "(Nama apoteker menyusul)".
Ganti dengan nama asli, lalu `node build.js`. Bagian ini sengaja dibuat
tanpa tombol janji temu sesuai permintaan klinik.

## 2. Nomor WhatsApp Top Dokter
Sudah dipasang `0857-5559-1040` di `CONFIG.waByService['Top Dokter']`
dan di Script Property `WA_TOPDOKTER`. Formulir Top Dokter sengaja
tidak menampilkan perkiraan biaya.

## 3. Sheet baru di Apps Script
Jalankan ulang `setup()` — akan dibuat sheet **TopDokter** berisi
kolom nomor kartu, nama, umur, berat badan, alamat, jenis obat,
dan keluhan. Lalu **Deploy - New version**.

## 4. Angka kerja sama RSU Aminah
Masih placeholder di `AMINAH` (`src/data/site.js`) dan ditandai
kotak kuning di halaman. Ganti sebelum dipakai promosi.

## 5. Arah Pengembangan Klinik
Dipindah ke panel admin, tab **Rekap & Ekspor**. Tidak lagi tampil
di halaman publik mana pun.

## 6. Layanan yang berubah
| Layanan | Status |
|---|---|
| Vaksinasi umum | Dihapus |
| Vaksinasi Umrah & Haji | Fokus baru, kerja sama RSU Aminah |
| Terapi Bekam | Layanan baru |
| Pelayanan Farmasi | Info-saja, tanpa pendaftaran (Depo Farmasi internal) |
| Top Dokter | Formulir khusus, tanpa tampilan biaya |

Fasilitas "Apotek Mahira Farma" pada daftar fasilitas klinik kini
bernama **Depo Farmasi Klinik**. Halaman Apotek (3 cabang Mahira Farma)
tidak diubah — itu ekosistem apotek, berbeda dari depo internal klinik.

---

# Editor Konten (panel admin)

Menu, layanan, dokter, fasilitas, rekanan, produk, artikel, dan info
klinik kini bisa ditambah, diedit, dan dihapus sendiri lewat
`/admin` - tab **Konten Situs**, tanpa perlu mengubah kode.

## Cara kerjanya

Situs ini statis, jadi perubahan tidak langsung tayang:

1. Anda edit di panel admin - tersimpan di Apps Script.
2. Tekan **Terbitkan** - Netlify membangun ulang situs.
3. 1-2 menit kemudian perubahan tayang.

Keuntungannya: halaman tetap ringan, tetap terbaca Google dengan baik,
dan layanan baru benar-benar mendapat halamannya sendiri.

## Pemasangan sekali saja

### 1. Tempel ulang Code.gs & jalankan setup()
Akan dibuat sheet **Konten**. Lalu **Deploy - New version**.

### 2. Buat Build Hook Netlify
Netlify - **Site configuration - Build & deploy - Build hooks -
Add build hook**. Beri nama bebas (misal "Dari panel admin"),
pilih branch utama, lalu salin URL-nya.

### 3. Tempel di panel admin
`/admin` - tab **Konten Situs** - buka **Pengaturan penerbitan**,
tempel URL build hook, tekan Simpan.

### 4. Isi editor dengan konten yang sekarang tayang
Tekan tombol **Isi dari data situs** satu kali. Seluruh isi situs
disalin ke editor supaya bisa diedit. Aman ditekan ulang — item yang
sudah ada tidak akan ditimpa atau terduplikasi.

## Aturan yang perlu diingat

- **ID item** hanya boleh huruf kecil, angka, dan tanda hubung.
  Untuk layanan dan artikel, ID harus sama dengan slug — karena ID
  itulah yang menjadi alamat halamannya (`poli-anak` →
  `/layanan/poli-anak.html`).
- **Daftar bertingkat** diisi satu baris per item. Untuk yang
  berpasangan, pakai pemisah ` :: `:
  ```
  Tumbuh kembang :: Penimbangan dan penilaian milestone.
  Keluhan harian :: Demam, batuk, diare, dan ruam kulit.
  ```
- **Sembunyikan vs Hapus.** Sembunyikan menyimpan datanya tapi
  menghilangkannya dari situs — dipakai untuk layanan yang sedang
  tidak berjalan. Hapus membuang datanya permanen.
- **Menghapus layanan juga menghapus halamannya** dari situs setelah
  diterbitkan, termasuk dari sitemap dan daftar pendaftaran.
- **Poli antrean** (di Info Klinik → Pengaturan antrean) harus sama
  persis dengan `ANTREAN_POLI` di `backend/Code.gs`. Mengubah di satu
  tempat saja membuat papan antrean tidak cocok.

## Bila server konten bermasalah

Build tidak akan gagal. Bila Apps Script tidak terjangkau atau
belum berisi apa pun, situs dibangun memakai data bawaan di
`src/data/site.js` — dan log build menuliskan alasannya. Jadi situs
tidak pernah hilang hanya karena CMS-nya sedang mati.

Untuk sengaja membangun tanpa konten server:

```bash
KONTEN_OFF=1 node build.js
```
