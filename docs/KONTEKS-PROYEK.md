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
- Fitur testimoni umum **tetap dihapus**. Yang hidup kembali atas
  permintaan pemilik hanyalah **testimoni khusus khitan** di halaman
  layanan khitan (koleksi `testiKhitan`) — jangan melebarkannya ke
  layanan lain tanpa diminta.

  Tiga aturan yang **ditegakkan kode**, bukan sekadar imbauan:
  1. Hanya item dengan **izin dicentang** yang dirender. Tanpa centang,
     testimoninya tersimpan tapi tidak pernah tayang. Ini pengaman
     persetujuan orang tua — jangan diubah jadi sekadar catatan.
  2. Petunjuk di editor meminta **nama depan atau inisial**, bukan nama
     lengkap anak. Halaman ini publik dan terindeks mesin pencari.
  3. Petunjuk gambar meminta **foto suasana** (anak berpakaian lengkap,
     keluarga, atau ruangan), bukan foto bagian tubuh.

  Tayangannya berjalan otomatis tapi berhenti saat disentuh, di-hover,
  atau difokus keyboard; berhenti saat tab tak terlihat; dan tidak
  berjalan sama sekali bila perangkat memilih "kurangi animasi".
  Gambar dipakai dari tautan yang ditempel admin — bila tautannya mati,
  gambarnya disembunyikan dan kartunya tetap utuh.
- **Perkiraan biaya disembunyikan** dari seluruh halaman publik lewat
  `CONFIG.tampilkanBiaya: false`. Angka harganya sengaja **tetap disimpan**
  di tiap layanan — kalau kelak ingin ditampilkan lagi, cukup ubah satu
  bendera itu. Jangan hapus datanya.
- **Lowongan kerja** (`/lowongan.html`) memakai koleksi CMS `lowongan` dan
  sengaja **dikirim kosong** — halaman ini dibaca pelamar sungguhan, jadi
  jangan pernah diisi contoh. Halamannya otomatis menulis "belum ada
  lowongan" bila daftarnya kosong, dan selalu memuat peringatan bahwa
  proses lamaran tidak dipungut biaya.
- **Produk Unggulan Apotek** (`/produk-apotek.html`) dirakit dari koleksi
  `produk` yang sudah ada — tidak ada data baru, satu sumber tetap.
- Alur pelayanan langkah 4 berbunyi **"Penebusan obat"**: resep diteruskan
  ke **Depo Farmasi klinik** lebih dulu; baru bila obatnya kosong pasien
  diarahkan ke apotek terdekat atau cabang Apotek Mahira Farma. Janji
  "jadwal kontrol diingatkan lewat WhatsApp" **dihapus** — belum ada yang
  menjalankannya, jadi jangan ditulis ulang.

### Pertanyaan tambahan per layanan
Tiap layanan boleh punya `formulir`: daftar pertanyaan yang muncul di
halaman pendaftaran **begitu layanan itu dipilih**, disusun klinik lewat
panel admin (kolom "Pertanyaan tambahan"). Formatnya satu baris satu
pertanyaan: `Pertanyaan :: tipe :: wajib :: pilihan1|pilihan2`, dengan
tipe `teks, area, angka, tanggal, pilih, centang`.

- Dikirim bersama data lain dan disimpan sebagai **JSON di satu kolom**
  `tambahan` pada sheet Pendaftaran — supaya kolom sheet tidak bertambah
  tiap klinik menambah pertanyaan. Maksimal 25 pertanyaan per kiriman.
- Jawabannya ikut masuk ringkasan WhatsApp ke admin dan tampil di bawah
  keluhan pada tab Pendaftaran.
- Berganti layanan **menghapus jawaban sebelumnya**, supaya jawaban
  layanan lain tidak ikut terkirim.
- Dikirim kosong untuk semua layanan: hanya klinik yang tahu apa yang
  perlu ditanyakan sebelum tindakan.

### Jam operasional
- 06.00–11.30 pelayanan praktek
- **11.30–13.00 administrasi apotek — tidak melayani praktek**
- 17.00–20.30 operasional malam
- Apotek Mahira Farma (tiga cabang): 07.00–21.00 setiap hari

### Akun panel: super admin & admin biasa
Akun disimpan di sheet **`Admin`**, bukan lagi satu akun di Script
Property. Dua peran:

| Peran | Bisa apa |
|---|---|
| **super** | Semua bagian + mengelola akun (tab Pengguna Panel) |
| **admin** | Hanya bagian yang dicentangkan untuknya |

Bagian yang bisa dicentang: `antrean, daftar, konten, pesan, rekap`.

Yang penting dipahami:

- **Penyaringan terjadi di server, bukan cuma di tampilan.** Menu yang
  tidak diizinkan memang disembunyikan, tapi `daftarSemua_()` juga tidak
  mengirim datanya, dan tiap aksi dijaga `wajibAkses_()`. Jangan
  "menyederhanakan" dengan hanya menyembunyikan menu.
- **Kata sandi tidak pernah disimpan.** Yang disimpan hash SHA-256 dari
  `SALT skrip + salt akun + kata sandi`. Salt per akun bikin dua orang
  dengan kata sandi sama punya hash berbeda.
- **Super admin terakhir dilindungi**: tidak bisa diturunkan jadi admin
  biasa, dinonaktifkan, atau dihapus selama tidak ada super admin aktif
  lain — kalau tidak, tidak ada lagi yang bisa mengelola akun. Akun
  sendiri juga tidak bisa dihapus.
- **Akun bawaan** (`ADMIN_USER`/`ADMIN_PASS_HASH` di Script Property)
  tetap berlaku **selama sheet Admin masih kosong**, supaya panel tidak
  pernah terkunci saat diperbarui. Begitu super admin pertama dibuat —
  atau begitu akun bawaan mengganti kata sandinya, yang otomatis
  memindahkannya ke sheet — akun bawaan berhenti dipakai.
- Semua peran bisa **mengganti kata sandinya sendiri** lewat tombol di
  bar atas; wajib menyebutkan kata sandi lama.

### Tampilan panel admin
Kerangkanya: **menu tetap di sisi kiri** (`.asb` + `.anav`) dan isi di
kanan (`.amain`) — bukan lagi barisan tab pil. Di bawah 1000px menu jadi
**lemari geser**: tombol hamburger membukanya, tirai gelap menutupnya,
dan memilih bagian menutupnya sendiri. Bar atas menampilkan judul bagian
yang sedang dibuka; sapaan dan tanggal dihitung di **WIB**.

Tombol menu memakai `[data-tab]`, panelnya `.tabpane[data-pane]` — dua
kait itu yang dipakai `bukaTab()` di `admin.js`. **Jangan ganti ke
selektor berbasis `.tabs`**; kelas itu sudah tidak ada.

Di bawah 760px, tabel Pendaftaran & Pesan berubah jadi **kartu
bertumpuk** lewat CSS: tiap `<td>` wajib punya `data-l="Judul kolom"`,
karena label kartunya diambil dari atribut itu (`td::before`). Menambah
kolom tabel? Tambahkan `data-l`-nya juga, kalau tidak barisnya muncul
tanpa keterangan di HP.

### Jebakan spesifisitas di bar alamat
`@media{.tb-addr{display:none}}` **tidak pernah bekerja** karena
`.topbar span` (kelas + elemen) lebih kuat daripada `.tb-addr` (kelas
saja), berapa pun urutannya. Akibatnya alamat dan jam tetap dirender di
HP lalu terpotong `overflow:hidden` — pengunjung melihat teks
terpenggal. Sekarang ditulis `.topbar .tb-addr`. Pola yang sama berlaku
untuk aturan penyembunyi lain: **samakan atau lebihi spesifisitas aturan
yang menampilkan**, jangan hanya mengandalkan urutan.

### Penyimpanan di HP pasien dibersihkan tiap hari
`forms.js` menyimpan kiriman tertunda (`klinik-queue-v1`) bila jaringan
pasien sedang putus. Pendaftaran untuk tanggal yang **sudah lewat tidak
berguna** dikirim ulang, jadi begitu tanggal WIB berganti sisanya dibuang
dan kunci `klinik-*` di luar daftar `KUNCI_DIPAKAI` ikut dihapus — supaya
penyimpanan di HP pasien tidak terus menumpuk. Menambah kunci
`localStorage` baru? **Daftarkan di `KUNCI_DIPAKAI`**, kalau tidak ia akan
terhapus sendiri pada kunjungan berikutnya.

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

### Pendaftaran kadaluarsa tidak ikut ditampilkan
Tab Pendaftaran punya penyaring **lingkup tanggal** (`#f-lingkup`) dengan
empat pilihan; bawaannya **Aktif**:

| Pilihan | Yang tampil |
|---|---|
| `aktif` (bawaan) | tanggal kunjungan ≥ hari ini, **plus** yang sudah lewat tapi statusnya masih `Baru`/`Konfirmasi` |
| `hari` | hanya tanggal hari ini |
| `lewat` | hanya yang tanggalnya sudah lewat |
| `semua` | seluruh data yang dikirim server (60 hari / 600 baris terakhir) |

Dua aturan yang sengaja dibuat begitu:

1. Baris lama yang masih `Baru`/`Konfirmasi` **tetap muncul** di lingkup
   Aktif — kalau disembunyikan, pekerjaan yang belum selesai ikut hilang
   dari pandangan petugas. Daftarnya ada di `PERLU_TINDAKAN`.
2. Mengisi kotak tanggal (`#f-tanggal`) **mengalahkan** lingkup, jadi
   petugas selalu bisa membuka satu tanggal tertentu tanpa mengubah
   pilihan lingkup lebih dulu.

Data lama **tidak dihapus** dari spreadsheet — hanya tidak ditampilkan.

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

### `Unexpected token '<'` saat masuk panel
Apps Script **tidak selalu membalas JSON**. Kalau deployment belum
diterbitkan ulang sebagai versi baru, atau aksesnya bukan "Anyone", ia
membalas **halaman HTML login Google**. `r.json()` lalu melempar
`Unexpected token '<', "<!DOCTYPE "...` — pesan yang tidak berarti
apa-apa bagi petugas loket.

**Sudah diperbaiki di `api()` (`public/assets/js/admin.js`):**

- balasan dibaca sebagai **teks dulu**, diperiksa `<!DOCTYPE`/`<html`,
  baru di-`JSON.parse`;
- ada **batas waktu 25 detik** lewat `AbortController` — dulu tombol
  "Memeriksa…" bisa menggantung selamanya;
- kegagalan **sementara** (jaringan putus, timeout, HTTP 5xx) dicoba
  ulang **sekali**, karena permintaan pertama ke Apps Script yang lama
  menganggur sering gagal karena cold start. Balasan HTML dan error
  dari server (`ok:false`) ditandai `sementara = false` — itu kesalahan
  pengaturan, mengulanginya cuma membuang waktu.

Kalau menambah pemanggil baru, pakai `api(aksi, data, { saatUlang })`
supaya petugas tahu panel sedang mencoba ulang, bukan macet.

### Deployment lama terkunci di VERSI LAMA — pakai "New version"
Di Apps Script ada dua tombol yang kelihatan mirip:

- **Deploy → Manage deployments → ✏️ → New version** → URL `/exec` tetap
  sama **dan** kodenya ikut diperbarui. Ini yang benar.
- **Deploy → New deployment** → mencetak URL `/exec` **baru**. Deployment
  lama tetap hidup, tetapi **terkunci pada versi kode saat ia dibuat**.

Terjadi 18–19 Sep 2026. URL di `site.js` masih menunjuk deployment lama;
`?action=status` di sana membalas `{"ok":false,"error":"Aksi tidak
dikenal"}` karena `doGet` versi itu belum mengenal `status`. Jadi kode
`Code.gs` di editor sudah baru, tapi yang **dilayani ke situs** masih
yang lama. Gejalanya membingungkan: sebagian fitur jalan, sebagian tidak,
dan login kadang berhasil kadang gagal.

**Cara memeriksa, dan jebakannya.** Buka di browser:
`<gasUrl>?action=status`. Sehat bila membalas
`{"ok":true,"tanggal":...}`. Kalau membalas "Aksi tidak dikenal",
deployment itu memakai kode lama.

⚠️ **Jangan menguji URL ini dari sandbox/agen** — `WebFetch` dan `curl`
dari lingkungan Claude membalas **404 untuk URL Apps Script yang sehat
sekalipun**. Sempat membuat kesimpulan keliru "URL-nya mati". Uji selalu
dari browser sungguhan (Claude in Chrome atau browser pemilik klinik).

Dari dalam browser, deployment mati **tidak bisa dibedakan** dari
"internet putus" — fetch lintas-asal yang gagal selalu muncul sebagai
`TypeError: Failed to fetch`, tanpa kode status. Karena itu pesan
gagalnya menyebut ketiga kemungkinan sekaligus, dan ada tombol **Uji
koneksi server** yang memanggil `?action=status` dengan `mode:'no-cors'`:
kalau permintaan itu selesai, alamatnya hidup dan masalahnya di izin
akses; kalau ikut gagal, alamatnya memang mati.

**Sebelum mengganti `gasUrl`, pastikan spreadsheet-nya sama.** Buka
`<gasUrl baru>?action=konten` dan periksa isinya benar-benar data klinik
ini. Kalau deployment baru ternyata proyek lain, menggantinya akan
membuat situs membaca spreadsheet kosong.

### Batas waktu: pendek, bukan panjang
Percobaan pertama **12 detik**, ditambah satu percobaan ulang → paling
lama ±24 detik. Versi pertama memakai 25 detik × 2 = 50 detik, dan
pemilik klinik langsung mengeluh panelnya *makin lambat* — benar, karena
pada keadaan gagal yang bertambah cuma waktu menunggunya. Kalau menaikkan
angka ini lagi, ingat: yang dirasakan pemakai adalah **waktu sampai ada
kabar**, bukan peluang berhasil. Selama menunggu ditampilkan hitungan
detik berjalan (`hitungMundur()`) supaya layar tidak terlihat beku.

### Muat data panel: satu panggilan, bukan dua
`load()` dulu memanggil `list` lalu **selalu** `adminDaftar`, padahal
daftar akun hanya dipakai di tab Pengguna — login jadi menunggu dua
perjalanan bolak-balik ke Apps Script. Sekarang:

- `cekLogin_` sudah mengembalikan `peran` + `akses`, jadi `enter()`
  langsung memanggil `terapkanAkses()` tanpa menunggu `list`;
- daftar akun dimuat **malas**, sekali saja, saat tab Pengguna dibuka
  (`PG.sudah`);
- sesi disimpan lengkap di `sessionStorage` (`klinik-admin-sesi`) supaya
  F5 tidak sempat memperlihatkan tab yang tidak boleh dibuka;
- backend memakai `rowsAkhir_(sheet, n)` — membaca **N baris terakhir**,
  bukan `getDataRange()` seluruh sheet. Pendaftaran 600 baris, Pesan 300,
  lalu masih disaring 60 hari. Tanpa ini waktu muat panel tumbuh terus
  setiap bulan.

### Pesan gagal muat pernah tersembunyi
Kabar "gagal memuat" dulu ditulis ke `#daftar-status` yang ada **di dalam
tabpane Pendaftaran** — kalau petugas sedang membuka tab Antrean, pesan
(berikut tombol "Coba lagi") tidak terlihat sama sekali. Sekarang ada
`#panel-status` di `.awrap`, **di luar semua tabpane**, dipakai lewat
`pPesan()`/`pBersih()`. `alert()` yang memblokir layar sudah dibuang.

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
