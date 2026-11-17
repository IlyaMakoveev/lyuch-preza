/* ============================================================
   deck.js — движок деки. Классический скрипт IIFE, ноль зависимостей.
   Создаёт хром интерфейса, управляет слайдами, темой, обзором.
   Публичный API: window.VibeDeck = { state, next, prev, goTo, toggleOverview }
   События на document: deck:ready, deck:change, deck:overview-toggle
   ============================================================ */

(function () {
  'use strict';

  var TRANSITION_MS = 700; // блокировка навигации на время перехода
  var WHEEL_LOCK_MS = 900; // блокировка колеса после срабатывания
  var WHEEL_THRESHOLD = 50;
  var SWIPE_THRESHOLD = 48;
  var THEME_KEY = 'vibe-theme';

  var deck;
  var slides = [];
  var index = 0;
  var lockUntil = 0;
  var overviewOpen = false;
  var lastFocused = null;
  var wheelAcc = 0;
  var wheelLockUntil = 0;
  var wheelLastTs = 0;
  var touchStartX = 0;
  var touchStartY = 0;

  // Создаваемый хром
  var progressEl, progressBarEl, counterEl, themeBtn, overviewEl;

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function clamp(i) {
    return Math.max(0, Math.min(slides.length - 1, i));
  }

  /* ---------- Хром ---------- */

  function buildChrome() {
    progressEl = document.createElement('div');
    progressEl.className = 'progress';
    progressBarEl = document.createElement('div');
    progressBarEl.className = 'progress-bar';
    progressEl.appendChild(progressBarEl);
    document.body.appendChild(progressEl);

    counterEl = document.createElement('div');
    counterEl.className = 'slide-counter';
    counterEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(counterEl);

    themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Переключить тему');
    themeBtn.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"></circle>' +
      '<path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7"></path>' +
      '</svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"></path>' +
      '</svg>';
    themeBtn.addEventListener('click', function () {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
    document.body.appendChild(themeBtn);

    var hint = document.createElement('div');
    hint.className = 'kbd-hint';
    hint.innerHTML =
      '<span class="kbd">←</span><span class="kbd">→</span> листать' +
      '<span class="kbd">G</span> обзор' +
      '<span class="kbd">S</span> спикер' +
      '<span class="kbd">T</span> тема';
    document.body.appendChild(hint);

    buildOverview();
  }

  function buildOverview() {
    overviewEl = document.createElement('section');
    overviewEl.className = 'overview';
    overviewEl.id = 'overview';
    overviewEl.setAttribute('role', 'dialog');
    overviewEl.setAttribute('aria-label', 'Обзор слайдов');
    overviewEl.hidden = true;

    slides.forEach(function (slide, i) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'overview-card';
      card.style.setProperty('--i', String(i));

      var kicker = slide.getAttribute('data-kicker');
      if (!kicker) {
        var k = slide.querySelector('.kicker');
        kicker = k ? k.textContent.trim() : '';
      }
      var title = slide.getAttribute('data-title');
      if (!title) {
        var t = slide.querySelector('.slide-title');
        title = t ? t.textContent.trim() : 'Слайд ' + (i + 1);
      }

      var num = document.createElement('span');
      num.className = 'overview-num';
      num.textContent = String(i + 1).padStart(2, '0');
      var kick = document.createElement('span');
      kick.className = 'overview-kicker';
      kick.textContent = kicker;
      var name = document.createElement('span');
      name.className = 'overview-title';
      name.textContent = title;

      card.appendChild(num);
      if (kicker) card.appendChild(kick);
      card.appendChild(name);

      card.addEventListener('click', function () {
        goTo(i);
        toggleOverview(false);
      });
      overviewEl.appendChild(card);
    });

    document.body.appendChild(overviewEl);
  }

  function updateOverviewCurrent() {
    var cards = overviewEl.querySelectorAll('.overview-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('is-current', i === index);
    }
  }

  /* ---------- Тема ---------- */

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* приватный режим — просто живём без памяти */
    }
  }

  function initTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {
      /* нет доступа к localStorage */
    }
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
  }

  /* ---------- Прогресс и счётчик ---------- */

  function updateChrome() {
    if (progressBarEl) {
      progressBarEl.style.setProperty('--progress', String(slides.length ? (index + 1) / slides.length : 0));
    }
    if (counterEl) {
      counterEl.textContent = (index + 1) + ' / ' + slides.length;
    }
    updateOverviewCurrent();
  }

  /* ---------- Морфинг data-vt ---------- */

  function assignVT(fromIdx, toIdx) {
    var nodes = document.querySelectorAll('[data-vt]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var inRange = false;
      if (fromIdx >= 0 && slides[fromIdx].contains(el)) inRange = true;
      if (toIdx >= 0 && slides[toIdx].contains(el)) inRange = true;
      el.style.viewTransitionName = inRange ? el.getAttribute('data-vt') : '';
    }
  }

  function cleanupVT() {
    var nodes = document.querySelectorAll('[data-vt]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // имя остаётся только у элементов активного слайда,
      // иначе будут дубликаты view-transition-name
      if (!slides[index].contains(el)) el.style.viewTransitionName = '';
    }
  }

  /* ---------- Смена слайдов ---------- */

  function goTo(i) {
    i = clamp(i);
    if (i === index || Date.now() < lockUntil) return;
    var dir = i > index ? 1 : -1;
    var oldIndex = index;
    lockUntil = Date.now() + TRANSITION_MS;

    var change = function () {
      var oldSlide = slides[oldIndex];
      var newSlide = slides[i];
      if (oldSlide) {
        oldSlide.classList.remove('is-active');
        oldSlide.classList.add('is-exiting');
        window.setTimeout(function () {
          oldSlide.classList.remove('is-exiting');
        }, TRANSITION_MS);
      }
      newSlide.classList.add('is-active');
      index = i;
      updateChrome();
      try {
        history.replaceState(null, '', '#/' + (i + 1));
      } catch (e) {
        /* file:// без прав — не критично */
      }
      document.dispatchEvent(new CustomEvent('deck:change', {
        detail: { index: index, total: slides.length, dir: dir }
      }));
    };

    var canVT = typeof document.startViewTransition === 'function' && !reducedMotion();
    if (canVT) {
      assignVT(oldIndex, i);
      document.documentElement.classList.add('vt-active');
      var vt = document.startViewTransition(change);
      if (vt && vt.finished) {
        vt.finished.finally(function () {
          document.documentElement.classList.remove('vt-active');
          cleanupVT();
        });
      } else {
        document.documentElement.classList.remove('vt-active');
        cleanupVT();
      }
    } else {
      change();
    }
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  /* ---------- Обзор ---------- */

  function toggleOverview(force) {
    var open = typeof force === 'boolean' ? force : !overviewOpen;
    if (open === overviewOpen) return;
    overviewOpen = open;

    document.body.classList.toggle('has-overview', open);

    if (open) {
      lastFocused = document.activeElement;
      overviewEl.hidden = false;
      // кадр, чтобы сработал transition от скрытого состояния
      window.requestAnimationFrame(function () {
        overviewEl.classList.add('is-open');
        overviewEl.classList.remove('closing');
      });
      overviewEl.setAttribute('tabindex', '-1');
      overviewEl.focus({ preventScroll: true });
    } else {
      overviewEl.classList.add('closing');
      overviewEl.classList.remove('is-open');
      window.setTimeout(function () {
        overviewEl.classList.remove('closing');
        overviewEl.hidden = true;
      }, reducedMotion() ? 0 : 180);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }
    }

    document.dispatchEvent(new CustomEvent('deck:overview-toggle', {
      detail: { open: open }
    }));
  }

  /* ---------- Клавиатура ---------- */

  function inEditable(target) {
    if (!target || target === document) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable]'));
  }

  function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Escape') {
      if (overviewOpen) {
        e.preventDefault();
        toggleOverview(false);
      }
      return; // Escape всегда проходит дальше
    }

    if (inEditable(e.target)) return;

    var k = e.key;
    var isG = k === 'g' || k === 'G' || k === 'п' || k === 'П';
    var isT = k === 't' || k === 'T' || k === 'е' || k === 'Е';

    if (isG) {
      e.preventDefault();
      toggleOverview();
      return;
    }
    if (isT) {
      e.preventDefault();
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      return;
    }

    // При открытом обзоре навигационные клавиши не работают
    if (overviewOpen) return;

    var navKey =
      k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' ||
      k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' ||
      k === 'Home' || k === 'End';

    if (!navKey) return;

    if (k === 'Home') { e.preventDefault(); goTo(0); return; }
    if (k === 'End') { e.preventDefault(); goTo(slides.length - 1); return; }

    e.preventDefault(); // перехватили — гасим прокрутку (Space и стрелки)
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ') {
      next();
    } else {
      prev();
    }
  }

  /* ---------- Колесо / трекпад ---------- */

  function onWheel(e) {
    if (overviewOpen) return;
    // вертикальное колесо/трекпад — естественный скролл контента,
    // слайды не перелистываем. Переход — только горизонтальный жест.
    var dx = e.deltaX;
    var dy = e.deltaY;
    if (Math.abs(dx) <= Math.abs(dy)) return;
    var now = Date.now();
    if (now < wheelLockUntil) return;
    // затухание: пауза > 300мс обнуляет накопитель
    if (now - wheelLastTs > 300) wheelAcc = 0;
    wheelLastTs = now;
    wheelAcc += dx;
    if (Math.abs(wheelAcc) >= WHEEL_THRESHOLD) {
      if (wheelAcc > 0) next();
      else prev();
      wheelAcc = 0;
      wheelLockUntil = now + WHEEL_LOCK_MS;
    }
  }

  /* ---------- Тач-свайпы ---------- */

  function touchIgnored(target) {
    if (!target || target === document) return false;
    return Boolean(target.closest(
      '[data-widget], button, input, textarea, select, [contenteditable], .overview, .presenter'
    ));
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (overviewOpen || e.changedTouches.length !== 1) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) next();
      else prev();
    }
  }

  /* ---------- Инициализация ---------- */

  function init() {
    deck = document.getElementById('deck');
    if (!deck) return;
    slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));

    initTheme();
    buildChrome();

    // Слайд из hash (#/N → N-1)
    var m = location.hash.match(/^#\/(\d+)/);
    index = clamp(m ? parseInt(m[1], 10) - 1 : 0);

    // Первый показ без анимации
    deck.classList.add('is-booting');
    slides[index].classList.add('is-active');
    assignVT(-1, index);
    updateChrome();
    window.setTimeout(function () {
      deck.classList.remove('is-booting');
    }, 120);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: true });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    document.dispatchEvent(new CustomEvent('deck:ready', {
      detail: { index: index, total: slides.length }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Публичный API: state — живой объект, обновляется движком
  var state = {};
  Object.defineProperties(state, {
    index: { get: function () { return index; } },
    total: { get: function () { return slides.length; } },
    overviewOpen: { get: function () { return overviewOpen; } }
  });

  window.VibeDeck = {
    state: state,
    next: next,
    prev: prev,
    goTo: goTo,
    toggleOverview: toggleOverview
  };
})();
