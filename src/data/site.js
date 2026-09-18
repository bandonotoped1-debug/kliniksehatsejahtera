/* =============================================================
 * site.js — SUMBER TUNGGAL SEMUA KONTEN WEBSITE
 * -------------------------------------------------------------
 * Ubah file ini lalu jalankan `node build.js` untuk regenerate
 * seluruh halaman statis di folder /public.
 *
 * ⚠️  SEBELUM GO-LIVE, WAJIB DIGANTI DENGAN DATA ASLI:
 *     - doctors[]     : nama & SIP dokter
 *     - pharmacies[]  : alamat & jam operasional yang presisi
 *     - CONFIG.gasUrl : URL Web App Google Apps Script Anda
 * ============================================================= */

const CONFIG = {
  // Domain final. Bisa ditimpa saat build lewat env: SITE_URL=https://xxx.netlify.app node build.js
  domain: (process.env.SITE_URL || process.env.URL || 'https://kliniksehatsejahtera.netlify.app/').replace(/\/+$/, ''),
  siteName: 'Klinik Pratama Sehat Sejahtera',
  shortName: 'KSS',
  tagline: 'Klinik Pratama & Apotek Terpadu di Kota Blitar',
  // Nomor WhatsApp admin pendaftaran (format internasional tanpa +)
  waNumber: '6289653502700',
  waDisplay: '0896-5350-2700',
  // Nomor khusus per layanan (kosongkan bila memakai nomor utama)
  waByService: {
    'Pelayanan Khitan':       { number: '6287840301148', display: '0878-4030-1148', label: 'Admin Khitan' },
    'Top Dokter':             { number: '6285755591040', display: '0857-5559-1040', label: 'Admin Top Dokter' },
    /* Bekam & Vaksinasi Umrah/Haji ditangani admin yang sama dengan Top Dokter */
    'Terapi Bekam':           { number: '6285755591040', display: '0857-5559-1040', label: 'Admin Bekam & Vaksinasi' },
    'Vaksinasi Umrah & Haji': { number: '6285755591040', display: '0857-5559-1040', label: 'Admin Bekam & Vaksinasi' }
  },
  email: 'kliniksejahtera058@gmail.com',
  address: {
    street: 'Perum Puri Kenari Asri Blok E4, Karangtengah',
    district: 'Kec. Sananwetan',
    city: 'Kota Blitar',
    region: 'Jawa Timur',
    postal: '66137',
    country: 'ID',
    lat: -8.0846,
    lng: 112.1770,
    mapsUrl: 'https://maps.google.com/?q=Klinik+Pratama+Sehat+Sejahtera+Blitar'
  },
  hours: [
    { day: 'Senin – Sabtu', pagi: '06.00 – 11.30', sore: '17.00 – 20.30' },
    { day: 'Minggu & Tgl Merah', pagi: 'Tutup', sore: 'Layanan darurat via WhatsApp' }
  ],
  /* Jadwal operasional rinci — dipakai halaman profil, dokter & kontak */
  jadwalHarian: [
    { sesi: 'Pagi – Siang', jam: '06.00 – 11.30', isi: 'Pelayanan praktek',
      ket: 'Poli Umum, Poli Gigi, Khitan, dan penebusan resep di Depo Farmasi.', buka: true },
    { sesi: 'Siang', jam: '11.30 – 13.00', isi: 'Administrasi apotek',
      ket: 'Tidak melayani praktek. Petugas merapikan stok dan berkas resep.', buka: false },
    { sesi: 'Malam', jam: '17.00 – 20.30', isi: 'Pelayanan praktek',
      ket: 'Operasional malam untuk Poli Umum dan Poli Gigi sesuai jadwal dokter.', buka: true }
  ],
  /* --------------------------------------------- JENIS KARTU
   * Sumber tunggal pilihan "Jenis kartu" — dipakai formulir pendaftaran
   * online (src/pages.js), formulir antrean di panel admin, dan aturan
   * pemeriksaan nomornya di assets/js/forms.js.
   *
   *   format 'angka' : hanya digit. `panjang` = jumlah digit yang pasti,
   *                    tanpa `panjang` berarti minimal `min` digit.
   *   format 'bebas' : boleh huruf, angka, titik, garis, dan garis miring
   *                    — nomor rekam medis klinik tidak seragam bentuknya.
   */
  jenisKartu: [
    { v: 'KTP',  l: 'KTP / NIK',            format: 'angka', panjang: 16, ph: '16 digit NIK pada KTP' },
    { v: 'BPJS', l: 'Kartu BPJS Kesehatan', format: 'angka', panjang: 13, ph: '13 digit nomor kartu BPJS' },
    { v: 'KIA',  l: 'KIA (anak)',           format: 'angka', panjang: 16, ph: '16 digit NIK pada KIA anak' },
    { v: 'KK',   l: 'Kartu Keluarga',       format: 'angka', panjang: 16, ph: '16 digit nomor Kartu Keluarga' },
    { v: 'RM',   l: 'No. Rekam Medis (pasien lama)', format: 'bebas', min: 3,
      ph: 'Contoh: RM-00123 atau 00123',
      h: 'Ada di kartu berobat atau struk kunjungan sebelumnya. Mempercepat pencarian berkas Anda di loket.' },
    { v: 'Lainnya', l: 'Asuransi / lainnya', format: 'angka', min: 6, ph: 'Nomor kartu/polis asuransi' }
  ],

  /* ------------------------------------------- STATUS REAL-TIME
   * Sumber tunggal jam buka untuk kartu status di beranda dan papan
   * antrean. Dipakai dua kali: dirender saat build, lalu dihitung ulang
   * di browser tiap menit oleh assets/js/status.js — jadi halaman yang
   * sudah lama terbuka (atau diambil dari cache) tetap jujur.
   *
   *   hari : 0 = Minggu … 6 = Sabtu
   *   jam  : WIB, format 'HH:MM' (selalu dihitung di Asia/Jakarta,
   *          bukan jam perangkat pengunjung)
   *   poli : slug papan antrean — dipakai untuk saklar "dokter izin"
   *          di panel admin. Baris tanpa poli tidak bisa diizinkan.
   */
  statusBaris: [
    { key: 'poli-umum', nama: 'Poli Umum', icon: 'stethoscope', kelas: 'a', poli: 'poli-umum',
      sesi: [
        { kunci: 'pagi',  nama: 'Sesi pagi',  hari: [1, 2, 3, 4, 5, 6], mulai: '06:00', selesai: '11:30' },
        { kunci: 'malam', nama: 'Sesi malam', hari: [1, 2, 3, 4, 5, 6], mulai: '17:00', selesai: '20:30' }
      ] },
    { key: 'poli-gigi', nama: 'Poli Gigi', icon: 'tooth', kelas: 'b', poli: 'poli-gigi',
      sesi: [
        { kunci: 'pagi',  nama: 'Sesi pagi',  hari: [1, 2, 3, 4, 5, 6], mulai: '08:00', selesai: '10:00' },
        { kunci: 'malam', nama: 'Sesi malam', hari: [1, 3, 5],          mulai: '18:00', selesai: '20:00' }
      ] },
    /* Khitan tidak punya jam buka sendiri — selalu dengan perjanjian H-2. */
    { key: 'khitan', nama: 'Khitan', icon: 'shield-heart', kelas: 'c',
      perjanjian: true, ket: 'Dengan perjanjian H-2' },
    { key: 'apotek', nama: 'Apotek Mahira Farma', icon: 'pill', kelas: 'd',
      ket: '3 cabang · stok terhubung',
      sesi: [{ kunci: 'harian', nama: 'Setiap hari', hari: [0, 1, 2, 3, 4, 5, 6], mulai: '07:00', selesai: '21:00' }] }
  ],

  // dipakai schema.org openingHoursSpecification
  hoursSchema: [
    { days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '06:00', closes: '11:30' },
    { days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '17:00', closes: '20:30' }
  ],
  social: {
    instagram: 'https://www.instagram.com/kliniksehatsejahterablitar/',
    instagramHandle: '@kliniksehatsejahterablitar',
    facebook: 'https://web.facebook.com/klinikpratamasehatsejahtera',
    facebookHandle: 'Klinik Pratama Sehat Sejahtera',
    apotekInstagram: 'https://www.instagram.com/apotekmahirafarma/',
    apotekInstagramHandle: '@apotekmahirafarma',
    apotekWeb: 'https://www.mahirafarma.com/',
    linktree: 'https://linktr.ee/kliniksehatsejahtera'
  },
  // URL Web App Apps Script (deploy: Execute as Me, Access: Anyone)
  gasUrl: 'https://script.google.com/macros/s/AKfycbzR7uIAmvBnYyXsCzWKUNs-eXkyIOtIJzMqYHLaKQ0wWZ0-wpD8r3xksvx244s3qxYv/exec',
  /* Perkiraan biaya disembunyikan dari seluruh halaman publik atas
     permintaan pemilik. Ubah ke true bila kelak ingin ditampilkan lagi;
     data harganya sengaja tetap disimpan di tiap layanan. */
  tampilkanBiaya: false,
  gaId: '' // opsional: 'G-XXXXXXX'
};

/* ---------------------------------------------------------- NAV */
const NAV = [
  { label: 'Beranda',     href: '/' },
  { label: 'Profil',      href: '/profil.html', children: [
      { label: 'Profil Klinik',  href: '/profil.html' },
      { label: 'Lowongan Kerja', href: '/lowongan.html' }
  ]},
  { label: 'Layanan',     href: '/layanan.html', children: [
      { label: 'Poli Umum',           href: '/layanan/poli-umum.html' },
      { label: 'Poli Gigi',           href: '/layanan/poli-gigi.html' },
      { label: 'Pelayanan Khitan',    href: '/layanan/khitan.html' },
      { label: 'Pelayanan Farmasi',   href: '/layanan/farmasi.html' },
      { label: 'Top Dokter (Online)', href: '/layanan/top-dokter.html' }
  ]},
  { label: 'Antrean',     href: '/antrean.html' },
  { label: 'Dokter',      href: '/dokter.html' },
  { label: 'Apotek',      href: '/apotek.html', children: [
      { label: 'Cabang Apotek',          href: '/apotek.html' },
      { label: 'Produk Unggulan Apotek', href: '/produk-apotek.html' }
  ]},
  { label: 'Artikel',     href: '/artikel.html' },
  { label: 'Kontak',      href: '/kontak.html' }
];

/* ------------------------------------------------------ LAYANAN
 * Tiap layanan boleh punya `formulir`: pertanyaan tambahan yang muncul
 * di halaman pendaftaran begitu layanan itu dipilih. Sengaja DIKOSONGKAN
 * — pertanyaannya disusun sendiri oleh klinik lewat panel admin, karena
 * hanya klinik yang tahu apa yang perlu ditanyakan sebelum tindakan.
 *
 *   { label, tipe: 'teks'|'area'|'angka'|'tanggal'|'pilih'|'centang',
 *     opsi: ['a','b'] (khusus pilih), wajib: true|false, ket: 'petunjuk' }
 */
const SERVICES = [
  {
    slug: 'poli-umum',
    icon: 'stethoscope',
    name: 'Poli Umum',
    short: 'Pemeriksaan dokter umum, pengobatan, surat sehat, dan kontrol penyakit kronis.',
    hook: 'Keluhan kecil jangan dibiarkan jadi besar.',
    hero: 'Diperiksa dokter umum tanpa antre berjam-jam',
    intro: 'Poli Umum adalah pintu pertama layanan kami. Setiap pasien ditangani dokter umum berlisensi dengan waktu konsultasi yang cukup — bukan sekadar lima menit lalu diberi resep.',
    price: 'Mulai Rp 35.000 (umum) · Gratis untuk peserta BPJS terdaftar*',
    duration: '15 – 25 menit',
    items: [
      ['Pemeriksaan & konsultasi umum', 'Demam, batuk, ISPA, diare, nyeri, alergi, hipertensi, diabetes, kolesterol, asam urat.'],
      ['Tindakan medis ringan', 'Perawatan luka, jahit luka, buka jahitan, angkat kuku, insisi abses, pasang/lepas kateter.'],
      ['Surat keterangan', 'Surat keterangan sehat, surat sakit, surat keterangan buta warna dasar.'],
      ['Kontrol penyakit kronis', 'Program kontrol rutin hipertensi & diabetes dengan kartu pantau dan pengingat WhatsApp.'],
      ['Pemeriksaan penunjang dasar', 'Cek gula darah, asam urat, kolesterol, tekanan darah, dan saturasi oksigen.'],
      ['Imunisasi & vitamin', 'Imunisasi dasar sesuai jadwal serta suntik vitamin sesuai indikasi dokter.']
    ],
    prep: [
      'Bawa kartu identitas (KTP/KK) dan kartu BPJS bila ada.',
      'Untuk cek gula darah puasa, jangan makan 8–10 jam sebelumnya.',
      'Bawa obat rutin yang sedang dikonsumsi agar dokter tahu riwayatnya.'
    ],
    faq: [
      ['Apakah bisa langsung datang tanpa daftar?', 'Bisa. Namun pasien yang mendaftar online lebih dulu akan dilayani sesuai nomor antrean sehingga waktu tunggu jauh lebih singkat.'],
      ['Berapa lama saya harus menunggu?', 'Rata-rata 10–20 menit pada jam normal. Jam 06.00–07.30 dan 18.30–20.30 biasanya paling padat.'],
      ['Apakah melayani pasien anak?', 'Ya, untuk keluhan umum anak. Kasus yang memerlukan spesialis akan kami rujuk dengan surat rujukan resmi.']
    ]
  },
  {
    slug: 'poli-gigi',
    icon: 'tooth',
    name: 'Poli Gigi',
    short: 'Tambal, cabut, scaling, dan perawatan gigi anak dengan alat steril sekali pakai.',
    hook: 'Sakit gigi tidak menunggu besok. Kami juga tidak.',
    hero: 'Perawatan gigi tuntas, steril, dan tanpa drama',
    intro: 'Poli Gigi kami menangani keluhan harian hingga perawatan estetika dasar. Seluruh alat disterilkan dengan autoklaf dan bahan habis pakai selalu baru untuk setiap pasien.',
    price: 'Mulai Rp 50.000 · Paket scaling & tambal tersedia',
    duration: '20 – 45 menit',
    items: [
      ['Tambal gigi', 'Tambal sinar (light cure) komposit sewarna gigi, sekali kunjungan.'],
      ['Cabut gigi', 'Cabut gigi dewasa & anak dengan anestesi lokal. Gigi bungsu dievaluasi lebih dulu.'],
      ['Scaling / bersih karang gigi', 'Menghilangkan karang, noda kopi & rokok, serta mengatasi gusi mudah berdarah.'],
      ['Perawatan saluran akar', 'Untuk gigi berlubang dalam yang masih bisa dipertahankan.'],
      ['Gigi tiruan lepasan', 'Pembuatan gigi palsu akrilik sebagian maupun penuh.'],
      ['Poli gigi anak', 'Pendekatan ramah anak, fluoride, dan fissure sealant pencegah gigi berlubang.']
    ],
    prep: [
      'Jangan datang dalam kondisi perut kosong bila akan dilakukan pencabutan.',
      'Informasikan bila Anda punya riwayat hipertensi, diabetes, jantung, atau alergi obat.',
      'Ibu hamil tetap bisa dirawat — sampaikan usia kehamilan saat pendaftaran.'
    ],
    faq: [
      ['Apakah cabut gigi sakit?', 'Area gigi dibius lokal terlebih dahulu sehingga proses pencabutan terasa seperti tertekan, bukan nyeri. Rasa nyeri ringan setelah bius habis dikendalikan dengan obat.'],
      ['Gigi saya berlubang besar, masih bisa ditambal?', 'Perlu dinilai langsung. Bila jaringan sehat masih cukup, kami utamakan mempertahankan gigi lewat perawatan saluran akar lalu ditambal.'],
      ['Apakah scaling membuat gigi jadi renggang?', 'Tidak. Yang hilang adalah karang gigi yang selama ini menutup celah. Gusi akan kembali rapat setelah radang mereda.']
    ]
  },
  {
    slug: 'khitan',
    icon: 'shield-heart',
    name: 'Pelayanan Khitan',
    short: 'Khitan modern minim nyeri oleh tenaga medis, bisa dijadwalkan di hari libur sekolah.',
    hook: 'Sekali seumur hidup — pastikan ditangani yang tepat.',
    hero: 'Khitan modern, cepat pulih, ditemani sampai tenang',
    intro: 'Kami melayani khitan bayi hingga dewasa dengan metode yang dipilih sesuai kondisi. Ruangan khusus, alat sekali pakai, dan pendampingan orang tua di dalam ruangan agar anak tetap tenang.',
    price: 'Paket mulai Rp 350.000 (sudah termasuk obat & kontrol)',
    duration: '20 – 40 menit',
    items: [
      ['Khitan klem sekali pakai', 'Minim perdarahan, tanpa jahitan, anak bisa langsung beraktivitas ringan.'],
      ['Khitan elektrokauter', 'Metode konvensional dengan pemotongan presisi dan perdarahan terkontrol.'],
      ['Khitan bayi & balita', 'Penanganan khusus usia dini dengan waktu tindakan yang sangat singkat.'],
      ['Khitan dewasa', 'Termasuk kasus fimosis dan permintaan khitan atas indikasi medis.'],
      ['Paket rombongan & sekolah', 'Jadwal khusus untuk kelompok, TPQ, atau acara khitan massal.'],
      ['Kontrol pascakhitan', 'Dua kali kontrol gratis plus kanal tanya-jawab WhatsApp selama masa pemulihan.']
    ],
    prep: [
      'Anak sebaiknya makan terlebih dahulu dan dalam kondisi sehat (tidak demam).',
      'Bawa celana khitan atau sarung longgar untuk dipakai setelah tindakan.',
      'Jadwalkan H-2 lewat WhatsApp agar kami siapkan ruangan dan tim.'
    ],
    faq: [
      ['Kapan waktu terbaik khitan?', 'Banyak keluarga memilih libur sekolah atau akhir pekan agar anak punya waktu istirahat. Secara medis, khitan bisa dilakukan sejak bayi.'],
      ['Berapa lama pemulihannya?', 'Umumnya 5–7 hari untuk luka kering dengan metode klem, dan 7–10 hari untuk metode kauter.'],
      ['Apakah boleh mandi setelah khitan?', 'Boleh, dengan cara yang kami ajarkan saat kontrol. Justru area yang bersih membuat luka lebih cepat kering.']
    ]
  },
  {
    slug: 'umrah-haji',
    icon: 'route',
    name: 'Vaksinasi Umrah & Haji',
    short: 'Pendaftaran vaksin meningitis, MCU jemaah, dan surat layak terbang — kerja sama resmi RSU Aminah.',
    hook: 'Urus kesehatannya sekali, ibadahnya tenang sampai pulang.',
    hero: 'Pendaftaran vaksinasi umrah & haji dalam satu pintu',
    intro: 'Klinik kami membuka pendaftaran vaksinasi khusus jemaah umrah dan haji sebagai hasil kerja sama resmi dengan RSU Aminah. Pemeriksaan awal dan pendampingan berkas dikerjakan di klinik, sedangkan penyuntikan vaksin meningitis dan penerbitan ICV dijalankan di RSU Aminah. Jemaah cukup mendaftar satu kali di sini — jadwalnya kami yang mengatur. Di luar keperluan umrah dan haji, klinik tidak membuka pelayanan vaksinasi umum.',
    price: 'Paket jemaah — jemaah terdaftar mendapat potongan harga dari RSU Aminah*',
    duration: '1 – 2 jam untuk rangkaian MCU',
    items: [
      ['Medical check-up jemaah', 'Pemeriksaan fisik, tekanan darah, gula darah, dan skrining penyakit penyerta.'],
      ['Vaksin meningitis', 'Wajib bagi jemaah umrah & haji, dilaksanakan bersama RSU Aminah beserta penerbitan ICV.'],
      ['Surat keterangan layak terbang', 'Diterbitkan dokter setelah hasil pemeriksaan dinyatakan memenuhi syarat.'],
      ['Pendampingan berkas', 'Petugas kami membantu memastikan dokumen kesehatan Anda lengkap sebelum keberangkatan.'],
      ['Konsultasi jemaah risiko tinggi', 'Jemaah lansia atau berpenyakit kronis mendapat rencana obat dan catatan medis perjalanan.'],
      ['Paket rombongan travel', 'Biro perjalanan dapat mendaftarkan jemaah sekaligus dengan jadwal khusus.']
    ],
    prep: [
      'Bawa paspor — nomornya dicatat pada sertifikat vaksin internasional (ICV).',
      'Puasa 8–10 jam bila mengambil paket dengan cek gula darah puasa.',
      'Bawa daftar obat rutin yang sedang dikonsumsi.',
      'Daftarkan diri minimal 3–4 minggu sebelum keberangkatan agar antibodi terbentuk.'
    ],
    faq: [
      ['Apa saja syarat kesehatan jemaah umrah?', 'Umumnya vaksin meningitis yang dibuktikan dengan ICV, serta surat keterangan sehat/layak terbang. Persyaratan dapat berubah mengikuti ketentuan otoritas, jadi kami selalu mengonfirmasi yang terbaru saat Anda mendaftar.'],
      ['Bagaimana bentuk kerja sama dengan RSU Aminah?', 'Klinik kami menangani pemeriksaan awal dan pendampingan berkas, sedangkan tindakan yang memerlukan fasilitas rumah sakit dirujuk ke RSU Aminah. Jemaah yang terdaftar lewat klinik kami mendapat potongan harga sesuai kesepakatan kerja sama.'],
      ['Bisakah travel mendaftarkan satu rombongan?', 'Bisa. Hubungi admin untuk mengatur jadwal rombongan agar jemaah tidak menunggu lama secara bergantian.']
    ]
  },
  {
    slug: 'bekam',
    icon: 'heart',
    name: 'Terapi Bekam',
    short: 'Bekam basah & kering oleh terapis terlatih, alat sekali pakai dan steril.',
    hook: 'Pegal yang menahun tidak selalu butuh obat baru.',
    hero: 'Terapi bekam dengan standar kebersihan klinik',
    intro: 'Bekam banyak dicari untuk keluhan pegal, kaku leher dan punggung, pusing berulang, serta rasa berat badan setelah bekerja lama. Kami menjalankannya dengan standar klinik: terapis terlatih, kop sekali pakai, dan penilaian dokter lebih dulu bila Anda punya penyakit penyerta.',
    price: 'Mulai Rp 60.000 per sesi (menyesuaikan jumlah titik)',
    duration: '30 – 45 menit',
    items: [
      ['Bekam basah (hijamah)', 'Titik bekam disesuaikan keluhan, memakai kop dan pisau sekali pakai.'],
      ['Bekam kering & luncur', 'Untuk Anda yang belum siap dengan bekam basah atau berkulit sensitif.'],
      ['Bekam punggung & bahu', 'Paling sering diambil pekerja kantor, pengemudi, dan penjahit.'],
      ['Penilaian sebelum terapi', 'Tekanan darah diperiksa dahulu; pasien berpenyakit kronis dikonsultasikan ke dokter.'],
      ['Ruangan tertutup', 'Privasi terjaga, tersedia terapis perempuan untuk pasien perempuan.'],
      ['Saran perawatan setelah bekam', 'Petunjuk mandi, makan, dan istirahat agar hasilnya maksimal.']
    ],
    prep: [
      'Jangan bekam dalam keadaan perut kosong — makan ringan 2 jam sebelumnya.',
      'Hindari bekam tepat setelah olahraga berat atau begadang.',
      'Pakai baju longgar yang mudah dibuka di bagian punggung.',
      'Beri tahu petugas bila Anda memakai obat pengencer darah, sedang hamil, atau punya gangguan pembekuan darah.'
    ],
    faq: [
      ['Apakah bekam sakit?', 'Sebagian besar pasien menggambarkannya seperti cubitan singkat. Rasa pegal justru biasanya berkurang setelah kop dilepas.'],
      ['Berapa lama bekas bekamnya hilang?', 'Umumnya memudar dalam 3–7 hari, tergantung kondisi kulit dan sirkulasi darah Anda.'],
      ['Siapa yang sebaiknya tidak dibekam?', 'Penderita gangguan pembekuan darah, pengguna obat pengencer darah, ibu hamil, dan pasien anemia berat. Petugas kami akan menilai lebih dulu sebelum terapi dimulai.']
    ]
  },
  {
    slug: 'farmasi',
    icon: 'pill',
    name: 'Pelayanan Farmasi',
    tanpaDaftar: true,          // layanan informasi — tidak memakai formulir pendaftaran
    short: 'Depo Farmasi di dalam klinik — resep langsung ditebus setelah periksa.',
    hook: 'Selesai periksa, obat langsung di tangan. Tidak perlu pindah tempat.',
    hero: 'Depo Farmasi di dalam klinik, obat dijelaskan sampai paham',
    intro: 'Klinik kami memiliki Depo Farmasi sendiri, jadi resep dokter bisa langsung ditebus di tempat begitu pemeriksaan selesai. Bila obat yang Anda butuhkan sedang tidak tersedia di depo, petugas kami mengarahkan Anda ke cabang Apotek Mahira Farma terdekat yang stoknya ada — tidak dibiarkan mencari sendiri.',
    price: 'Harga apotek — konseling apoteker gratis',
    duration: '5 – 10 menit',
    items: [
      ['Penebusan resep di tempat', 'Resep dari dokter klinik langsung disiapkan di Depo Farmasi tanpa Anda berpindah gedung.'],
      ['Konseling apoteker', 'Cara pakai, waktu minum, efek samping, dan pantangan dijelaskan sebelum obat diserahkan.'],
      ['Pengarahan bila stok kosong', 'Obat yang tidak tersedia di depo diarahkan ke cabang Apotek Mahira Farma yang stoknya ada.'],
      ['Obat bebas & alat kesehatan', 'Obat warung, vitamin, perban, masker, dan alat kesehatan dasar.'],
      ['Madu & produk herbal', 'Madu murni dan herbal pilihan yang bisa dibeli langsung tanpa resep.'],
      ['Pemeriksaan kepatuhan obat', 'Apoteker mengecek interaksi dan dosis, terutama untuk pasien dengan obat rutin.']
    ],
    prep: [
      'Layanan ini tidak memerlukan pendaftaran — cukup datang ke Depo Farmasi.',
      'Bawa resep dokter bila menebus obat keras.',
      'Sebutkan obat rutin yang sedang Anda konsumsi agar apoteker bisa mengecek interaksinya.',
      'Depo tutup untuk umum pukul 11.30–13.00 karena pelayanan administrasi apotek.'
    ],
    faq: [
      ['Apakah harus mendaftar dulu untuk menebus obat?', 'Tidak perlu. Pelayanan farmasi bisa langsung diakses tanpa pendaftaran — cukup datang ke Depo Farmasi Klinik pada jam pelayanan.'],
      ['Bagaimana bila obat saya tidak ada di klinik?', 'Petugas kami akan mengarahkan Anda ke cabang Apotek Mahira Farma yang stoknya tersedia, lengkap dengan alamatnya, sehingga Anda tidak perlu mencari sendiri.'],
      ['Apakah bisa menebus resep dari dokter luar?', 'Bisa, selama resep masih berlaku dan obatnya tersedia. Apoteker kami tetap memberikan konseling penggunaan.']
    ]
  },
  {
    slug: 'top-dokter',
    icon: 'video',
    name: 'Top Dokter',
    short: 'Konsultasi dokter online lewat WhatsApp dan tebus obat tanpa keluar rumah.',
    hook: 'Dokter Anda kini sejauh satu pesan WhatsApp.',
    hero: 'Konsultasi dokter dari rumah, obat diantar ke pintu',
    intro: 'Top Dokter adalah layanan telekonsultasi Klinik Pratama Sehat Sejahtera. Cocok untuk keluhan ringan, kontrol rutin, konsultasi hasil lab, atau saat Anda tidak memungkinkan datang ke klinik.',
    price: 'Diinformasikan admin saat konsultasi',
    tanpaBiaya: true,   // permintaan klinik: jangan tampilkan perkiraan biaya
    duration: '10 – 20 menit',
    items: [
      ['Telekonsultasi via WhatsApp', 'Chat, voice note, atau video call bersama dokter sesuai jadwal praktik.'],
      ['Konsultasi hasil lab', 'Kirim hasil pemeriksaan, dokter bantu bacakan dan jelaskan langkah lanjutannya.'],
      ['Resep elektronik', 'Resep dikirim langsung ke apotek Mahira Farma pilihan Anda.'],
      ['Tebus obat online', 'Pilih ambil sendiri di apotek atau minta diantar ke rumah.'],
      ['Kontrol pascatindakan', 'Follow-up luka khitan, jahitan, atau kontrol gigi tanpa harus bolak-balik.'],
      ['Rujukan bila perlu', 'Bila keluhan butuh pemeriksaan langsung, dokter akan mengarahkan Anda datang.']
    ],
    prep: [
      'Siapkan foto keluhan (bila terlihat dari luar) dan daftar obat yang sedang diminum.',
      'Pastikan sinyal stabil dan berada di ruangan yang tenang.',
      'Layanan ini tidak untuk kegawatdaruratan — untuk kondisi darurat, segera ke IGD terdekat.'
    ],
    faq: [
      ['Apakah aman berkonsultasi lewat chat?', 'Aman untuk keluhan ringan dan kontrol. Data Anda hanya dipegang tim medis dan tidak dibagikan ke pihak lain.'],
      ['Bagaimana cara bayarnya?', 'Transfer atau QRIS. Bukti bayar cukup dikirim ke chat yang sama sebelum sesi dimulai.'],
      ['Apakah resep online sah?', 'Ya, resep diterbitkan dokter berizin dan hanya dapat ditebus di apotek rekanan kami.']
    ]
  }
];

/* -------------------------------------------------------- APOTEK */
const PHARMACIES = [
  {
    name: 'Apotek Mahira Farma 2',
    area: 'Ngentak',
    slug: 'mahira-farma-2-ngentak',
    address: 'Ngentak, Kota Blitar, Jawa Timur',
    hours: '07.00 – 21.00 (Senin – Minggu)',
    phone: '6289653502700',
    badge: 'Cabang utama · dekat klinik',
    maps: 'https://goo.gl/maps/QYMHZ57NYapUDK6o8',
    note: 'Cabang dengan stok paling lengkap dan apoteker jaga penuh waktu.'
  },
  {
    name: 'Apotek Mahira Farma 1',
    area: 'Ngrobyong',
    slug: 'mahira-farma-1-ngrobyong',
    address: 'Ngrobyong, Kota Blitar, Jawa Timur',
    hours: '07.00 – 21.00 (Senin – Minggu)',
    phone: '6289653502700',
    badge: 'Cabang pertama',
    maps: 'https://goo.gl/maps/t59EMp46fqRNaD1e7',
    note: 'Melayani penebusan resep dan alat kesehatan harian.'
  },
  {
    name: 'Apotek Mahira Farma 4',
    area: 'Penataran',
    slug: 'mahira-farma-4-penataran',
    address: 'Penataran, Nglegok, Kabupaten Blitar, Jawa Timur',
    hours: '07.00 – 21.00 (Senin – Minggu)',
    phone: '6289653502700',
    badge: 'Melayani wilayah Nglegok',
    maps: 'https://goo.gl/maps/QkuJieLTBDFziNnp9',
    note: 'Titik layanan terdekat untuk warga Nglegok dan sekitar Candi Penataran.'
  }
];

/* -------------------------------------------------------- DOKTER */
/* ⚠️ GANTI dengan nama, foto, dan nomor SIP dokter yang sebenarnya. */
const DOCTORS = [
  {
    name: 'dr. Hafidhullah Hanif', initials: 'HH', color: 'a',
    role: 'Dokter Umum · Penanggung Jawab Klinik', poli: 'Poli Umum', janji: true,
    schedule: 'Senin – Kamis · 08.00–11.30',
    jadwal: [{ hari: 'Senin – Kamis', jam: '08.00 – 11.30', sesi: 'pagi' }]
  },
  {
    name: 'dr. Wasingah', initials: 'W', color: 'b',
    role: 'Dokter Umum', poli: 'Poli Umum', janji: true,
    schedule: 'Senin – Jumat · 06.00–08.00 & 17.00–20.30 · Sabtu malam',
    jadwal: [
      { hari: 'Senin – Jumat', jam: '06.00 – 08.00', sesi: 'pagi' },
      { hari: 'Senin – Jumat', jam: '17.00 – 20.30', sesi: 'malam' },
      { hari: 'Sabtu',         jam: '17.00 – 20.30', sesi: 'malam' }
    ]
  },
  {
    name: 'dr. Monalisa', initials: 'M', color: 'c',
    role: 'Dokter Umum', poli: 'Poli Umum', janji: true,
    schedule: 'Jumat & Sabtu · 08.00–11.30',
    jadwal: [{ hari: 'Jumat & Sabtu', jam: '08.00 – 11.30', sesi: 'pagi' }]
  },
  {
    name: 'drg. Maylia Widiastuti', initials: 'MW', color: 'd',
    role: 'Dokter Gigi', poli: 'Poli Gigi', janji: true,
    schedule: 'Senin – Sabtu · 08.00–10.00',
    jadwal: [{ hari: 'Senin – Sabtu', jam: '08.00 – 10.00', sesi: 'pagi' }]
  },
  {
    name: 'drg. Lailiz Zulfa', initials: 'LZ', color: 'a',
    role: 'Dokter Gigi', poli: 'Poli Gigi', janji: true,
    schedule: 'Senin, Rabu, Jumat · 18.00–20.00',
    jadwal: [{ hari: 'Senin, Rabu, Jumat', jam: '18.00 – 20.00', sesi: 'malam' }]
  }
];

/* Apoteker penanggung jawab.
 * CATATAN UI: bagian ini HANYA menampilkan nama — tidak ada tombol janji temu.
 * Nama akan disusulkan sesuai data klinik; ganti isi array di bawah. */
const APOTEKER = [
  { name: '(Nama apoteker menyusul)', initials: 'AP', color: 'b',
    role: 'Apoteker Penanggung Jawab', ket: 'Melayani konseling obat di Depo Farmasi Klinik.' }
];



/* ------------------------------------- PRODUK UNGGULAN KLINIK */
/* Madu & herbal yang dijual di Depo Farmasi Klinik.
   Tambah/ubah daftarnya di sini — otomatis tampil di halaman Farmasi. */
const PRODUK = {
  judul: 'Madu & Produk Herbal',
  ringkas: 'Selain obat resep, Depo Farmasi Klinik menyediakan madu murni dan produk herbal pilihan yang bisa dibeli langsung tanpa resep.',
  daftar: [
    { nama: 'Madu murni', ket: 'Madu asli dalam beberapa ukuran kemasan, cocok untuk keluarga maupun oleh-oleh.' },
    { nama: 'Madu anak', ket: 'Formulasi madu dengan tambahan nutrisi untuk menunjang nafsu makan dan daya tahan anak.' },
    { nama: 'Herbal tradisional', ket: 'Habbatussauda, sari kurma, minyak zaitun, dan herbal lain yang lazim dipakai sehari-hari.' },
    { nama: 'Minyak & balsam bekam', ket: 'Perlengkapan pendukung terapi bekam yang juga dipakai di klinik kami.' }
  ],
  catatan: 'Produk herbal bersifat pelengkap, bukan pengganti obat yang diresepkan dokter. Tanyakan pada apoteker kami bila Anda sedang mengonsumsi obat rutin.'
};


/* --------------------------------------------- TESTIMONI KHITAN
 * Tayang berjalan otomatis di halaman layanan khitan.
 * Sengaja KOSONG — diisi klinik lewat panel admin.
 *
 * ATURAN YANG DITEGAKKAN KODE (jangan dilonggarkan tanpa bertanya):
 *   • Hanya item dengan `izin: true` yang dirender. Centang itu berarti
 *     orang tua sudah memberi izin foto & kesannya ditayangkan.
 *   • `nama` boleh inisial atau nama depan saja — jangan nama lengkap
 *     anak. Halaman ini publik dan terindeks mesin pencari.
 *   • `gambar` berupa TAUTAN (Drive/Instagram/mana pun). Pakai foto
 *     suasana — anak berpakaian lengkap, keluarga, atau ruangan.
 */
const TESTIMONI_KHITAN = [];

/* ------------------------------------------------------ LOWONGAN
 * Sengaja KOSONG. Lowongan diisi lewat panel admin (koleksi "lowongan")
 * agar yang tayang hanya lowongan yang benar-benar dibuka klinik —
 * jangan diisi contoh, halaman ini dibaca pelamar sungguhan.
 */
const LOWONGAN = [];

/* ------------------------------- TEKS HALAMAN (bisa diedit admin) */
const TEKS = {
  heroJudul: 'Sehat itu dekat.<br>Sedekat <span class="hl">genggaman</span>.',
  heroSambutan: 'Selamat datang di Klinik Pratama Sehat Sejahtera. Kami hadir untuk memenuhi kebutuhan kesehatan Anda melalui layanan terpadu yang mencakup <strong>Poli Umum</strong>, <strong>Poli Gigi</strong>, layanan <strong>Khitan</strong>, hingga <strong>Depo Farmasi</strong>. Untuk memastikan kenyamanan dan kelengkapan medis Anda, klinik kami juga didukung dan berada dalam satu ekosistem dengan tiga cabang <strong>Apotek Mahira Farma</strong>.',
  profilJudul: 'Klinik dengan pelayanan ramah, cepat, dan mujarab',
  profilRingkas: 'Tiga kata itu kami pakai sebagai ukuran kerja sehari-hari. <strong>Ramah</strong> berarti Anda disapa dan didengar, bukan sekadar dipanggil nomornya. <strong>Cepat</strong> berarti antrean yang jelas dan jam buka sejak pukul 06.00, sebelum Anda berangkat kerja. <strong>Mujarab</strong> berarti keluhan ditelusuri sampai akarnya, obat dijelaskan sampai paham, dan kami menyarankan rujukan bila memang itu yang Anda butuhkan.'
};

/* --------------------------------------------------- KEUNGGULAN */
const ADVANTAGES = [
  { icon: 'clock',    title: 'Buka Pagi & Malam',      text: 'Praktik mulai pukul 06.00 sebelum Anda berangkat kerja, dan kembali buka 17.00–20.30.' },
  { icon: 'pill',     title: 'Apotek Satu Atap',       text: 'Tiga cabang Mahira Farma terhubung langsung — resep selesai, obat langsung siap.' },
  { icon: 'video',    title: 'Top Dokter Online',      text: 'Konsultasi dan tebus obat dari rumah lewat WhatsApp, tanpa antre.' },
  { icon: 'shield',   title: 'Steril & Sekali Pakai',  text: 'Alat disterilkan autoklaf, bahan habis pakai selalu baru untuk tiap pasien.' },
  { icon: 'users',    title: 'Ramah Keluarga',         text: 'Ruang tunggu nyaman, pendampingan anak, dan komunikasi yang mudah dipahami.' },
  { icon: 'phone',    title: 'Daftar 30 Detik',        text: 'Isi formulir, nomor antrean langsung masuk WhatsApp admin. Datang tinggal masuk.' }
];

/* --------------------------------------------------- STATISTIK */
const STATS = [
  { value: '06.00', label: 'Buka paling pagi di area Sananwetan' },
  { value: '3',     label: 'Cabang apotek terintegrasi' },
  { value: '5',     label: 'Layanan unggulan dalam satu atap' },
  { value: '<2 mnt',label: 'Waktu daftar online sampai dapat antrean' }
];

/* ---------------------------------------------------- ARTIKEL */
const ARTICLES = [
  {
    slug: 'kapan-anak-sebaiknya-dikhitan',
    title: 'Kapan Waktu Terbaik Anak Dikhitan? Ini Pertimbangan Medisnya',
    excerpt: 'Bayi, usia sekolah, atau menjelang remaja? Simak pertimbangan medis dan praktis sebelum menentukan jadwal khitan anak Anda.',
    date: '2026-08-28',
    category: 'Khitan',
    read: '6 menit',
    body: [
      ['p', 'Pertanyaan ini hampir selalu muncul di ruang konsultasi kami: usia berapa sebaiknya anak dikhitan? Jawaban medisnya sederhana — tidak ada batas usia baku. Yang ada adalah pertimbangan kenyamanan, pemulihan, dan kesiapan mental anak.'],
      ['h2', 'Khitan pada masa bayi (0–3 bulan)'],
      ['p', 'Pada usia ini jaringan masih sangat tipis, perdarahan minimal, dan bayi belum punya memori tentang prosedurnya. Pemulihan biasanya paling cepat. Kelemahannya, perawatan luka bercampur dengan popok sehingga kebersihan harus dijaga ekstra.'],
      ['h2', 'Khitan usia sekolah (5–10 tahun)'],
      ['p', 'Ini rentang paling umum di Indonesia karena bisa dijadwalkan saat libur sekolah. Anak sudah bisa diajak berkomunikasi, mengikuti instruksi perawatan, dan memahami apa yang terjadi. Dengan metode klem, anak umumnya sudah bisa berjalan normal di hari yang sama.'],
      ['h2', 'Khitan remaja & dewasa'],
      ['p', 'Sering dilakukan atas indikasi medis seperti fimosis (kulup tidak bisa ditarik), infeksi berulang, atau keputusan pribadi. Pemulihan sedikit lebih lama karena pembuluh darah lebih besar, namun tetap aman bila dikerjakan tenaga medis.'],
      ['h2', 'Tanda anak siap dikhitan'],
      ['ul', [
        'Kondisi tubuh sehat — tidak demam, batuk berat, atau sedang sakit.',
        'Tidak sedang dalam pengobatan pengencer darah.',
        'Anak sudah diberi penjelasan dan tidak dalam kondisi ketakutan berlebihan.',
        'Ada waktu istirahat minimal 3 hari setelah tindakan.'
      ]],
      ['h2', 'Yang kami lakukan berbeda'],
      ['p', 'Di Klinik Pratama Sehat Sejahtera, orang tua boleh mendampingi di dalam ruangan. Kami menjelaskan setiap langkah kepada anak dengan bahasa yang ia pahami, dan memberi dua kali kontrol gratis plus kanal WhatsApp untuk bertanya kapan saja selama masa pemulihan.'],
      ['cta', 'Konsultasikan jadwal khitan anak Anda']
    ]
  },
  {
    slug: 'gusi-berdarah-saat-sikat-gigi',
    title: 'Gusi Berdarah Saat Sikat Gigi: Kapan Harus ke Dokter Gigi?',
    excerpt: 'Banyak orang menganggap gusi berdarah itu biasa. Padahal itu sinyal awal radang gusi yang bisa berakhir pada gigi goyang.',
    date: '2026-08-14',
    category: 'Gigi',
    read: '5 menit',
    body: [
      ['p', 'Gusi yang sehat tidak berdarah, sekalipun disikat dengan benar. Ketika darah muncul di busa pasta gigi, tubuh sedang memberi tahu bahwa ada peradangan — biasanya akibat karang gigi yang menumpuk di batas gusi.'],
      ['h2', 'Kenapa karang gigi berbahaya?'],
      ['p', 'Karang gigi adalah plak yang mengeras dan tidak bisa hilang dengan sikat gigi. Permukaannya kasar sehingga bakteri makin mudah menempel. Lama-kelamaan gusi turun, tulang penyangga gigi menyusut, dan gigi yang tadinya sehat mulai goyang.'],
      ['h2', 'Segera periksa bila muncul tanda ini'],
      ['ul', [
        'Gusi berdarah lebih dari dua minggu meski sikat gigi sudah lembut.',
        'Bau mulut yang tidak hilang setelah sikat gigi dan berkumur.',
        'Gusi terlihat bengkak, merah tua, atau terasa nyeri saat mengunyah.',
        'Gigi terasa lebih panjang karena gusi menurun.',
        'Ada gigi yang mulai goyang tanpa pernah terbentur.'
      ]],
      ['h2', 'Yang bisa Anda lakukan mulai hari ini'],
      ['p', 'Sikat gigi dua kali sehari dengan bulu lembut dan gerakan memutar kecil di batas gusi, bukan menggosok keras ke samping. Tambahkan benang gigi sekali sehari. Namun bila karang sudah terbentuk, hanya scaling di klinik yang bisa membersihkannya.'],
      ['h2', 'Scaling itu seperti apa?'],
      ['p', 'Prosesnya memakai alat ultrasonik yang menggetarkan karang sampai lepas — tidak memotong gigi sama sekali. Rata-rata selesai dalam 20–30 menit. Setelahnya gigi terasa lebih licin dan gusi berangsur berhenti berdarah dalam hitungan hari.'],
      ['cta', 'Jadwalkan scaling di Poli Gigi kami']
    ]
  },
  {
    slug: 'kontrol-hipertensi-tanpa-putus-obat',
    title: 'Hipertensi: Kenapa Obatnya Tidak Boleh Berhenti Saat Merasa Sehat',
    excerpt: 'Tekanan darah turun bukan berarti sembuh. Ini alasan medis kenapa obat hipertensi harus diminum terus dan bagaimana kami membantu Anda konsisten.',
    date: '2026-07-30',
    category: 'Penyakit Kronis',
    read: '6 menit',
    body: [
      ['p', 'Kalimat yang paling sering kami dengar: "Dok, saya berhenti minum obat karena sudah tidak pusing." Sayangnya, hipertensi hampir selalu tanpa gejala. Tekanan darah 160/100 bisa terasa sama nyamannya dengan 120/80.'],
      ['h2', 'Obat menurunkan, bukan menyembuhkan'],
      ['p', 'Obat antihipertensi bekerja selama ia ada di dalam tubuh. Begitu dihentikan, tekanan darah kembali naik dalam hitungan hari — kadang dengan lonjakan yang justru lebih berbahaya bagi pembuluh darah otak dan jantung.'],
      ['h2', 'Apa yang terjadi bila dibiarkan'],
      ['ul', [
        'Pembuluh darah otak menipis dan berisiko pecah — inilah jalur menuju stroke.',
        'Jantung bekerja lebih berat sehingga otot jantung menebal dan melemah.',
        'Ginjal kehilangan kemampuan menyaring, berujung pada gagal ginjal kronis.',
        'Pembuluh darah mata rusak dan menurunkan penglihatan.'
      ]],
      ['h2', 'Tiga kebiasaan yang nyata menurunkan tekanan darah'],
      ['p', 'Kurangi garam hingga di bawah satu sendok teh sehari termasuk dari kecap, mi instan, dan ikan asin. Jalan kaki 30 menit lima kali seminggu. Dan tidur cukup — kurang tidur menaikkan tekanan darah pagi hari secara konsisten.'],
      ['h2', 'Program kontrol rutin kami'],
      ['p', 'Pasien hipertensi yang terdaftar mendapat kartu pantau tekanan darah, pengingat jadwal kontrol lewat WhatsApp, dan kemudahan menebus obat rutin di tiga cabang Mahira Farma. Untuk kontrol yang tidak memerlukan pemeriksaan fisik, Anda bisa memakai layanan Top Dokter.'],
      ['cta', 'Daftar program kontrol hipertensi']
    ]
  }
];

/* -------------------------------------------------- FASILITAS */
/* ⚠️ Gambar di bawah adalah ILUSTRASI VEKTOR BUATAN, bukan foto asli.
 *    Ganti dengan foto asli klinik (JPG/WebP, rasio 4:3, ±1200px) di
 *    public/assets/img/fasilitas/ lalu ubah nama file di sini. */
const FACILITIES = [
  { img: '/assets/img/fasilitas/pendaftaran.svg',  title: 'Meja Pendaftaran',  text: 'Antrean digital, petugas siap membantu sejak pukul 06.00.' },
  { img: '/assets/img/fasilitas/ruang-tunggu.svg', title: 'Ruang Tunggu',      text: 'Terang, berpendingin, dan cukup lapang untuk pengantar keluarga.' },
  { img: '/assets/img/fasilitas/ruang-periksa.svg',title: 'Ruang Periksa',     text: 'Privasi terjaga, dilengkapi alat pemeriksaan dasar yang lengkap.' },
  { img: '/assets/img/fasilitas/poli-gigi.svg',    title: 'Ruang Poli Gigi',   text: 'Dental unit modern dengan sterilisasi autoklaf setiap tindakan.' },
  { img: '/assets/img/fasilitas/ruang-khitan.svg', title: 'Ruang Khitan',      text: 'Ruangan khusus, ramah anak, orang tua boleh mendampingi.' },
  { img: '/assets/img/fasilitas/apotek.svg',       title: 'Depo Farmasi Klinik',text: 'Penebusan resep langsung setelah periksa, dengan apoteker yang menjelaskan sampai paham.' }
];

/* Gambar sampul tiap layanan & artikel */
const SERVICE_IMG = {
  'bekam':      '/assets/img/fasilitas/ruang-periksa.svg',
  'umrah-haji': '/assets/img/fasilitas/pendaftaran.svg',
  'poli-umum':  '/assets/img/fasilitas/ruang-periksa.svg',
  'poli-gigi':  '/assets/img/fasilitas/poli-gigi.svg',
  'khitan':     '/assets/img/fasilitas/ruang-khitan.svg',
  'farmasi':    '/assets/img/fasilitas/apotek.svg',
  'top-dokter': '/assets/img/fasilitas/pendaftaran.svg'
};
const ARTICLE_IMG = {
  'Khitan': '/assets/img/fasilitas/ruang-khitan.svg',
  'Gigi': '/assets/img/fasilitas/poli-gigi.svg',
  'Penyakit Kronis': '/assets/img/fasilitas/ruang-periksa.svg'
};

/* ---------------------------------------------------- MITRA */
const PARTNERS = [
  { name: 'BPJS Kesehatan',   note: 'Proses kerja sama',      ic: 'shield' },
  { name: 'SATUSEHAT',        note: 'Rencana integrasi',      ic: 'shield' },
  { name: 'Kemenkes RI',      note: 'Terdaftar',              ic: 'shield' },
  { name: 'Mahira Farma',     note: 'Apotek rekanan',         ic: 'pill' },
  { name: 'Apotek Blitar',    note: 'Apotek rekanan',         ic: 'pill' },
  { name: 'Lab Sumber Waras', note: 'Laboratorium rekanan',   ic: 'file' },
  { name: 'RSU Aminah',       note: 'Rumah sakit mitra',       ic: 'building' }
];


/* ------------------------------------------- MITRA RSU AMINAH */
/* ⚠️ ANGKA DI BAWAH MASIH CONTOH. Ganti dengan kesepakatan resmi
 *    sebelum situs dipakai untuk promosi. Cukup ubah di berkas ini. */
const AMINAH = {
  nama: 'RSU Aminah',
  status: 'Rumah sakit mitra kerja sama',
  ringkas: 'Tindakan yang memerlukan fasilitas rumah sakit — vaksin meningitis, MCU jemaah, dan rujukan lanjutan — dijalankan bersama RSU Aminah. Anda cukup mendaftar sekali lewat klinik kami.',
  catatanPlaceholder: true,
  manfaat: [
    { title: 'Potongan harga jemaah', text: 'Jemaah umrah & haji yang mendaftar lewat klinik kami mendapat potongan harga paket MCU. (contoh: 15% — ganti sesuai kesepakatan)' },
    { title: 'Cashback paket rombongan', text: 'Rombongan travel mendapat cashback per jemaah yang dikembalikan ke biro perjalanan. (contoh: Rp 50.000/jemaah — ganti sesuai kesepakatan)' },
    { title: 'Rujukan tanpa antre ulang', text: 'Berkas dan hasil pemeriksaan dari klinik langsung terbaca, jemaah tidak perlu mengulang pendaftaran dari awal.' },
    { title: 'Satu pintu pendaftaran', text: 'Cukup daftar di klinik kami — jadwal di RSU Aminah diatur oleh petugas kami.' }
  ],
  syarat: [
    'Potongan harga berlaku untuk jemaah yang terdaftar melalui Klinik Pratama Sehat Sejahtera.',
    'Besaran potongan dan cashback mengikuti kesepakatan kerja sama yang berlaku dan dapat berubah sewaktu-waktu.',
    'Tindakan medis tetap mengikuti hasil pemeriksaan dokter.'
  ]
};

/* ------------------------------------------------ ANTREAN POLI */
/* Harus sama persis dengan ANTREAN_POLI di backend/Code.gs */
const ANTREAN = {
  poli: [
    { slug: 'poli-umum', nama: 'Poli Umum', kode: 'U' },
    { slug: 'poli-gigi', nama: 'Poli Gigi', kode: 'G' }
  ],
  // Detik antara penyegaran otomatis papan antrean publik
  pollDetik: 15,
  // Banner promosi yang berputar di halaman antrean (ganti sesuai kebutuhan)
  banner: [
    { judul: 'Apotek Mahira Farma', teks: 'Tebus resep langsung setelah periksa — tiga cabang, stok terhubung.', cta: 'Lihat Apotek', href: '/apotek.html' },
    { judul: 'Top Dokter', teks: 'Tidak sempat datang? Konsultasi dokter lewat WhatsApp dan obat diantar.', cta: 'Coba Top Dokter', href: '/layanan/top-dokter.html' },
    { judul: 'Vaksin Umrah & Haji', teks: 'MCU jemaah dan vaksin meningitis bersama RSU Aminah, satu pintu pendaftaran.', cta: 'Lihat Paket', href: '/layanan/umrah-haji.html' },
    { judul: 'Khitan Modern', teks: 'Metode klem & kauter, minim nyeri, anak bisa langsung beraktivitas.', cta: 'Info Khitan', href: '/layanan/khitan.html' }
  ]
};

/* ------------------------------------------------- SEO KEYWORDS */
const SEO = {
  primary: [
    'klinik Blitar', 'klinik pratama Blitar', 'klinik 24 jam Blitar',
    'dokter gigi Blitar', 'khitan Blitar', 'sunat Blitar',
    'apotek Blitar', 'klinik terdekat Blitar', 'dokter umum Blitar'
  ],
  longTail: [
    'klinik pratama Sananwetan Blitar', 'tambal gigi Blitar biaya',
    'khitan modern klem Blitar', 'apotek buka malam Blitar',
    'konsultasi dokter online Blitar', 'klinik buka pagi Blitar',
    'scaling gigi Blitar', 'dokter gigi anak Blitar', 'apotek Nglegok',
    'klinik Karangtengah Blitar', 'surat keterangan sehat Blitar'
  ]
};

module.exports = { CONFIG, NAV, TEKS, LOWONGAN, TESTIMONI_KHITAN, AMINAH, ANTREAN, SERVICES, PHARMACIES, DOCTORS, APOTEKER, PRODUK, ADVANTAGES, STATS, ARTICLES, PARTNERS, SEO, FACILITIES, SERVICE_IMG, ARTICLE_IMG };
