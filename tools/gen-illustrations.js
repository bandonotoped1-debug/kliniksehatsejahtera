#!/usr/bin/env node
/* =============================================================
 * gen-illustrations.js — Membuat ilustrasi vektor (SVG) fasilitas
 * -------------------------------------------------------------
 * Ilustrasi ini adalah GAMBAR BUATAN, bukan foto asli klinik.
 * Gantilah dengan foto asli (JPG/WebP) sebelum go-live:
 *   public/assets/img/fasilitas/<nama>.jpg
 * lalu ubah ekstensi pada src/data/site.js → FACILITIES[].img
 * Jalankan: node tools/gen-illustrations.js
 * ============================================================= */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'img', 'fasilitas');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  g50: '#F5FBEB', g100: '#E9F6D3', g200: '#D3EDA8', g300: '#B5DF73',
  g500: '#85C226', g600: '#6BA318', g700: '#537F12', g900: '#22350B',
  r500: '#DA251C', r100: '#FBD9D7', r50: '#FDEEED',
  b50: '#EEF6FB', b100: '#D9EBF5', b500: '#2A7FAE',
  ink: '#0D2B20', line: '#E4EDE6', wall: '#F3F8F3', wall2: '#E8F1E9',
  floor: '#DCE7DC', white: '#FFFFFF', skin: '#F2C9A8', skin2: '#E0AE86',
  gray: '#C9D6CC', warm: '#F7D9A0'
};

const W = 800, H = 560;

/* ---------------------------------------------------- helpers */
const rect = (x, y, w, h, f, r = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" rx="${r}" ${extra}/>`;
const circ = (cx, cy, r, f, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${extra}/>`;
const pathEl = (d, f, extra = '') => `<path d="${d}" fill="${f}" ${extra}/>`;

/* Dinding + lantai + list dinding */
function room(floorY = 380, wall = C.wall) {
  return `
  ${rect(0, 0, W, H, wall)}
  ${rect(0, floorY, W, H - floorY, C.floor)}
  ${rect(0, floorY - 8, W, 8, C.wall2)}
  ${Array.from({ length: 9 }, (_, i) =>
    `<path d="M${i * 110 - 60} ${H} L${i * 110 + 40} ${floorY}" stroke="${C.gray}" stroke-width="1.2" opacity=".5"/>`).join('')}`;
}

/* Jendela besar dengan pemandangan */
function window_(x, y, w, h) {
  return `
  ${rect(x - 6, y - 6, w + 12, h + 12, C.white, 14)}
  ${rect(x, y, w, h, C.b50, 10)}
  ${circ(x + w - 42, y + 40, 20, '#FBE7A8')}
  ${pathEl(`M${x} ${y + h} L${x + w * .3} ${y + h * .55} L${x + w * .55} ${y + h} Z`, C.g200)}
  ${pathEl(`M${x + w * .38} ${y + h} L${x + w * .68} ${y + h * .42} L${x + w} ${y + h} Z`, C.g300)}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.white}" stroke-width="6" rx="10"/>
  <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${C.white}" stroke-width="6"/>`;
}

/* Tanaman hias di pot */
function plant(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    ${pathEl('M0 0 C-34 -14 -46 -52 -30 -84 C-4 -66 4 -34 0 0 Z', C.g500)}
    ${pathEl('M0 0 C34 -18 44 -58 26 -88 C2 -66 -4 -32 0 0 Z', C.g600)}
    ${pathEl('M0 -4 C-8 -40 4 -78 24 -96 C22 -60 12 -26 0 -4 Z', C.g300)}
    ${pathEl('M-26 0 L26 0 L20 38 L-20 38 Z', C.warm)}
    ${rect(-30, -6, 60, 12, '#E9B96B', 4)}
  </g>`;
}

/* Bingkai poster di dinding */
function poster(x, y, w, h, fill) {
  return `${rect(x, y, w, h, C.white, 6)}${rect(x + 7, y + 7, w - 14, h - 14, fill, 4)}
  ${circ(x + w / 2, y + h / 2 - 6, 14, C.white, 'opacity=".75"')}`;
}

/* Sosok orang sederhana (gaya flat) */
function person(x, y, s, baju, hijab) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    ${hijab
      ? `${pathEl('M0 -74 C22 -74 32 -56 32 -36 C32 -8 20 4 0 4 C-20 4 -32 -8 -32 -36 C-32 -56 -22 -74 0 -74 Z', hijab)}
         ${pathEl('M-14 -58 C-4 -66 8 -66 16 -58 C20 -44 18 -30 8 -24 C-2 -20 -12 -28 -16 -40 Z', C.skin)}`
      : `${circ(0, -46, 26, C.skin)}${pathEl('M-26 -52 C-22 -76 22 -76 26 -52 C18 -62 -16 -64 -26 -52 Z', C.ink)}`}
    ${pathEl(`M-30 ${hijab ? 0 : -22} C-30 ${hijab ? -6 : -30} 30 ${hijab ? -6 : -30} 30 ${hijab ? 0 : -22} L34 56 L-34 56 Z`, baju,
      baju === C.white ? `stroke="${C.g200}" stroke-width="3"` : '')}
  </g>`;
}

/* Meja */
function desk(x, y, w, h, top = C.white, leg = C.g200) {
  return `${rect(x, y, w, 14, top, 7)}${rect(x + 10, y + 14, 12, h, leg)}${rect(x + w - 22, y + 14, 12, h, leg)}`;
}

function svg(inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}">
<title>${title}</title>
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="0"/></clipPath></defs>
<g clip-path="url(#c)">${inner}</g></svg>`;
}

/* ============================================ 1. RUANG TUNGGU */
const ruangTunggu = svg(`
${room(392)}
${window_(470, 70, 260, 170)}
${poster(90, 80, 110, 140, C.g100)}
${poster(220, 100, 90, 110, C.b100)}
<!-- deretan kursi tunggu -->
${[0, 1, 2].map(i => {
  const x = 70 + i * 130;
  return `${rect(x, 330, 110, 16, C.g500, 8)}${rect(x, 262, 110, 74, C.g300, 12)}
          ${rect(x + 8, 346, 10, 48, C.gray)}${rect(x + 92, 346, 10, 48, C.gray)}`;
}).join('')}
${person(126, 302, .82, C.b500, null)}
${person(256, 302, .82, C.r500, C.g700)}
${plant(700, 392, 1.05)}
${rect(430, 300, 130, 12, C.white, 6)}
${rect(470, 312, 50, 80, C.g200, 6)}
${circ(495, 268, 22, C.g100)}
`, 'Ilustrasi ruang tunggu klinik yang terang dan nyaman');

/* =========================================== 2. RUANG PERIKSA */
const ruangPeriksa = svg(`
${room(400, '#F4F9F6')}
${window_(70, 66, 200, 150)}
${poster(560, 70, 96, 120, C.g100)}
<!-- ranjang periksa -->
${rect(300, 296, 330, 26, C.white, 13)}
${rect(300, 290, 120, 18, C.g100, 9)}
${rect(316, 322, 14, 78, C.gray)}${rect(600, 322, 14, 78, C.gray)}
${rect(300, 318, 330, 8, C.g200)}
<!-- dokter -->
${person(212, 336, 1.15, C.white, null)}
<g transform="translate(212,336) scale(1.15)">
  ${pathEl('M-10 -22 L-10 20 L10 20 L10 -22 Z', C.g100)}
  ${circ(0, 14, 7, C.g600)}
  ${pathEl('M-8 -18 C-8 4 8 4 8 -18', 'none', `stroke="${C.g600}" stroke-width="3"`)}
</g>
<!-- troli alat -->
${rect(660, 300, 100, 12, C.white, 6)}
${rect(668, 312, 84, 66, '#EDF3EE', 6)}
${rect(680, 276, 22, 24, C.b100, 4)}${rect(712, 268, 26, 32, C.g200, 4)}
${circ(682, 390, 10, C.gray)}${circ(740, 390, 10, C.gray)}
${plant(90, 400, .85)}
<!-- monitor -->
${rect(430, 96, 150, 96, C.white, 10)}
${rect(442, 108, 126, 72, C.ink, 6)}
<path d="M452 152 h22 l8-20 l10 34 l10-26 l8 12 h44" fill="none" stroke="${C.g500}" stroke-width="3" stroke-linejoin="round"/>
`, 'Ilustrasi ruang periksa dokter dengan peralatan medis');

/* ============================================== 3. POLI GIGI */
const poliGigi = svg(`
${room(400, '#F2F8FA')}
${window_(80, 60, 190, 140)}
<!-- kursi gigi -->
${pathEl('M300 400 L300 330 C300 312 316 300 336 300 L520 300 C540 300 556 312 556 330 L556 400 Z', C.b100)}
${pathEl('M336 300 L336 214 C336 196 352 186 372 186 L400 186 C420 186 434 198 434 216 L434 300 Z', C.b500)}
${rect(300, 296, 260, 18, C.white, 9)}
${rect(410, 396, 46, 30, C.gray, 6)}
<!-- lampu operasi -->
${pathEl('M566 120 L700 120 L690 150 L576 150 Z', C.white)}
${rect(618, 150, 14, 60, C.gray)}
${pathEl('M576 150 L690 150 L648 196 L618 196 Z', '#FDF3D2', 'opacity=".85"')}
${circ(632, 132, 13, '#FBE7A8')}
<!-- dokter gigi -->
${person(238, 342, 1.1, C.white, C.g600)}
<!-- meja alat -->
${rect(620, 300, 130, 12, C.white, 6)}
${rect(636, 312, 100, 60, '#EAF2F5', 6)}
${rect(650, 280, 10, 20, C.gray, 3)}${rect(668, 274, 10, 26, C.gray, 3)}${rect(686, 284, 10, 16, C.gray, 3)}
<!-- poster gigi -->
${rect(300, 66, 96, 112, C.white, 8)}
${pathEl('M348 92 C336 82 320 86 320 104 C320 124 332 142 336 154 C340 162 348 160 350 150 C352 140 356 138 360 148 C363 158 372 160 375 150 C380 136 388 122 388 104 C388 86 372 82 360 92 Z', C.b100)}
${plant(96, 400, .8)}
`, 'Ilustrasi ruang praktik dokter gigi');

/* ================================================ 4. APOTEK */
const apotekImg = svg(`
${room(410, '#F6FAF3')}
<!-- rak obat -->
${rect(60, 70, 300, 320, C.white, 10)}
${[0, 1, 2, 3].map(r => `${rect(72, 86 + r * 76, 276, 62, '#F1F7F0', 6)}
  ${Array.from({ length: 9 }, (_, i) => rect(82 + i * 30, 96 + r * 76, 20, 44,
    [C.g300, C.b100, C.r100, C.g200, C.warm][(i + r) % 5], 3)).join('')}`).join('')}
<!-- konter -->
${rect(400, 300, 330, 22, C.white, 11)}
${rect(410, 322, 310, 88, C.g100, 8)}
${rect(430, 340, 60, 52, C.white, 5)}${rect(506, 340, 60, 52, C.white, 5)}${rect(582, 340, 60, 52, C.white, 5)}
<!-- apoteker -->
${person(470, 302, .98, C.white, C.g600)}
<!-- pasien di depan konter -->
${person(662, 326, .95, C.b500, null)}
<!-- papan nama -->
${rect(400, 84, 330, 76, C.g600, 12)}
${circ(438, 122, 20, C.white, 'opacity=".9"')}
${pathEl('M430 122 h16 M438 114 v16', 'none', `stroke="${C.g600}" stroke-width="4" stroke-linecap="round"`)}
${rect(472, 108, 210, 12, C.white, 6, 'opacity=".9"')}
${rect(472, 128, 140, 10, C.g300, 5)}
${plant(756, 410, .75)}
`, 'Ilustrasi apotek dengan rak obat dan konter pelayanan');

/* ============================================ 5. RUANG KHITAN */
const ruangKhitan = svg(`
${room(400, '#F7F5FA')}
${window_(520, 64, 210, 150)}
${rect(120, 300, 300, 24, C.white, 12)}
${rect(120, 292, 300, 14, C.g200, 7)}
${rect(136, 324, 14, 76, C.gray)}${rect(390, 324, 14, 76, C.gray)}
${person(206, 326, .8, C.g300, null)}
${person(316, 338, 1.05, C.white, C.g600)}
<!-- alat & troli -->
${rect(440, 306, 110, 12, C.white, 6)}
${rect(452, 318, 86, 60, '#F0EEF6', 6)}
${rect(464, 286, 24, 20, C.r100, 4)}${rect(496, 282, 20, 24, C.b100, 4)}
<!-- balon ramah anak -->
${circ(640, 268, 26, C.r500)}${circ(688, 292, 20, C.g500)}${circ(608, 308, 16, C.b500)}
<path d="M640 294 C636 320 644 340 636 364" fill="none" stroke="${C.gray}" stroke-width="2"/>
<path d="M688 312 C684 332 692 346 686 364" fill="none" stroke="${C.gray}" stroke-width="2"/>
${poster(60, 90, 100, 120, C.g100)}
${plant(756, 400, .7)}
`, 'Ilustrasi ruang tindakan khitan yang ramah anak');

/* ======================================== 6. MEJA PENDAFTARAN */
const pendaftaranImg = svg(`
${room(404, '#F4F9F4')}
${rect(150, 66, 500, 96, C.g600, 14)}
${circ(196, 114, 22, C.white, 'opacity=".92"')}
${pathEl('M186 114 h20 M196 104 v20', 'none', `stroke="${C.g600}" stroke-width="4" stroke-linecap="round"`)}
${rect(234, 98, 300, 14, C.white, 7, 'opacity=".92"')}
${rect(234, 122, 190, 11, C.g300, 5)}
<!-- konter pendaftaran -->
${rect(120, 286, 560, 26, C.white, 13)}
${rect(136, 312, 528, 92, C.g100, 8)}
${Array.from({ length: 6 }, (_, i) => rect(162 + i * 86, 334, 60, 48, C.white, 5)).join('')}
<!-- petugas -->
${person(252, 290, .95, C.white, C.g700)}
${person(432, 290, .95, C.white, null)}
<!-- pasien -->
${person(622, 322, .95, C.b500, null)}
<!-- layar antrean -->
${rect(560, 180, 180, 86, C.ink, 10)}
${rect(576, 196, 148, 54, '#10362A', 6)}
${rect(592, 210, 52, 26, C.g500, 4)}
${rect(656, 214, 52, 8, C.g300, 4)}${rect(656, 228, 34, 8, C.g300, 4)}
${plant(84, 404, .8)}
`, 'Ilustrasi meja pendaftaran dan layar antrean klinik');

/* ============================================= 7. HERO BANNER */
const heroArt = svg(`
${rect(0, 0, W, H, '#F7FAF6')}
${circ(650, 110, 180, C.g100)}
${circ(160, 470, 200, C.b50)}
<!-- gedung klinik -->
${rect(190, 180, 420, 240, C.white, 18)}
${rect(190, 180, 420, 56, C.g600, 0)}
${pathEl('M190 198 L190 180 L610 180 L610 198 Z', C.g700)}
${circ(232, 208, 18, C.white, 'opacity=".95"')}
${pathEl('M222 208 h20 M232 198 v20', 'none', `stroke="${C.g600}" stroke-width="4" stroke-linecap="round"`)}
${rect(266, 196, 200, 11, C.white, 6, 'opacity=".92"')}
${rect(266, 214, 120, 9, C.g300, 5)}
${[0, 1, 2].map(i => `${rect(222 + i * 130, 262, 96, 74, C.b50, 8)}
  <rect x="${222 + i * 130}" y="262" width="96" height="74" fill="none" stroke="${C.white}" stroke-width="5" rx="8"/>
  <line x1="${270 + i * 130}" y1="262" x2="${270 + i * 130}" y2="336" stroke="${C.white}" stroke-width="5"/>`).join('')}
${rect(352, 352, 96, 68, C.g200, 8)}
${rect(190, 412, 420, 12, C.g200, 6)}
<!-- tanda plus & hati -->
${circ(628, 262, 34, C.r500)}
${pathEl('M614 262 h28 M628 248 v28', 'none', 'stroke="#fff" stroke-width="7" stroke-linecap="round"')}
${circ(176, 252, 26, C.g500)}
${pathEl('M176 266 L165 254 a7.5 7.5 0 0 1 11-10 a7.5 7.5 0 0 1 11 10 Z', C.white)}
${plant(146, 420, 1)}
${plant(660, 424, .9)}
${rect(0, 420, W, 140, C.g50)}
${Array.from({ length: 7 }, (_, i) => circ(60 + i * 120, 470, 5, C.g200)).join('')}
`, 'Ilustrasi gedung Klinik Pratama Sehat Sejahtera');

/* ---------------------------------------------------- tulis */
const files = {
  'ruang-tunggu.svg': ruangTunggu,
  'ruang-periksa.svg': ruangPeriksa,
  'poli-gigi.svg': poliGigi,
  'apotek.svg': apotekImg,
  'ruang-khitan.svg': ruangKhitan,
  'pendaftaran.svg': pendaftaranImg,
  'hero-klinik.svg': heroArt
};
Object.keys(files).forEach(n => {
  fs.writeFileSync(path.join(OUT, n), files[n].replace(/\n\s*\n/g, '\n'));
  console.log('  ✓ assets/img/fasilitas/' + n);
});
console.log('Selesai. Ganti dengan foto asli klinik bila sudah tersedia.');
