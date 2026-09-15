/* =============================================================
 * app.js — Interaksi dasar situs (≈4 KB, tanpa library)
 * ============================================================= */
(function () {
  'use strict';

  /* ------------------------------------------- Header sticky */
  var hd = document.getElementById('hd');
  if (hd) {
    var last = 0;
    var onScroll = function () {
      var y = window.scrollY;
      if ((y > 8) !== (last > 8)) hd.classList.toggle('stuck', y > 8);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------- Menu mobile */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  var mclose = document.getElementById('mclose');
  function setMenu(open) {
    if (!mnav) return;
    mnav.hidden = !open;
    document.body.classList.toggle('lock', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    if (open) { var f = mnav.querySelector('a'); if (f) f.focus(); }
    else if (burger) burger.focus();
  }
  if (burger) burger.addEventListener('click', function () { setMenu(mnav.hidden); });
  if (mclose) mclose.addEventListener('click', function () { setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav && !mnav.hidden) setMenu(false); });

  /* ------------------------------------------- Dock aktif */
  var here = location.pathname.replace(/index\.html$/, '') || '/';
  document.querySelectorAll('.dock a').forEach(function (a) {
    var h = a.getAttribute('href');
    if (h === here || (h !== '/' && h && here.indexOf(h.replace('.html', '')) === 0)) a.classList.add('on');
  });

  /* ------------------------------------------- Reveal on scroll */
  var rvs = document.querySelectorAll('.rv');
  if (rvs.length) {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      rvs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------- Toast helper */
  window.toast = function (msg, ms) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, ms || 3600);
  };

  /* ------------------------------------------- Service worker */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        // Versi baru tersedia -> tawarkan muat ulang
        function watch(w) {
          if (!w) return;
          w.addEventListener('statechange', function () {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBar(reg);
            }
          });
        }
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg);
        watch(reg.installing);
        reg.addEventListener('updatefound', function () { watch(reg.installing); });
        // Cek pembaruan tiap 1 jam & saat tab kembali aktif
        setInterval(function () { reg.update().catch(function () {}); }, 3600000);
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) reg.update().catch(function () {});
        });
      }).catch(function () {});

      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloading) return; reloading = true; location.reload();
      });
    });
  }

  function showUpdateBar(reg) {
    if (document.querySelector('.pwa-bar[data-update]')) return;
    var bar = document.createElement('div');
    bar.className = 'pwa-bar show';
    bar.setAttribute('data-update', '1');
    bar.innerHTML =
      '<img src="/assets/img/logo-klinik.png" alt="">' +
      '<div style="flex:1"><b>Versi baru tersedia</b><span>Muat ulang untuk memakai versi terbaru</span></div>' +
      '<button class="btn btn-primary" id="sw-go">Perbarui</button>' +
      '<button class="cl" id="sw-no" aria-label="Tutup">\u2715</button>';
    document.body.appendChild(bar);
    bar.querySelector('#sw-go').onclick = function () {
      bar.remove();
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else location.reload();
    };
    bar.querySelector('#sw-no').onclick = function () { bar.remove(); };
  }

  /* ------------------------------------------- Prompt install PWA */
  var deferred = null;
  var isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function dismissed() { try { return localStorage.getItem('pwa-dismiss') === '1'; } catch (e) { return false; } }

  addEventListener('appinstalled', function () {
    try { localStorage.setItem('pwa-dismiss', '1'); } catch (e) {}
    var b = document.querySelector('.pwa-bar:not([data-update])'); if (b) b.remove();
    if (window.toast) window.toast('Aplikasi berhasil dipasang di perangkat Anda.');
  });

  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (isStandalone || dismissed()) return;
    var bar = document.createElement('div');
    bar.className = 'pwa-bar show';
    bar.innerHTML =
      '<img src="/assets/img/logo-klinik.png" alt="">' +
      '<div style="flex:1"><b>Pasang aplikasi klinik</b><span>Akses cepat dari layar utama HP Anda</span></div>' +
      '<button class="btn btn-primary" id="pwa-go">Pasang</button>' +
      '<button class="cl" id="pwa-no" aria-label="Tutup">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector('#pwa-go').onclick = function () {
      bar.remove(); if (deferred) { deferred.prompt(); deferred = null; }
    };
    bar.querySelector('#pwa-no').onclick = function () {
      bar.remove(); try { localStorage.setItem('pwa-dismiss', '1'); } catch (e) {}
    };
  });

  /* -------------------- Petunjuk pasang khusus iOS (Safari) */
  (function () {
    var ua = navigator.userAgent || '';
    var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (!iOS || !safari || isStandalone || dismissed()) return;
    setTimeout(function () {
      if (document.querySelector('.pwa-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'pwa-bar show';
      bar.innerHTML =
        '<img src="/assets/img/logo-klinik.png" alt="">' +
        '<div style="flex:1"><b>Pasang aplikasi klinik</b><span>Ketuk Bagikan lalu \u201cTambah ke Layar Utama\u201d</span></div>' +
        '<button class="cl" id="ios-no" aria-label="Tutup">\u2715</button>';
      document.body.appendChild(bar);
      bar.querySelector('#ios-no').onclick = function () {
        bar.remove(); try { localStorage.setItem('pwa-dismiss', '1'); } catch (e) {}
      };
    }, 2500);
  })();

  /* ------------------------------------------- Status online */
  addEventListener('offline', function () { window.toast('Anda sedang offline. Sebagian fitur dibatasi.'); });
  addEventListener('online', function () { window.toast('Koneksi kembali tersambung.'); });

  /* ------------------------------------------- Tahun footer & smooth anchor */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', id); }
    });
  });
})();
