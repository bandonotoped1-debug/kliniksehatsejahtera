# Klinik Pratama Sehat Sejahtera — Website + PWA

Website klinik & apotek terpadu di Kota Blitar. Statis, cepat, bisa dipasang
di HP sebagai aplikasi (PWA), dan terhubung ke Google Spreadsheet sebagai
database lewat Google Apps Script.

Dokumen lengkap: **[docs/ARSITEKTUR.md](docs/ARSITEKTUR.md)**

---

## Jalan cepat (3 menit)

```bash
# 1. Lihat hasilnya di komputer
cd public && python3 -m http.server 8080
# buka http://localhost:8080

# 2. Setelah mengubah konten
node build.js
```

Panel admin ada di `http://localhost:8080/admin/`
Mode demo (sebelum Apps Script terpasang): **admin / demo**

---

## Yang sudah jadi

**Halaman publik (19 halaman)**
Beranda · Profil · Layanan (+5 halaman detail) · Dokter · Apotek ·
Testimoni · Artikel (+3 artikel) · Pendaftaran · Kontak · Kebijakan Privasi · Offline

**Fitur**
- PWA: bisa dipasang di layar utama HP, jalan saat offline, punya shortcut
  "Daftar", "Top Dokter", dan "Apotek"
- Pendaftaran online → tersimpan ke Spreadsheet **dan** otomatis membuka
  WhatsApp berisi ringkasan terformat untuk admin
- Antrean offline: bila koneksi putus, data disimpan di perangkat dan
  dikirim ulang otomatis saat online
- Panel admin tersembunyi: dashboard KPI, kelola status pendaftaran,
  moderasi testimoni, pesan masuk, rekap & ekspor CSV
- SEO lokal Blitar: schema.org `MedicalClinic` + `FAQPage` + `Article`,
  sitemap, canonical, Open Graph, meta geo
- Transisi antarhalaman halus (View Transitions API), mode gelap otomatis

---

## Struktur singkat

```
src/data/site.js   ← ★ ubah SEMUA konten di sini
build.js           ← lalu jalankan: node build.js
public/            ← hasilnya; folder inilah yang di-deploy
backend/Code.gs    ← tempel ke Google Apps Script
docs/ARSITEKTUR.md ← panduan lengkap
```

---

## Sebelum dipublikasikan

Baca **[Daftar Periksa Sebelum Go-Live](docs/ARSITEKTUR.md#13-daftar-periksa-sebelum-go-live)**.
Tiga hal yang paling penting:

1. **Nama dokter** di `DOCTORS` masih placeholder — ganti dengan data asli.
2. **Testimoni** di `TESTIMONIALS` adalah contoh tampilan, **bukan ulasan
   asli** — ganti dengan testimoni berizin, atau kosongkan dan andalkan
   testimoni dari spreadsheet.
3. **Gambar fasilitas** adalah ilustrasi vektor buatan, bukan foto klinik —
   ganti dengan foto asli di `public/assets/img/fasilitas/`.

---

## Ganti kata sandi admin

Di editor Apps Script, jalankan `buatHash("KataSandiBaru")`, salin hasilnya
dari Execution log, lalu tempel ke Script Property `ADMIN_PASS_HASH`.
