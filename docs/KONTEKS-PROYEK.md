# Konteks Proyek — Klinik Pratama Sehat Sejahtera Blitar

> **Untuk asisten AI atau developer baru.** Baca berkas ini lebih dulu
> sebelum mengubah apa pun. Isinya seluruh keputusan, alasan, dan
> jebakan yang sudah ditemukan — supaya tidak diulang dari nol.
>
> Terakhir diperbarui: 15 September 2026

---

## 1. Apa ini

Situs + PWA untuk Klinik Pratama Sehat Sejahtera, Sananwetan, Kota Blitar.
Fungsinya: profil klinik, pendaftaran online, papan antrean real-time,
konsultasi Top Dokter lewat WhatsApp, dan panel admin yang sekaligus
menjadi CMS.

**Alamat tayang:** https://kliniksehatsejahtera.netlify.app
**Deploy:** Netlify, terhubung ke repositori GitHub.

---

## 2. Bentuk arsitekturnya

```
src/data/site.js   ← data bawaan (layanan, dokter, teks, konfigurasi)
src/render.js      ← komponen & kerangka halaman
src/pages.js       ← isi tiap halaman
src/konten.js      ← menarik konten CMS dari Apps Script saat build
build.js           ← generator: mengubah semuanya jadi HTML statis di public/
public/            ← HASIL BUILD — yang di-deploy Netlify
backend/Code.gs    ← seluruh backend (Google Apps Script + Spreadsheet)
```

**Penting:** `public/` adalah keluaran build, TAPI berisi juga berkas
yang ditulis tangan dan tidak dihasilkan generator:

- `public/assets/css/style.css`
- `public/assets/js/app.js`, `forms.js`, `antrean.js`, `status.js`, `admin.js`, `admin-konten.js`
- `public/admin/index.html`

Berkas HTML lain di `public/` **ditimpa setiap build** — jangan diedit
langsung, editlah `src/`.

### Alur data

```
Panel admin  →  Apps Script (sheet Konten)  →  build.js menarik saat build
                                            →  HTML statis  →  Netlify
```

Formulir pasien dan antrean berjalan terpisah, langsung ke Apps Script
saat halaman dibuka (bukan saat build).

---

## 3. Keputusan yang sudah diambil (JANGAN diubah tanpa bertanya)

### Model penerbitan
Konten diedit di panel admin, lalu tombol **Terbitkan** memicu Netlify
Build Hook → situs dibangun ulang (1–2 menit). **Bukan** konten dinamis.
Alasannya: SEO tetap kuat, halaman tetap ringan, dan tiap layanan punya
halaman sendiri. Ini dipilih pemilik setelah ditawarkan tiga opsi.

### Aturan antrean
Di `backend/Code.gs`:

| Konstanta | Nilai | Arti |
|---|---|---|
| `MAKS_PANGGIL` | 3 | Dipanggil 3x tanpa respons → ditandai tidak hadir |
| `LEWATI_N` | 2 | Dilewati 2 pasien, lalu dipanggil kembali |
| `MAKS_PUTARAN` | 1 | Dikembalikan sekali; sesudahnya butuh tindakan admin |

- Tombol **Konfirmasi** di tab Pendaftaran bukan sekadar mengganti status:
  pasiennya langsung masuk papan antrean hari ini sebagai pasien
  **online**, lalu tampilan berpindah ke tab Antrean. Karena masuk sebagai
  online, aturan "offline didahulukan" tetap berlaku — kalau antrean online
  belum dibuka ia berstatus `tunggu` dan nomornya keluar saat tombol Buka
  Antrean Online ditekan. Baris antrean menyimpan `regId` supaya satu
  pendaftaran tidak bisa masuk papan dua kali; **Batal** mencabut nomornya.
  Pendaftaran yang tanggal kunjungannya bukan hari ini, atau layanannya di
  luar Poli Umum/Gigi, hanya berubah status dan alasannya ditampilkan.
- Formulir **Tambah ke Antrean** (pasien datang langsung) memakai kolom yang
  sama dengan pendaftaran online — nama, umur, WA, jenis & nomor kartu,
  alamat, keluhan — agar datanya sama lengkap. Hanya poli dan nama yang wajib.
- Pasien **offline (datang langsung) selalu didahulukan**. Admin mencatat
  mereka dulu, lalu menekan **Buka Antrean Online** — barulah pendaftar
  online mendapat nomor, mengantre di belakang.
- Pasien terlewat yang dipanggil kembali mendapat **jatah 3 panggilan
  baru** (hitungannya direset). Tanpa ini ia langsung terlewat lagi.
- Warna: putih = belum dipanggil, hijau = sedang ditangani,
  kuning = tidak hadir, abu-abu = selesai.
- Antrean hanya untuk **Poli Umum (U)** dan **Poli Gigi (G)**.
- Data antrean **harian, tidak permanen** — sheet `AntreanHari`
  dikosongkan otomatis tiap pergantian hari oleh trigger 00.05 WIB.

### Layanan
`poli-umum, poli-gigi, khitan, umrah-haji, bekam, farmasi, top-dokter`

- **Vaksinasi umum ditiadakan.** Hanya Vaksinasi Umrah & Haji, hasil
  kerja sama resmi dengan RSU Aminah.
- **Pelayanan Farmasi = informasi saja**, tanpa pendaftaran. Klinik punya
  Depo Farmasi internal; bila obat kosong, pasien diarahkan ke cabang
  Apotek Mahira Farma. Ditandai `tanpaDaftar: true`.
- **Top Dokter** punya formulir sendiri dan **tidak menampilkan biaya**
  (`tanpaBiaya: true`). Terhubung ke WA admin 0857-5559-1040.
- Fitur **testimoni sudah dihapus seluruhnya** atas permintaan pemilik —
  jangan dihidupkan kembali.
- Alur pelayanan langkah 4 berbunyi **"Penebusan obat"**: resep diteruskan
  ke **Depo Farmasi klinik** lebih dulu; baru bila obatnya kosong pasien
  diarahkan ke apotek terdekat atau cabang Apotek Mahira Farma. Janji
  "jadwal kontrol diingatkan lewat WhatsApp" **dihapus** — belum ada yang
  menjalankannya, jadi jangan ditulis ulang.

### Jam operasional
- 06.00–11.30 pelayanan praktek
- **11.30–13.00 administrasi apotek — tidak melayani praktek**
- 17.00–20.30 operasional malam
- Apotek Mahira Farma (tiga cabang): 07.00–21.00 setiap hari

### Jenis kartu pasien
Satu sumber: `CONFIG.jenisKartu` di `src/data/site.js`, dipakai formulir
pendaftaran online, formulir antrean panel admin, dan aturan pemeriksaan
di `forms.js`. Menambah jenis kartu cukup di sana.

| Jenis | Aturan nomor |
|---|---|
| KTP / KIA / KK | 16 digit pasti |
| BPJS | 13 digit pasti |
| **RM (rekam medis)** | **bebas bentuk**, minimal 3 karakter |
| Lainnya | angka, minimal 6 digit |

Nomor rekam medis klinik **tidak seragam** — bisa pendek dan memakai
huruf (`RM-00123`). Karena itu `format: 'bebas'`: penyaring huruf di
`forms.js` dan `noKartu_()` di `backend/Code.gs` dilonggarkan khusus
untuk jenis ini (lihat `KARTU_BEBAS`). Kalau disaring jadi digit seperti
NIK, isian pasien akan **terbuang diam-diam**. Bila menambah jenis kartu
bebas bentuk yang baru, daftarkan di **dua tempat** itu.

### Status buka/tutup dihitung, bukan ditulis
Kartu di beranda dan papan antrean **tidak lagi memuat teks status yang
dipatok** ("Buka", "Kuota 8"). Semuanya dihitung dari satu sumber:
`CONFIG.statusBaris` di `src/data/site.js`.

| Baris | Jadwal |
|---|---|
| Poli Umum | Sen–Sab 06.00–11.30 & 17.00–20.30 |
| Poli Gigi | Sen–Sab 08.00–10.00; Sen/Rab/Jum 18.00–20.00 |
| Khitan | tanpa jam — selalu "Perjanjian" |
| Apotek | tiap hari 07.00–21.00 |

`public/assets/js/status.js` dipakai **dua kali**: di-`require` build.js
untuk mengisi HTML awal, dan berjalan di browser untuk menghitung ulang
tiap 30 detik. Jadi halaman yang lama terbuka atau diambil dari cache
service worker tidak pernah menampilkan "Buka" di tengah malam. Jam
selalu dihitung di **Asia/Jakarta lewat `Intl`**, bukan jam perangkat
pengunjung — jangan diganti `new Date().getHours()`.

Lencana **Live** di kepala kartu menyala bila ada satu poli pun yang
sedang buka; di luar itu "Tutup".

### Dokter izin
Saklar per poli per sesi di tab Antrean panel admin. Disimpan di Script
Property `IZIN_HARI` dan **hangus sendiri saat tanggal berganti**.
Halaman publik membacanya lewat `?action=status` (tiap 5 menit), jadi
efeknya langsung tanpa menekan Terbitkan dan tanpa build ulang. Kalau
permintaan itu gagal, halaman tetap berjalan memakai jadwal biasa.

### Tenaga medis
| Nama | Poli | Jadwal |
|---|---|---|
| dr. Hafidhullah Hanif (penanggung jawab) | Umum | Sen–Kam 08.00–11.30 |
| dr. Wasingah | Umum | Sen–Jum 06.00–08.00 & 17.00–20.30; Sabtu malam saja |
| dr. Monalisa | Umum | Jum & Sab 08.00–11.30 |
| drg. Maylia Widiastuti | Gigi | Sen–Sab 08.00–10.00 |
| drg. Lailiz Zulfa | Gigi | Sen, Rab, Jum 18.00–20.00 |

Bagian **apoteker hanya menampilkan nama** — tidak boleh ada tombol
janji temu. Nama apoteker masih placeholder.

### Nomor WhatsApp
| Keperluan | Nomor |
|---|---|
| Admin pendaftaran | 0896-5350-2700 |
| Admin khitan | 0878-4030-1148 |
| Admin Top Dokter | 0857-5559-1040 |
| Admin bekam & vaksinasi umrah/haji | 0857-5559-1040 |

Nomor per layanan ada di **dua tempat** dan harus sama: `waByService`
(`src/data/site.js`) untuk sisi situs, dan `waTujuanLayanan_()`
(`backend/Code.gs`, memakai Script Property `WA_ADMIN_KHITAN` /
`WA_BEKAM_VAKSIN`) untuk notifikasi ke admin.

### Informasi yang disembunyikan dari publik
"Arah Pengembangan Klinik" hanya tampil di panel admin (tab Rekap &
Ekspor), atas permintaan pemilik.

---

## 4. Jebakan yang sudah pernah menggigit

Semua ini nyata, sudah terjadi, dan sudah diperbaiki. Jangan diulang.

### `[hidden]` kalah dari CSS class
`.login{display:grid}` dan `.q-alert{display:flex}` mengalahkan aturan
bawaan browser `[hidden]{display:none}` karena spesifisitasnya sama tapi
dideklarasikan belakangan. Akibatnya elemen tetap tampil meski
`el.hidden = true`. **Sudah dipasang `[hidden]{display:none!important}`**
di `style.css` dan di `<style>` halaman admin. Jangan dihapus.

### Aset di-cache setahun tanpa penanda versi
`_headers` memberi `/assets/*` cache `immutable` satu tahun. Karena nama
berkasnya tidak berubah, pengunjung lama **selamanya** memakai JS/CSS
lama — ini pernah memunculkan error `Cannot set properties of null`
di panel admin. **Sudah diperbaiki:** `build.js` menghitung penanda
`?v=<hash>` dari isi berkas dan menempelkannya ke semua URL aset,
termasuk di `admin/index.html` dan daftar precache service worker.
Kalau menambah berkas JS/CSS baru, **daftarkan di `ASET_SUMBER`**
dalam `build.js`.

### Satu id hilang menghentikan seluruh render
`renderKpi()` dulu menulis ke `#k-minggu` yang sudah dihapus dari HTML →
seluruh pemuatan data admin gagal. Sekarang memakai helper `set()` yang
memeriksa keberadaan elemen. Pertahankan pola itu.

### Layanan baru menggagalkan build
`svcSeo` di `build.js` tidak punya entri untuk slug baru → `m.t` error.
Sekarang ada fallback yang membentuk judul & kata kunci otomatis.

### Halaman yatim
Layanan/artikel yang dihapus tetap tertinggal di `public/` dan URL
lamanya masih bisa dibuka. `build.js` kini menghapus HTML di
`public/layanan/` dan `public/artikel/` yang tidak ada di daftar.

### Kolom baru tidak muncul di spreadsheet lama
`HEADERS` di `backend/Code.gs` dulu hanya dipakai saat sheet **dibuat**.
Menambah kolom (mis. `regId`) tidak berpengaruh pada spreadsheet yang sudah
ada — nilainya ditulis ke kolom tanpa judul lalu hilang saat dibaca.
Sekarang `sheet_()` menambahkan judul kolom yang kurang di ujung kanan,
sekali per eksekusi. Karena itu **kolom baru selalu ditaruh paling belakang**
di `HEADERS`, jangan disisipkan di tengah.

### Editor konten membuang kunci yang tidak punya kolom
`kontenSimpan` dulu menyusun objek **dari nol** hanya dari kolom yang
ada di `SKEMA`. Koleksi daftar (layanan, dokter, apotek, artikel)
ditimpa seluruhnya oleh `src/konten.js` saat build, jadi kunci yang
tidak punya kolom formulir **lenyap begitu item disunting** — tautan
Google Maps dan catatan cabang apotek hilang dengan cara ini, dan
tombol "Peta" ikut mati. Sekarang penyimpanan berangkat dari isi lama
lalu kolom formulir menimpa atau menghapusnya. Kalau menambah kunci
baru di `src/data/site.js`, **tetap daftarkan kolomnya di `SKEMA`**
agar bisa diedit; kunci tanpa kolom kini aman, tapi tidak terlihat.

Koleksi `config` tidak terkena ini karena di-`Object.assign`, bukan
ditimpa.

### Kolom bersarang di editor konten
Alamat klinik (`CONFIG.address`) berupa objek, bukan teks. Editor punya
tipe kolom **`grup`** dengan daftar `sub` — dirender sebagai beberapa
isian lalu dirakit kembali jadi satu objek saat disimpan. Aturannya:

- Bila kunci itu belum ada di CMS, isian diambil dari `KLINIK_BAWAAN`
  supaya admin tidak melihat kotak kosong padahal situs ada isinya.
- Bila **semua** isian dikosongkan, kuncinya **tidak ditulis** — menulis
  objek kosong akan menimpa data bawaan situs dengan kekosongan.
- Sub-kunci tanpa isian (mis. `country`) terbawa utuh dari isi lama.
- `cek: 'url' | 'lintang' | 'bujur'` memvalidasi isian sebelum disimpan.
  Koordinat wajib memakai titik, bukan koma.

### `ANTREAN_POLI` harus sama di dua tempat
`backend/Code.gs` dan `src/data/site.js` (`ANTREAN.poli`). Kalau beda,
papan antrean tidak cocok.

### ID item = slug
Untuk layanan dan artikel di CMS, ID item **harus sama** dengan slug —
karena ID itulah yang jadi alamat halaman. Editor sudah menolak kalau
berbeda.

### Deploy Netlify
Yang dipublikasikan adalah **isi folder `public/`**, bukan folder root.
Dulu pernah muncul "Page not found" karena yang ter-deploy folder root
yang tidak punya `index.html`. Sekarang `netlify.toml` mengaturnya.
Saat mengunggah ke GitHub, **seret ISI folder**, bukan foldernya —
`netlify.toml` harus berada di akar repositori.

---

## 5. Yang masih perlu dikerjakan

- [ ] **Nama apoteker** — masih "(Nama apoteker menyusul)" di `APOTEKER`
- [ ] **Angka kerja sama RSU Aminah** — potongan harga & cashback masih
      contoh, ditandai kotak kuning di halaman
- [ ] **Build Hook Netlify** — harus dibuat dan ditempel di panel admin
      agar tombol Terbitkan berfungsi
- [ ] **Foto asli klinik** — galeri fasilitas masih ilustrasi SVG
- [ ] Integrasi BPJS Kesehatan & SATUSEHAT (rencana jangka panjang)

---

## 6. Cara menjalankan

```bash
node build.js                      # bangun situs ke public/
KONTEN_OFF=1 node build.js         # abaikan CMS, pakai data bawaan
KONTEN_URL=<url>/exec node build.js  # tarik konten dari Apps Script tertentu
npx serve public                   # pratinjau lokal
```

Build **tidak pernah gagal** hanya karena server konten mati — ia jatuh
ke data bawaan `src/data/site.js` dan menuliskan alasannya di log.
Sifat ini disengaja; jangan diubah jadi gagal-keras.

---

## 7. Masuk panel admin

`/admin` — tidak ada tautan dari situs publik, `noindex`, diblokir robots.

- **Mode demo** (Apps Script belum dipasang): `admin` / `demo`
- **Mode produksi**: `admin` / kata sandi di Script Property
  `ADMIN_PASS_HASH`. Kata sandi awal `ubahsaya123` — **wajib diganti**
  lewat fungsi `buatHash("sandibaru")`.

Sesi 6 jam. Lima kali salah → terkunci 15 menit.

---

## 8. Dokumen lain

- `DEPLOY-NETLIFY.md` — langkah deploy, antrean, dan editor konten
- `docs/ARSITEKTUR.md` — rincian teknis & deploy Apps Script
- `README.md` — ringkasan proyek
