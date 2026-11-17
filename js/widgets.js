/* ============================================================
   widgets.js — интерактивные виджеты деки «Вайбкодинг».
   Классический скрипт (не модуль), IIFE, ноль зависимостей.
   Грузится ПОСЛЕ deck.js. Экспорт: window.VibeWidgets = { initAll }.
   Слушает document-события: deck:ready, deck:change.
   ============================================================ */

(function () {
  'use strict';

  var VOTES_KEY = 'vibe-pulse-votes';
  var inited = false;
  var widgets = []; // { root, slide, replay }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function svgIcon(paths, cls, size) {
    return '<svg class="w-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24"' +
      (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') +
      ' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"' +
      ' stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  var ICONS = {
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    heart: '<path d="M12 20s-7.2-4.6-9.2-9.1A5.1 5.1 0 0 1 12 7.6a5.1 5.1 0 0 1 9.2 3.3C19.2 15.4 12 20 12 20z"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
    hands: '<path d="M9.4 5.2a1.5 1.5 0 0 1 2.6-1l.8.9M8.2 12.8l-2-2.2a1.5 1.5 0 0 1 2.2-2l1.7 1.8M11 11.8l-2.4-2.6a1.5 1.5 0 0 1 2.2-2l2.9 3.1M12.6 6.1l-1-1.1a1.5 1.5 0 0 1 2.2-2l3.3 3.6a5.4 5.4 0 0 1-.2 7.6l-2.5 2.4a3.9 3.9 0 0 1-5.7-.4"/>',
    left: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    right: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>'
  };

  function countTo(node, to, durMs, suffix) {
    var from = typeof node._wVal === 'number' ? node._wVal : 0;
    node._wVal = to;
    if (reducedMotion() || from === to) {
      node.textContent = to + (suffix || '');
      return;
    }
    var dur = durMs || 800;
    var t0 = null;
    if (node._wRaf) cancelAnimationFrame(node._wRaf);
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (to - from) * e) + (suffix || '');
      if (p < 1) node._wRaf = requestAnimationFrame(step);
    };
    node._wRaf = requestAnimationFrame(step);
  }

  function plural(n, forms) {
    var a = Math.abs(n) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  /* Подмена текста с короткой анимацией входа (для значений метрик) */
  function swapText(node, txt) {
    if (node.textContent === txt) return;
    node.textContent = txt;
    node.classList.remove('is-swap');
    void node.offsetWidth;
    node.classList.add('is-swap');
  }

  function assignStagger(root) {
    var kids = root.children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].style.setProperty('--i', String(i));
    }
  }

  function makeReplay(root) {
    return function () {
      root.classList.remove('w-in');
      void root.offsetWidth;
      requestAnimationFrame(function () { root.classList.add('w-in'); });
    };
  }

  /* ============================================================
     ВИДЖЕТ 1 — sandbox
     ============================================================ */
  function initSandbox(mount) {
    var root = el('div', 'w-widget w-sandbox w-enter');
    root.setAttribute('data-mode', 'a');

    var seg = el('div', 'w-seg');
    seg.setAttribute('role', 'radiogroup');
    seg.innerHTML = '<label><input type="radio" name="wsb" value="a" checked><span>Сделай красиво</span></label>' +
                    '<label><input type="radio" name="wsb" value="b"><span>Промпт с контекстом</span></label>';

    var scene = el('div', 'w-scene');
    var colP = el('div', 'w-col');
    colP.appendChild(el('p', 'w-col-label', 'Промпт'));
    var prompt = el('div', 'w-prompt');
    var paneA = el('div', 'w-prompt-pane w-prompt-a', 'Сделай мне красивый сайт, чтобы всё летало');
    var paneB = el('div', 'w-prompt-pane w-prompt-b');
    paneB.setAttribute('data-side', 'out');
    [['Функциональность', 'Редактор постеров, превью, экспорт PNG'],
     ['Дизайн', 'Минимализм, тёмная тема, один акцент'],
     ['Ограничения', 'Один файл, без библиотек, Canvas API'],
     ['Проверка', 'Прогони сценарии и исправь ошибки']].forEach(function(r){
      var d = el('div', 'w-pb-row');
      d.innerHTML = '<span class="w-pb-name">' + r[0] + '</span>' + r[1];
      paneB.appendChild(d);
    });
    prompt.appendChild(paneA); prompt.appendChild(paneB);
    colP.appendChild(prompt);

    var colR = el('div', 'w-col');
    colR.appendChild(el('p', 'w-col-label', 'Результат'));
    var preview = el('div', 'w-preview');
    var prevA = el('div', 'w-preview-pane w-bad');
    prevA.innerHTML = '<div class="w-bad-block w-bad-1">ЗАГОЛОВОК</div><div class="w-bad-block w-bad-2">дата?</div>';
    var prevB = el('div', 'w-preview-pane w-poster');
    prevB.setAttribute('data-side', 'out');
    prevB.innerHTML = '<span class="w-poster-kicker">Кейс</span><span class="w-poster-title">Вайбкодинг</span>' +
                      '<span class="w-poster-plate">Смотреть</span>';
    preview.appendChild(prevA); preview.appendChild(prevB);
    colR.appendChild(preview);
    scene.appendChild(colP); scene.appendChild(colR);

    var metrics = el('div', 'w-metrics');
    metrics.innerHTML = '<div class="w-metric"><span class="w-metric-name">Соответствие</span><span class="w-metric-value">25%</span><div class="w-meter"><div class="w-meter-fill" style="transform:scaleX(0.25)"></div></div></div>' +
                        '<div class="w-metric"><span class="w-metric-name">Итераций</span><span class="w-metric-value">10+</span></div>' +
                        '<div class="w-metric"><span class="w-metric-name">Доводка</span><span class="w-metric-value">Высокая</span></div>';

    root.appendChild(seg); root.appendChild(scene); root.appendChild(metrics);
    mount.appendChild(root);
    assignStagger(root);

    var mVals = metrics.querySelectorAll('.w-metric-value');
    var mFill = metrics.querySelector('.w-meter-fill');

    seg.addEventListener('change', function(e) {
      var m = e.target.value;
      root.setAttribute('data-mode', m);
      var isB = m === 'b';
      paneA.setAttribute('data-side', isB ? 'out' : 'in');
      paneB.setAttribute('data-side', isB ? 'in' : 'out');
      prevA.setAttribute('data-side', isB ? 'out' : 'in');
      prevB.setAttribute('data-side', isB ? 'in' : 'out');
      countTo(mVals[0], isB ? 90 : 25, 600, '%');
      mFill.style.transform = 'scaleX(' + (isB ? 0.9 : 0.25) + ')';
      swapText(mVals[1], isB ? '3' : '10+');
      swapText(mVals[2], isB ? 'Мин.' : 'Высокая');
    });

    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* ============================================================
     ВИДЖЕТ 2 — tools «ZCode: из чего состоит среда»
     ============================================================ */
  var TOOLS_DATA = [
    { name: 'glm-5.3-flashx', tag: 'Мелкая правка', scene: 'Мелкая правка', speed: 5, depth: 2, desc: 'Самая экономная: стили, простые скрипты, мелочи' },
    { name: 'GLM-5.3-Flash', tag: 'Каждый день', scene: 'Каждый день', speed: 4, depth: 3, desc: 'Повседневные задачи, интерфейсы, рефакторинг' },
    { name: 'GLM-5.3', tag: 'Флагман', scene: 'Сложная задача', speed: 2, depth: 5, desc: 'Архитектура, глубокий анализ, длинные задачи' },
    { name: 'Режимы доверия', tag: 'plan · build · yolo', scene: 'Каждый день', speed: 3, depth: 3, desc: 'Сначала план, потом подтверждение правок, и лишь затем автономия' },
    { name: 'Скиллы', tag: 'npx skills add', scene: 'Каждый день', speed: 3, depth: 4, desc: 'Готовая экспертиза одной командой: дизайн, QA, мобильные' },
    { name: 'MCP-интеграции', tag: 'GitHub · Таблицы · Slack', scene: 'Каждый день', speed: 4, depth: 3, desc: 'Те же интеграции, что и у любой агентной среды' }
  ];
  var TOOL_FILTERS = ['Все', 'Мелкая правка', 'Каждый день', 'Сложная задача'];

  function initTools(mount) {
    var root = el('div', 'w-widget w-tools w-enter');
    var bar = el('div', 'w-tools-bar');
    var chips = el('div', 'w-chips');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Фильтр по сценарию');
    TOOL_FILTERS.forEach(function(f, i) {
      var c = el('button', 'w-chip' + (i===0?' is-on':''), f);
      c.type = 'button';
      c.setAttribute('aria-pressed', i===0 ? 'true' : 'false');
      c.onclick = function() {
        chips.querySelectorAll('.w-chip').forEach(function(x){
          var on = x === c;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach(function(x){ x.classList.toggle('is-hidden', f!=='Все' && x.dataset.scene !== f); });
      };
      chips.appendChild(c);
    });

    var slider = el('div', 'w-slider');
    slider.innerHTML = '<span class="w-slider-label">Экономия</span><input type="range" min="0" max="100" value="50" aria-label="Экономия или глубина"><span class="w-slider-label">Глубина</span>';
    bar.appendChild(chips); bar.appendChild(slider);

    var grid = el('div', 'w-tools-grid');
    var cards = TOOLS_DATA.map(function(t) {
      var c = el('button', 'w-tool-card');
      c.type = 'button';
      c.dataset.scene = t.scene;
      c.setAttribute('aria-expanded', 'false');
      c.innerHTML = '<div class="w-badge">' + svgIcon(ICONS.check) + ' Подходит</div>' +
                    '<div class="w-tool-head"><span class="w-tool-name">' + t.name + '</span><span class="w-tool-vendor">' + t.tag + '</span></div>' +
                    '<p class="w-tool-thesis">' + t.desc + '</p>';
      c.onclick = function() {
        var open = c.classList.contains('is-open');
        grid.querySelectorAll('.w-tool-card').forEach(function(x){
          x.classList.remove('is-open');
          x.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          c.classList.add('is-open');
          c.setAttribute('aria-expanded', 'true');
        }
      };
      grid.appendChild(c);
      return c;
    });

    function updateBest(val) {
      var best = -1, maxS = -1;
      TOOLS_DATA.forEach(function(t, i) {
        var s = 1 - Math.abs(((t.speed-1)/4) - (1-val)) - Math.abs(((t.depth-1)/4) - val);
        if (s > maxS) { maxS = s; best = i; }
      });
      cards.forEach(function(c, i) { c.classList.toggle('is-best', i === best); });
    }
    slider.querySelector('input').addEventListener('input', function(e) {
      updateBest(e.target.value / 100);
    });
    updateBest(0.5);

    root.appendChild(bar); root.appendChild(grid);
    mount.appendChild(root);
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* ============================================================
     ВИДЖЕТ 3 — pulse
     ============================================================ */
  var QUESTIONS = [
    { key: 'q1', title: 'Опыт вайбкодинга?', options: ['Только слышал', 'Пробовал в чате', 'Использую агента', 'Живу в агенте'], demo: [12, 9, 6, 3], correct: -1 },
    { key: 'q2', title: 'Команда /compact?', options: ['Сжимает контекст', 'Сжимает файлы', 'Меняет UI', 'Ускоряет ИИ'], demo: [8, 2, 3, 1], correct: 0 }
  ];

  function initPulse(mount) {
    var root = el('div', 'w-widget w-pulse w-enter');
    var votes = {}; try { votes = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); } catch(e){}

    var tabs = el('div', 'w-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Вопросы опроса');
    var qWrap = el('div', 'w-q');
    var panes = QUESTIONS.map(function(q, qi) {
      var t = el('button', 'w-tab' + (qi===0?' is-on':''), 'Вопрос ' + (qi+1));
      t.type = 'button';
      t.setAttribute('aria-pressed', qi===0 ? 'true' : 'false');
      tabs.appendChild(t);
      var p = el('div', 'w-q-pane');
      if (qi!==0) p.setAttribute('data-side', 'out');
      p.appendChild(el('h3', 'w-q-title', q.title));
      q.options.forEach(function(o, oi) {
        var b = el('button', 'w-opt');
        b.type = 'button';
        b.innerHTML = '<span class="w-opt-bar"></span><span class="w-opt-text">' + o + '</span>' +
                      '<span class="w-opt-right"><span class="w-opt-pct">0%</span><span class="w-opt-votes"></span><span class="w-opt-ico is-ok"></span><span class="w-opt-ico is-no"></span></span>';
        b.querySelector('.w-opt-ico.is-ok').innerHTML = svgIcon(ICONS.check, null, 20);
        b.querySelector('.w-opt-ico.is-no').innerHTML = svgIcon(ICONS.cross, null, 20);
        b.onclick = function() {
          if (votes[q.key] === oi) delete votes[q.key]; else votes[q.key] = oi;
          localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
          render();
        };
        p.appendChild(b);
      });
      t.onclick = function() {
        tabs.querySelectorAll('.w-tab').forEach(function(x){
          var on = x === t;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        panes.forEach(function(x){ x.setAttribute('data-side', x===p ? 'in' : 'out'); });
      };
      qWrap.appendChild(p); return p;
    });

    function render() {
      panes.forEach(function(p, qi) {
        var q = QUESTIONS[qi];
        var mine = votes[q.key];
        var total = q.demo.reduce(function(a,b){return a+b;}, 0) + (mine != null ? 1 : 0);
        p.querySelectorAll('.w-opt').forEach(function(b, oi) {
          var n = q.demo[oi] + (mine === oi ? 1 : 0);
          var pct = total ? Math.round(n/total*100) : 0;
          b.querySelector('.w-opt-bar').style.transform = 'scaleX(' + (pct/100) + ')';
          b.querySelector('.w-opt-pct').textContent = pct + '%';
          b.querySelector('.w-opt-votes').textContent = n + ' ' + plural(n, ['голос', 'голоса', 'голосов']);
          b.classList.toggle('is-voted', mine === oi);
          var icos = b.querySelectorAll('.w-opt-ico');
          if (q.correct >= 0) {
            // снимаем отметки и при отмене голоса — без stale-подсветки
            b.classList.toggle('is-correct', mine != null && oi === q.correct);
            b.classList.toggle('is-wrong', mine === oi && oi !== q.correct);
            icos[0].style.display = (mine != null && oi === q.correct) ? '' : 'none';
            icos[1].style.display = (mine === oi && oi !== q.correct) ? '' : 'none';
          } else {
            b.classList.remove('is-correct', 'is-wrong');
            icos[0].style.display = 'none';
            icos[1].style.display = 'none';
          }
        });
      });
    }

    root.appendChild(tabs); root.appendChild(qWrap);
    mount.appendChild(root); render();
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: function(){ makeReplay(root)(); render(); } });
  }

  /* ============================================================
     Панель спикера + Лазер + Реакции
     ============================================================ */
  function initPresenter() {
    var p = el('aside', 'w-presenter');
    p.id = 'presenter'; p.hidden = true;
    p.innerHTML = '<h2>Спикер</h2><div class="w-p-notes"></div>' +
                  '<div class="w-p-timer"><span class="w-p-clock">00:00</span><button class="w-p-btn" id="wp-run">Старт</button></div>' +
                  '<div class="w-p-hints"><span class="w-kbd">S</span> панель <span class="w-kbd">L</span> лазер</div>';
    document.body.appendChild(p);

    var run = p.querySelector('#wp-run'), clock = p.querySelector('.w-p-clock');
    var start = 0, acc = 0, tid = null;
    run.onclick = function() {
      if (tid) { acc += Date.now()-start; clearInterval(tid); tid = null; run.textContent = 'Старт'; }
      else { start = Date.now(); tid = setInterval(function(){
        var s = Math.floor((Date.now()-start+acc)/1000);
        clock.textContent = ('0'+Math.floor(s/60)).slice(-2) + ':' + ('0'+s%60).slice(-2);
      }, 500); run.textContent = 'Пауза'; }
    };

    function update() {
      // deck:change прилетает из change() внутри view-transition, когда
      // is-active уже переключён; но на диплинке первый update мог вызвать
      // initAll до инициализации деки — тогда фолбэк на state.index.
      var idx = (window.VibeDeck && window.VibeDeck.state &&
                 typeof window.VibeDeck.state.index === 'number')
        ? window.VibeDeck.state.index : null;
      var act = (idx !== null)
        ? document.querySelectorAll('.slide')[idx]
        : document.querySelector('.slide.is-active');
      p.querySelector('.w-p-notes').textContent =
        (act && act.dataset.notes) ? act.dataset.notes : '';
    }
    document.addEventListener('deck:change', update);
    document.addEventListener('deck:ready', update);
    update();

    window.addEventListener('keydown', function(e) {
      var inEditable = e.target && e.target.closest && e.target.closest('input,textarea');
      if (e.key.toLowerCase() === 's' && !inEditable) {
        p.hidden = !p.hidden;
        if (!p.hidden) update();
        setTimeout(function(){ p.classList.toggle('is-open', !p.hidden); }, 10);
      }
    });
  }

  function initLaser() {
    var l = el('div', 'w-laser'); document.body.appendChild(l);
    var hideTid = null;
    window.addEventListener('keydown', function(e) {
      var inEditable = e.target && e.target.closest && e.target.closest('input,textarea');
      if (e.key.toLowerCase() === 'l' && !inEditable) {
        if (hideTid) { clearTimeout(hideTid); hideTid = null; } // быстрое повторное нажатие
        l.hidden = false; l.classList.add('is-on');
      }
    });
    window.addEventListener('keyup', function(e) {
      if (e.key.toLowerCase() === 'l') {
        l.classList.remove('is-on');
        if (hideTid) clearTimeout(hideTid);
        hideTid = setTimeout(function(){ l.hidden = true; hideTid = null; }, 200);
      }
    });
    window.addEventListener('pointermove', function(e) {
      if (l.hidden) return; // обновляем позицию только при активном лазере
      l.style.transform = 'translate3d('+e.clientX+'px,'+e.clientY+'px,0)';
    });
  }

  function initReactions() {
    var b = el('div', 'w-reactions');
    var REACT_LABELS = { heart: 'Отправить сердечко', spark: 'Отправить искры' };
    ['heart', 'spark'].forEach(function(i) {
      var btn = el('button', 'w-react-btn');
      btn.type = 'button';
      btn.setAttribute('aria-label', REACT_LABELS[i]);
      btn.innerHTML = svgIcon(ICONS[i]);
      btn.onclick = function() {
        for (var j=0; j<6; j++) {
          var p = el('div', 'w-particle'); p.innerHTML = svgIcon(ICONS[i]);
          p.style.left = (btn.getBoundingClientRect().left + 20) + 'px';
          p.style.top = (btn.getBoundingClientRect().top + 20) + 'px';
          p.style.setProperty('--dx', (Math.random()-0.5)*100 + 'px');
          p.style.setProperty('--dy', (-100-Math.random()*100) + 'px');
          document.body.appendChild(p); p.classList.add('is-fly');
          (function(x){ setTimeout(function(){ x.remove(); }, 1000); })(p);
        }
      };
      b.appendChild(btn);
    });
    document.body.appendChild(b);
  }

  /* ============================================================
     ВИДЖЕТЫ-СХЕМЫ из статьи: интерактивные HTML/CSS аналоги
     ============================================================ */

  /* --- Воронка ИИ → ML → DL → GenAI → LLM (клик по слою) --- */
  var FUNNEL = [
    { n: 'Искусственный интеллект', d: 'Широкая область, объединяющая методы и подходы, позволяющие машинам решать интеллектуальные задачи.' },
    { n: 'Машинное обучение', d: 'Подмножество ИИ: системы обучаются на данных, выявляя закономерности без явного программирования.' },
    { n: 'Глубокое обучение', d: 'Подмножество машинного обучения на многослойных нейронных сетях.' },
    { n: 'Генеративный ИИ', d: 'Модели, способные создавать новый контент: текст, изображения, код и другие данные.' },
    { n: 'LLM', d: 'Большие языковые модели для работы с естественным языком. В ней мы и работаем.' }
  ];

  function initFunnel(mount) {
    var root = el('div', 'w-widget w-funnel w-enter');
    var layers = el('div', 'w-funnel-layers');
    var panel = el('div', 'w-funnel-panel card');
    FUNNEL.forEach(function(f, i) {
      var b = el('button', 'w-funnel-layer' + (i === FUNNEL.length - 1 ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', i === FUNNEL.length - 1 ? 'true' : 'false');
      b.style.setProperty('--w', (100 - i * 17) + '%');
      b.textContent = f.n;
      b.addEventListener('click', function() {
        layers.querySelectorAll('.w-funnel-layer').forEach(function(x) {
          x.classList.remove('is-on');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('is-on');
        b.setAttribute('aria-pressed', 'true');
        panel.innerHTML = '<b>' + f.n + '.</b> ' + f.d;
      });
      layers.appendChild(b);
    });
    panel.innerHTML = '<b>' + FUNNEL[4].n + '.</b> ' + FUNNEL[4].d;
    root.appendChild(layers); root.appendChild(panel);
    mount.appendChild(root);
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Контекст с зонами 40/70 из статьи --- */
  function initContext40(mount) {
    var root = el('div', 'w-widget w-context40 w-enter');
    root.innerHTML =
      '<div class="w-c40-row">' +
        '<div class="w-c40-meter" role="img" aria-label="Заполнение контекста">' +
          '<div class="w-c40-zone z-ok"></div>' +
          '<div class="w-c40-zone z-warn"></div>' +
          '<div class="w-c40-zone z-bad"></div>' +
          '<div class="w-c40-fill">' +
            '<div class="w-c40-seg s-sys"><span>System</span></div>' +
            '<div class="w-c40-seg s-human"><span>Human</span></div>' +
            '<div class="w-c40-seg s-ai"><span>AI</span></div>' +
            '<div class="w-c40-seg s-tool"><span>Tool</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="w-c40-legend">' +
          '<span class="lg-ok">до 40% — точнее</span>' +
          '<span class="lg-warn">40–70% — шум</span>' +
          '<span class="lg-bad">70%+ — риск</span>' +
        '</div>' +
        '<div class="w-c40-side">' +
          '<p class="w-c40-total">Заполнено: <b class="w-c40-num">0%</b></p>' +
          '<p class="w-c40-status is-ok">Рабочая зона — ответы обычно точнее</p>' +
          '<button type="button" class="w-btn w-c40-compact">Сжать историю</button>' +
          '<p class="w-c40-note" hidden>При сжатии часть деталей теряется — не полагайся на него полностью</p>' +
        '</div>' +
      '</div>' +
      '<div class="w-c40-controls">' +
        '<span class="w-slider-label">Короткая задача</span>' +
        '<input type="range" min="0" max="100" value="25" aria-label="Сколько материала даём агенту">' +
        '<span class="w-slider-label">Вся переписка и файлы</span>' +
      '</div>';
    mount.appendChild(root);

    var q = function(sel) { return root.querySelector(sel); };
    var segs = {
      sys: q('.s-sys'), human: q('.s-human'), ai: q('.s-ai'), tool: q('.s-tool')
    };
    var num = q('.w-c40-num');
    var status = q('.w-c40-status');
    var note = q('.w-c40-note');
    var compactBtn = q('.w-c40-compact');
    var compressed = false;

    function heights(v, squish) {
      var s = squish ? 0.35 : 1;
      return {
        sys: 16,
        human: (8 + v * 0.16) * s,
        ai: (6 + v * 0.12) * s,
        tool: v * 0.30 * s
      };
    }
    function render(v) {
      var h = heights(v, compressed);
      var total = h.sys + h.human + h.ai + h.tool;
      segs.sys.style.height = h.sys + '%';
      segs.human.style.height = h.human + '%';
      segs.ai.style.height = h.ai + '%';
      segs.tool.style.height = h.tool + '%';
      countTo(num, Math.min(100, Math.round(total)), 400, '%');
      status.classList.remove('is-ok', 'is-warn', 'is-bad');
      if (total < 40) { status.classList.add('is-ok'); status.textContent = 'Рабочая зона — ответы обычно точнее'; }
      else if (total < 70) { status.classList.add('is-warn'); status.textContent = 'Деградация: больше шума в ответах'; }
      else { status.classList.add('is-bad'); status.textContent = 'Высокий риск потерь качества'; }
      q('.w-c40-meter').classList.toggle('is-hot', total >= 70);
    }
    var range = q('input[type="range"]');
    range.addEventListener('input', function() {
      compressed = false; note.hidden = true;
      compactBtn.classList.remove('is-done');
      render(+range.value);
    });
    compactBtn.addEventListener('click', function() {
      compressed = true; note.hidden = false;
      compactBtn.classList.add('is-done');
      render(+range.value);
    });
    render(+range.value);

    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Pipeline вызова инструмента (проигрывание шагов) --- */
  var PIPELINE = [
    { n: 'Запрос', d: '«Какая погода в Москве?» — обычный вопрос, ничего специального.' },
    { n: 'LLM', d: 'Свои знания: модель знает мир на дату обучения, но не «сегодня».' },
    { n: 'Инструмент', d: 'Название, описание и параметры — контракт, по которому модель понимает, когда и как вызывать.' },
    { n: 'tool_call', d: 'Структурированное сообщение от модели: «вызови get_weather(\u00abМосква\u00bb)».' },
    { n: 'Вызов и результат', d: 'Среда выполняет инструмент, результат ложится в контекст: user → tool schema → tool result.' },
    { n: 'Ответ', d: '«В Москве +12°, облачно» — собран из свежего контекста, не выдуман.' }
  ];

  function initPipeline(mount) {
    var root = el('div', 'w-widget w-pipeline w-enter');
    var play = el('button', 'w-btn w-pipe-play', '\u25B6 Проиграть');
    var row = el('div', 'w-pipe-row');
    var detail = el('p', 'w-pipe-detail card');
    var steps = PIPELINE.map(function(s, i) {
      var b = el('button', 'w-pipe-step');
      b.innerHTML = '<span class="w-pipe-num">' + (i + 1) + '</span><span class="w-pipe-name">' + s.n + '</span>';
      b.addEventListener('click', function() { stopPlay(); setActive(i); });
      row.appendChild(b);
      return b;
    });
    function setActive(i) {
      steps.forEach(function(b, j) { b.classList.toggle('is-on', j === i); });
      detail.innerHTML = '<b>' + PIPELINE[i].n + '.</b> ' + PIPELINE[i].d;
    }
    var timer = null, idx = 0;
    function stopPlay() { if (timer) { clearInterval(timer); timer = null; play.textContent = '\u25B6 Проиграть'; } }
    play.addEventListener('click', function() {
      if (timer) { stopPlay(); return; }
      play.textContent = '\u25A0 Стоп';
      idx = 0; setActive(0);
      timer = setInterval(function() {
        idx = (idx + 1) % PIPELINE.length;
        setActive(idx);
      }, 900);
    });
    setActive(5);
    root.appendChild(play); root.appendChild(row); root.appendChild(detail);
    mount.appendChild(root);
    assignStagger(root);

    // уход со слайда — глушим авто-проигрывание, чтобы интервал не тикал вхолостую
    var pipeSlide = mount.closest('.slide');
    document.addEventListener('deck:change', function() {
      if (!pipeSlide.classList.contains('is-active')) { stopPlay(); setActive(5); }
    });
    widgets.push({ root: root, slide: pipeSlide, replay: makeReplay(root) });
  }

  /* --- ReAct-цикл: запуск анимации по стрелкам --- */
  var REACT_STEPS = [
    { n: 'request', a: null,   d: 'Пользователь просит: «Какая погода в Москве?»' },
    { n: 'model',   a: 'a1',   d: 'Модель видит инструмент get_weather и решает вызвать.' },
    { n: 'tools',   a: 'a2',   d: 'Action: среда выполняет вызов инструмента.' },
    { n: 'model',   a: 'a3',   d: 'Observation: результат вернулся в контекст.' },
    { n: 'tools',   a: 'a2',   d: 'Мало данных — цикл повторяется.' },
    { n: 'model',   a: 'a3',   d: 'Observation: снова смотрим, что вернулось.' },
    { n: 'result',  a: 'a4',   d: 'Данных достаточно — модель отвечает: «+12\u00B0, облачно».' }
  ];

  function initReact(mount) {
    var root = el('div', 'w-widget w-react w-enter');
    root.innerHTML =
      '<div class="w-react-board">' +
        '<svg class="w-react-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
          '<path class="w-react-path" data-a="a1" d="M50 22 L50 38"/>' +
          '<path class="w-react-path dashed" data-a="a2" d="M40 54 C 26 60, 18 66, 16 76"/>' +
          '<path class="w-react-path" data-a="a3" d="M18 78 C 26 68, 36 58, 44 54"/>' +
          '<path class="w-react-path dashed" data-a="a4" d="M60 54 C 72 60, 80 66, 83 76"/>' +
        '</svg>' +
        '<button type="button" class="w-react-node n-request" data-n="request"><b>request</b><span>задача от тебя</span></button>' +
        '<button type="button" class="w-react-node n-model" data-n="model"><b>model</b><span>reasons → decides</span></button>' +
        '<button type="button" class="w-react-node n-tools" data-n="tools"><b>tools</b><span>bash · MCP · файлы</span></button>' +
        '<button type="button" class="w-react-node n-result" data-n="result"><b>result</b><span>ответ</span></button>' +
        '<span class="w-react-label l-action">action</span>' +
        '<span class="w-react-label l-observation">observation</span>' +
      '</div>' +
      '<div class="w-react-foot">' +
        '<button type="button" class="w-btn w-react-run">\u25B6 Запустить цикл</button>' +
        '<p class="w-react-detail">Модель решает: ответить сразу или вызвать инструмент.</p>' +
      '</div>';
    mount.appendChild(root);

    var nodes = {};
    root.querySelectorAll('.w-react-node').forEach(function(n) { nodes[n.dataset.n] = n; });
    var paths = {};
    root.querySelectorAll('.w-react-path').forEach(function(p) { paths[p.dataset.a] = p; });
    var detail = root.querySelector('.w-react-detail');
    var runBtn = root.querySelector('.w-react-run');

    function show(i) {
      var st = REACT_STEPS[i];
      Object.keys(nodes).forEach(function(k) { nodes[k].classList.toggle('is-live', k === st.n); });
      Object.keys(paths).forEach(function(k) { paths[k].classList.toggle('is-live', k === st.a); });
      detail.textContent = st.d;
    }
    var timer = null, idx = 0;
    runBtn.addEventListener('click', function() {
      if (timer) { clearInterval(timer); timer = null; runBtn.textContent = '\u25B6 Запустить цикл'; show(1); return; }
      runBtn.textContent = '\u25A0 Стоп';
      idx = 0; show(0);
      timer = setInterval(function() {
        idx = (idx + 1) % REACT_STEPS.length;
        show(idx);
      }, 850);
    });
    Object.keys(nodes).forEach(function(k) {
      nodes[k].addEventListener('click', function() { show(REACT_STEPS.findIndex(function(s) { return s.n === k; })); });
    });
    show(1);

    // уход со слайда — глушим цикл, чтобы интервал не тикал вхолостую
    var reactSlide = mount.closest('.slide');
    document.addEventListener('deck:change', function() {
      if (!reactSlide.classList.contains('is-active') && timer) {
        clearInterval(timer); timer = null;
        runBtn.textContent = '\u25B6 Запустить цикл';
        show(1);
      }
    });
    widgets.push({ root: root, slide: reactSlide, replay: makeReplay(root) });
  }

  /* --- Hub Harness: схема потоков среды по assets/ill-harness.png ---
     Model в центре; сверху Context Injection, слева Control, справа Action
     с пунктирным возвратом «results back to context», снизу Persist
     (writes/reads) и Observe & Verify. Рёбра — SVG-пути, координаты которых
     пересчитываются из фактических позиций карточек (offsetLeft/Top, без
     влияния transform'ов входной анимации). Анимация цикла — по идиоме
     react-виджета: кнопка «▶ Запустить цикл» + поэтапная подсветка. --- */
  var HUB_NODES = [
    { k: 'context', cls: 'p-top', n: 'Context Injection', sub: 'промпты · память · скиллы · диалог',
      ico: '<path d="M12 3v9.3m0 0L8.9 9.2M12 12.3l3.1-3.1M4.5 15.5v2A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-2"/>',
      d: 'Всё, что вливается в контекст модели: промпты, память, скиллы и история диалога. От качества этого потока зависит качество ответов.' },
    { k: 'control', cls: 'p-left', n: 'Control', sub: 'compaction · orchestration',
      ico: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9.5" cy="7" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="7.5" cy="17" r="2.1"/>',
      d: 'Управление средой: compaction сжимает историю диалога, orchestration распределяет работу по подагентам и циклам.' },
    { k: 'model', cls: 'p-core', n: 'Model', sub: 'reasons → decides',
      ico: '<rect x="6.75" y="6.75" width="10.5" height="10.5" rx="2.4"/><path d="M12 3.4v3.35M12 17.25v3.35M3.4 12h3.35M17.25 12h3.35M9.75 12h.01M12 12h.01M14.25 12h.01"/>',
      d: 'reasons → decides: мозг, который рассуждает и решает, что делать дальше. Сама по себе модель — ещё не агент; агентом её делает среда Harness.' },
    { k: 'action', cls: 'p-right', n: 'Action', sub: 'bash · tools · MCP',
      ico: '<rect x="3" y="4.75" width="18" height="14.5" rx="2.2"/><path d="M7 9.5l3.2 2.5L7 14.5M12.8 15H17"/>',
      d: 'Руки агента: вызовы bash, tools и MCP. Результат каждого вызова пунктиром возвращается в контекст.' },
    { k: 'persist', cls: 'p-bl', n: 'Persist', sub: 'файлы · git · progress',
      ico: '<ellipse cx="12" cy="5.6" rx="7.2" ry="2.6"/><path d="M4.8 5.6v12.8c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7V5.6"/><path d="M4.8 12c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7"/>',
      d: 'Состояние переживает сессию: файловая система, git, progress-файлы. Модель пишет — и читает это обратно на следующей итерации.' },
    { k: 'verify', cls: 'p-br', n: 'Observe & Verify', sub: 'скриншоты · тесты · логи',
      ico: '<path d="M2.8 12S6.2 6 12 6s9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6z"/><circle cx="12" cy="12" r="2.6"/>',
      d: 'Агент проверяет себя сам: скриншоты браузера, тесты, логи. Увиденное попадает в контекст и становится материалом для следующего решения.' }
  ];

  /* Шаг цикла: подсвечиваемый узел (n) + ребро (a) + текст панели */
  var HUB_STEPS = [
    { n: 'context', a: 'e-inject',  t: 'Context Injection', d: 'промпты, память, скиллы и история диалога вливаются в контекст модели.' },
    { n: 'model',   a: null,        t: 'Model',             d: 'reasons → decides: рассуждает над контекстом и решает, что делать дальше.' },
    { n: 'action',  a: 'e-act',     t: 'Action',            d: 'решение превращается в вызов: bash, tools или MCP.' },
    { n: 'model',   a: 'e-back',    t: 'Results back',      d: 'результат вызова возвращается в контекст — «results back to context», и цикл продолжается.' },
    { n: 'persist', a: 'e-write',   t: 'Persist · writes',  d: 'модель пишет состояние: файловая система, git, progress-файлы.' },
    { n: 'model',   a: 'e-read',    t: 'Persist · reads',   d: 'состояние читается обратно — сессия переживает перезапуск.' },
    { n: 'verify',  a: 'e-observe', t: 'Observe & Verify',  d: 'агент проверяет сам себя: скриншоты браузера, тесты, логи.' },
    { n: 'model',   a: 'e-verify',  t: 'Verify → Model',    d: 'результаты проверок возвращаются в контекст: модель видит, что сломано, и чинит.' }
  ];

  function initHub(mount) {
    var root = el('div', 'w-widget w-hub w-enter');
    var slide = mount.closest('.slide');
    var NS = 'http://www.w3.org/2000/svg';

    var board = el('div', 'w-hub-board');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'w-hub-svg');
    svg.setAttribute('aria-hidden', 'true');
    var defs = document.createElementNS(NS, 'defs');
    function hubMarker(id, live) {
      var m = document.createElementNS(NS, 'marker');
      m.setAttribute('id', id);
      m.setAttribute('viewBox', '0 0 10 10');
      m.setAttribute('refX', '8.4');
      m.setAttribute('refY', '5');
      m.setAttribute('markerWidth', '10');
      m.setAttribute('markerHeight', '10');
      m.setAttribute('orient', 'auto');
      m.setAttribute('markerUnits', 'userSpaceOnUse');
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M1.6 1.8L8.6 5l-7 3.2z');
      p.setAttribute('class', 'w-hub-mk' + (live ? ' is-live' : ''));
      m.appendChild(p);
      return m;
    }
    defs.appendChild(hubMarker('hub-arrow-idle', false));
    defs.appendChild(hubMarker('hub-arrow-live', true));
    svg.appendChild(defs);
    board.appendChild(svg);
    board.appendChild(el('span', 'w-hub-tag', 'Harness'));

    var nodes = {};
    HUB_NODES.forEach(function(h) {
      var b = el('button', 'w-hub-node ' + h.cls);
      b.type = 'button';
      b.dataset.n = h.k;
      b.innerHTML = '<span class="w-hub-ico">' + svgIcon(h.ico, null, 17) + '</span>' +
        '<span class="w-hub-txt"><b>' + h.n + '</b><span>' + h.sub + '</span></span>';
      board.appendChild(b);
      nodes[h.k] = b;
    });

    var labels = {};
    [['back', 'results back to context'], ['write', 'writes'], ['read', 'reads']].forEach(function(l) {
      var s = el('span', 'w-hub-elabel', l[1]);
      s.dataset.l = l[0];
      board.appendChild(s);
      labels[l[0]] = s;
    });

    var paths = {};
    [
      { id: 'e-inject',  dashed: false },
      { id: 'e-control', dashed: false },
      { id: 'e-act',     dashed: false },
      { id: 'e-back',    dashed: true },
      { id: 'e-write',   dashed: false },
      { id: 'e-read',    dashed: true },
      { id: 'e-observe', dashed: false },
      { id: 'e-verify',  dashed: true }
    ].forEach(function(d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'w-hub-path' + (d.dashed ? ' dashed' : ''));
      p.setAttribute('data-a', d.id);
      p.setAttribute('marker-end', 'url(#hub-arrow-idle)');
      svg.appendChild(p);
      paths[d.id] = p;
    });

    var foot = el('div', 'w-hub-foot');
    var runBtn = el('button', 'w-btn w-hub-run', '\u25B6 Запустить цикл');
    runBtn.type = 'button';
    var detail = el('p', 'w-hub-detail card');
    foot.appendChild(runBtn);
    foot.appendChild(detail);
    root.appendChild(board);
    root.appendChild(foot);
    mount.appendChild(root);
    assignStagger(root);

    /* --- Геометрия рёбер: координаты из offset-позиций карточек.
       offsetLeft/Top не зависят от transform'ов входной анимации,
       а SVG (inset:0) живёт в тех же координатах padding-box доски. --- */
    function rectOf(n) {
      return { x: n.offsetLeft, y: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight,
               cx: n.offsetLeft + n.offsetWidth / 2, cy: n.offsetTop + n.offsetHeight / 2,
               right: n.offsetLeft + n.offsetWidth, bottom: n.offsetTop + n.offsetHeight };
    }
    var EDGE_GAP = 3, ARROW_BACK = 5;
    function seg(x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      var ex = x2 - ux * ARROW_BACK, ey = y2 - uy * ARROW_BACK;
      return 'M' + (x1 + ux * EDGE_GAP).toFixed(1) + ' ' + (y1 + uy * EDGE_GAP).toFixed(1) +
             'L' + ex.toFixed(1) + ' ' + ey.toFixed(1);
    }

    function layoutEdges() {
      if (!board.clientWidth || !board.clientHeight) return;
      svg.setAttribute('viewBox', '0 0 ' + board.clientWidth + ' ' + board.clientHeight);
      var M = rectOf(nodes.model), C = rectOf(nodes.context), L = rectOf(nodes.control),
          A = rectOf(nodes.action), P = rectOf(nodes.persist), V = rectOf(nodes.verify);
      var geo = {};

      // Context Injection → Model: всегда сверху вниз
      geo['e-inject'] = seg(C.cx, C.bottom, M.cx, M.y);

      // Control → Model: сбоку на доске, сверху в компактной раскладке
      if (Math.abs(L.cy - M.cy) < L.h * 0.75) {
        geo['e-control'] = seg(L.right, L.cy, M.x, M.cy);
      } else {
        var lx = L.x + L.w * 0.62;
        geo['e-control'] = seg(lx, L.bottom, lx, M.y);
      }

      // Model ⇄ Action: сплошная туда, пунктир «results back» обратно
      var sideBySide = Math.min(M.bottom, A.bottom) - Math.max(M.y, A.y) > Math.min(M.h, A.h) * 0.5;
      var act, back;
      if (sideBySide) {
        var y1 = M.y + M.h * 0.32, y2 = A.y + A.h * 0.68;
        act = [M.right, y1, A.x, y1];
        back = [A.x, y2, M.right, y2];
      } else {
        var ax1 = A.x + A.w * 0.34, ax2 = A.x + A.w * 0.72;
        act = [ax1, M.y, ax1, A.bottom];
        back = [ax2, A.bottom, ax2, M.y];
      }
      geo['e-act'] = seg(act[0], act[1], act[2], act[3]);
      geo['e-back'] = seg(back[0], back[1], back[2], back[3]);
      // подпись возврата — на самой пунктирной линии (как writes/reads)
      labels.back.style.left = (back[0] + back[2]) / 2 + 'px';
      labels.back.style.top = (back[1] + back[3]) / 2 + 'px';

      // Persist ⇄ Model: writes вниз, reads пунктиром вверх (под моделью в обеих раскладках)
      var wx = P.x + P.w * 0.34, rx = P.x + P.w * 0.66;
      geo['e-write'] = seg(wx, M.bottom, wx, P.y);
      geo['e-read'] = seg(rx, P.y, rx, M.bottom);
      labels.write.style.left = wx + 'px';
      labels.write.style.top = (M.bottom + P.y) / 2 + 'px';
      labels.read.style.left = rx + 'px';
      labels.read.style.top = (M.bottom + P.y) / 2 + 'px';

      // Observe & Verify ⇄ Model: диагональ на доске, вертикаль в компактной раскладке
      var hOverlap = Math.min(M.right, V.right) - Math.max(M.x, V.x);
      if (hOverlap > V.w * 0.5) {
        var vx1 = V.x + V.w * 0.34, vx2 = V.x + V.w * 0.66;
        geo['e-observe'] = seg(vx1, M.bottom, vx1, V.y);
        geo['e-verify'] = seg(vx2, V.y, vx2, M.bottom);
      } else {
        geo['e-observe'] = seg(M.x + M.w * 0.7, M.bottom, V.x + V.w * 0.2, V.y);
        geo['e-verify'] = seg(M.x + M.w * 0.92, M.bottom, V.x + V.w * 0.48, V.y);
      }

      Object.keys(geo).forEach(function(k) { paths[k].setAttribute('d', geo[k]); });
    }

    function relayout() { requestAnimationFrame(layoutEdges); }
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(layoutEdges);
      ro.observe(board);
    } else {
      window.addEventListener('resize', layoutEdges);
    }
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(layoutEdges).catch(function() {});
    }
    setTimeout(layoutEdges, 350);
    layoutEdges();

    /* --- Состояние: клик по узлу / запуск цикла (идиома react-виджета) --- */
    function showNode(k) {
      Object.keys(nodes).forEach(function(n) { nodes[n].classList.toggle('is-on', n === k); });
      Object.keys(paths).forEach(function(p) {
        paths[p].classList.remove('is-live');
        paths[p].setAttribute('marker-end', 'url(#hub-arrow-idle)');
      });
      var h = HUB_NODES.find(function(x) { return x.k === k; });
      detail.innerHTML = '<b>' + h.n + '.</b> ' + h.d;
    }
    function showStep(i) {
      var st = HUB_STEPS[i];
      Object.keys(nodes).forEach(function(n) { nodes[n].classList.toggle('is-on', n === st.n); });
      Object.keys(paths).forEach(function(p) {
        var on = p === st.a;
        paths[p].classList.toggle('is-live', on);
        paths[p].setAttribute('marker-end', on ? 'url(#hub-arrow-live)' : 'url(#hub-arrow-idle)');
      });
      detail.innerHTML = '<b>' + st.t + '.</b> ' + st.d;
    }
    var timer = null, idx = 0;
    function halt() {
      if (timer) { clearInterval(timer); timer = null; }
      runBtn.textContent = '\u25B6 Запустить цикл';
    }
    runBtn.addEventListener('click', function() {
      if (timer) { halt(); showNode('model'); return; }
      runBtn.textContent = '\u25A0 Стоп';
      idx = 0;
      showStep(0);
      timer = setInterval(function() {
        idx = (idx + 1) % HUB_STEPS.length;
        showStep(idx);
      }, 850);
    });
    Object.keys(nodes).forEach(function(k) {
      nodes[k].addEventListener('click', function() { halt(); showNode(k); });
    });
    document.addEventListener('deck:change', function() {
      if (!slide.classList.contains('is-active')) { halt(); showNode('model'); }
    });
    showNode('model');

    widgets.push({ root: root, slide: slide, replay: function() { makeReplay(root)(); relayout(); } });
  }

  /* ---------- Сценарии чата ---------- */

  // Диалог из статьи (общими словами): 3 запроса — создание Poster Studio
  var ARTICLE_CHAT = [
    { role: 'agent', text: 'Привет! Я ZCode. Опиши задачу — соберу приложение. Совет из практики: дели промпт на функциональность, дизайн и ограничения.', delay: 150 },
    { role: 'user', text: 'Создай Poster Studio — редактор постеров: заголовок, подзаголовок, дата, место. Живой превью справа, экспорт PNG 1080×1350. Один index.html, без библиотек, Canvas API.', delay: 300 },
    { role: 'agent', files: ['index.html'] },
    { role: 'agent', text: 'Готово — редактор открывается двойным кликом по файлу. Улучшаем?', delay: 200 },
    { role: 'user', text: 'Добавь три стиля (Minimal / Dark / Gradient), выбор акцентного цвета и ползунок размера заголовка. Текст при смене стиля сохраняй.', delay: 300 },
    { role: 'agent', files: ['index.html (updated)'] },
    { role: 'user', text: 'Проверь сценарии и почини ошибки. Ничего не добавляй.', delay: 300 },
    { role: 'agent', text: '✅ Превью обновляется при вводе\n✅ Три стиля переключаются\n✅ Цвет и ползунок применяются\n✅ Длинный заголовок переносится\n✅ PNG 1080×1350 скачивается', delay: 300 },
    { role: 'agent', text: 'Нашёл и починил 2 бага. Poster Studio готов — дальше покажу его вживую.', delay: 250 }
  ];

  // Наша реальная сессия: как собирали эту презентацию
  var META_CHAT = [
    { role: 'agent', text: 'Привет! Я ZCode. Чем займёмся?', delay: 150 },
    { role: 'user', text: 'Сделай интерактивную презентацию в стиле Apple Keynote по статье Хабра «Вайбкодинг для самых маленьких». 60 FPS, пружинные анимации, живой интерактив.', delay: 300 },
    { role: 'agent', text: 'Ставлю скиллы: ponytail, emilkowalski (animate, apple-design), frontend-design, motion-principles…', delay: 250 },
    { role: 'agent', text: 'Статья распарсена — контент на 10 слайдов со заметками спикера.', delay: 200 },
    { role: 'agent', files: ['content/slides.json'] },
    { role: 'agent', text: 'Запускаю 3 подагента параллельно: контент-архитектор · арт-директор · инженер виджетов.', delay: 250 },
    { role: 'agent', files: ['css/tokens.css', 'js/deck.js', 'js/widgets.js'] },
    { role: 'user', text: 'Переходы между слайдами дёргаются.', delay: 300 },
    { role: 'agent', text: 'Чиню: глобальный stagger → per-widget, убрал blur в переходе, добавил затухание колеса. 60 FPS вернулись.', delay: 250 },
    { role: 'user', text: 'Хочу чат с агентом внутри презентации и живой Poster Studio.', delay: 300 },
    { role: 'agent', text: 'Готово: этот чат + Poster Studio в iframe. 24 слайда, 0 ошибок в консоли — QA в браузере пройден.', delay: 250 }
  ];

  /* ============================================================
     ВИДЖЕТ: Vibe-Coding Chat Simulator
     Два экземпляра на деке (слайды 15 и 19) — поэтому никаких id:
     все запросы скоупятся на root. Авто-сценарий стартует, когда
     слайд чата становится активным (deck:ready / deck:change),
     при уходе со слайда таймеры гасятся, при возврате — сценарий
     переигрывается (если зритель ещё ничего не написал сам).
     ============================================================ */
  function initChatSimulator(mount) {
    var root = el('div', 'w-widget w-chat w-enter');

    // Сценарий чата: заготовленные ответы агента
    var chatScript = mount.dataset.chat === 'meta' ? META_CHAT : ARTICLE_CHAT;
    var baseSuggestions = mount.dataset.chat === 'meta'
      ? ['Сделай ещё раздел с квизом', 'Добавь светлую тему', 'Прогони QA в браузере', 'Собери PDF-версию']
      : [
        'Создай Poster Studio — редактор афиш 1080×1350',
        'Добавь 3 стиля: Minimal, Dark, Gradient',
        'Проверь сценарии и почини баги',
        'Сделай мобильную версию адаптивной'
      ];

    var messageIndex = 0;
    var isPlaying = false;
    var userUsed = false; // зритель уже написал своё — сценарий больше не перезапускаем
    var suggestions = baseSuggestions.slice();
    var timers = [];

    root.innerHTML =
      '<div class="w-chat-header">' +
        '<div class="w-chat-title">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M4.5 4.5l2.1 2.1M17.4 17.4l2.1 2.1M4.5 19.5L6.6 17.4M17.4 6.6L19.5 4.5"/></svg>' +
          'Vibe-Coding Session' +
        '</div>' +
        '<div class="w-chat-status"><span class="w-status-dot"></span>ZCode (GLM-5.3-Flash) · ready</div>' +
      '</div>' +
      '<div class="w-chat-messages"></div>' +
      '<div class="w-chat-suggestions" hidden></div>' +
      '<div class="w-chat-input-area">' +
        '<div class="w-chat-input-wrap">' +
          '<input type="text" class="w-chat-input" placeholder="Напиши задачу агенту…" disabled>' +
          '<button class="w-chat-send" type="button" aria-label="Отправить" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<p class="w-chat-hint">Enter — отправить · Попробуй: «Создай Poster Studio…», «Добавь стили», «Проверь и почини»</p>';

    mount.appendChild(root);

    var messagesEl = root.querySelector('.w-chat-messages');
    var inputEl = root.querySelector('.w-chat-input');
    var sendBtn = root.querySelector('.w-chat-send');
    var suggestionsEl = root.querySelector('.w-chat-suggestions');
    var chatSlide = mount.closest('.slide');

    function slideActive() {
      return !!(chatSlide && chatSlide.classList.contains('is-active'));
    }

    function focusInput() {
      if (slideActive()) inputEl.focus();
    }

    function clearTimers() {
      timers.forEach(function(t) { clearTimeout(t); });
      timers = [];
    }

    function later(fn, ms) {
      var t = setTimeout(fn, ms);
      timers.push(t);
      return t;
    }

    function renderSuggestions() {
      suggestionsEl.innerHTML = suggestions.map(function(s) {
        return '<button type="button" class="w-suggestion" data-text="' + s.replace(/"/g, '&quot;') + '">' + s + '</button>';
      }).join('');
      suggestionsEl.querySelectorAll('.w-suggestion').forEach(function(btn) {
        btn.onclick = function() {
          inputEl.value = btn.dataset.text;
          sendMessage();
        };
      });
      suggestionsEl.hidden = suggestions.length === 0;
    }

    function addMessage(role, text, files) {
      var msg = document.createElement('div');
      msg.className = 'w-msg ' + role;

      var avatar = document.createElement('div');
      avatar.className = 'w-msg-avatar ' + role;
      avatar.textContent = role === 'agent' ? 'AI' : 'You';

      var content = document.createElement('div');
      content.className = 'w-msg-content';

      var header = document.createElement('div');
      header.className = 'w-msg-header';
      header.innerHTML = '<span>' + (role === 'agent' ? 'ZCode' : 'You') + '</span><span>·</span><span>just now</span>';
      content.appendChild(header);

      if (text) {
        var textEl = document.createElement('div');
        textEl.className = 'w-msg-text';
        textEl.textContent = text;
        content.appendChild(textEl);
      }

      if (files && files.length) {
        files.forEach(function(f) {
          var fileEl = document.createElement('div');
          fileEl.className = 'w-msg-file';
          fileEl.innerHTML =
            '<svg class="w-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>' +
            '<div class="w-file-info"><div class="w-file-name">' + f + '</div><div class="w-file-size">generated</div></div>';
          content.appendChild(fileEl);
        });
      }

      msg.appendChild(avatar);
      msg.appendChild(content);
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      var typing = document.createElement('div');
      typing.className = 'w-msg agent w-msg--typing';
      typing.innerHTML =
        '<div class="w-msg-avatar agent">AI</div>' +
        '<div class="w-msg-typing"><div class="w-typing-dot"></div><div class="w-typing-dot"></div><div class="w-typing-dot"></div></div>';
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      var typing = messagesEl.querySelector('.w-msg--typing');
      if (typing) typing.remove();
    }

    function resetChat() {
      clearTimers();
      isPlaying = false;
      hideTyping();
      messagesEl.innerHTML = '';
      messageIndex = 0;
      suggestions = baseSuggestions.slice();
      inputEl.value = '';
      inputEl.disabled = true;
      sendBtn.disabled = true;
      renderSuggestions();
    }

    function startScript() {
      clearTimers();
      later(playScript, 500);
    }

    /* Синхронизация со слайдом: активный — играем сценарий,
       неактивный — глушим таймеры (сценарий не тикает вхолостую) */
    function syncWithSlide() {
      if (!slideActive()) {
        clearTimers();
        isPlaying = false;
        hideTyping();
        return;
      }
      clearTimers();
      isPlaying = false;
      hideTyping();
      if (userUsed) {
        inputEl.disabled = false;
        sendBtn.disabled = false;
      } else {
        resetChat();
        startScript();
      }
    }
    document.addEventListener('deck:ready', syncWithSlide);
    document.addEventListener('deck:change', syncWithSlide);

    function playScript() {
      if (messageIndex >= chatScript.length) {
        enableUserInput();
        return;
      }

      isPlaying = true;
      var step = chatScript[messageIndex];

      if (step.delay) {
        later(function() {
          executeStep(step);
        }, step.delay);
      } else {
        executeStep(step);
      }
    }

    function executeStep(step) {
      hideTyping();

      if (step.role === 'agent') {
        showTyping();
        later(function() {
          hideTyping();
          addMessage('agent', step.text, step.files);
          messageIndex++;
          playScript();
        }, step.text ? 400 + Math.min(step.text.length * 6, 900) : 200);
      } else {
        // сообщение пользователя показываем сразу, без «печатает»
        addMessage('user', step.text);
        messageIndex++;
        playScript();
      }
    }

    function enableUserInput() {
      isPlaying = false;
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.placeholder = 'Напиши задачу агенту…';
      renderSuggestions();
      focusInput();
    }

    function sendMessage() {
      var text = inputEl.value.trim();
      if (!text || isPlaying) return;

      userUsed = true;
      addMessage('user', text);
      inputEl.value = '';
      suggestions = [];
      renderSuggestions();

      // Эмуляция ответа агента
      isPlaying = true;
      inputEl.disabled = true;
      sendBtn.disabled = true;

      var responses = [
        'Понял. Пишу код...',
        'Файл готов. Хочешь что-то изменить?',
        'Проверяю... Всё работает. Что дальше?'
      ];

      showTyping();
      later(function() {
        hideTyping();
        addMessage('agent', responses[Math.floor(Math.random() * responses.length)]);
        isPlaying = false;
        inputEl.disabled = false;
        sendBtn.disabled = false;
        focusInput();
      }, 1500);
    }

    // Event listeners
    sendBtn.onclick = sendMessage;
    inputEl.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    assignStagger(root);

    // страховка: ленивый init на уже активном слайде — стартуем сразу
    // (при обычной загрузке слайд ещё не активен, старт придёт с deck:ready)
    if (slideActive()) startScript();

    widgets.push({
      root: root,
      slide: chatSlide,
      replay: function() {
        makeReplay(root)();
      }
    });
  }

  /* ============================================================
     НОВЫЕ ВИДЖЕТЫ — словарь, LLM vs агент, контекст, пирог,
     конфигуратор задач, копирование скиллов
     ============================================================ */

  /* --- Словарь: три круга --- */
  function initVocab(mount) {
    var root = el('div', 'w-widget w-vocab w-enter');
    root.innerHTML =
      '<div class="w-vocab-rings">' +
        '<button type="button" class="w-ring w-ring--ai" data-k="ai"><span>ИИ</span></button>' +
        '<button type="button" class="w-ring w-ring--gen" data-k="gen"><span>GenAI</span></button>' +
        '<button type="button" class="w-ring w-ring--llm" data-k="llm"><span>LLM</span></button>' +
      '</div>' +
      '<div class="w-vocab-cards">' +
        '<div class="card w-vocab-card" data-k="ai"><h3>Искусственный интеллект</h3><p>Вся область: от классических скоринговых моделей до современных</p></div>' +
        '<div class="card w-vocab-card" data-k="gen"><h3>Generative AI</h3><p>Направление, создающее контент: текст, изображения, видео, аудио</p></div>' +
        '<div class="card w-vocab-card" data-k="llm"><h3>Large Language Model</h3><p>Модели, обученные на текстах: GPT, Claude, Gemini, Qwen. Работаем с ней</p></div>' +
      '</div>';
    mount.appendChild(root);
    var cards = root.querySelectorAll('.w-vocab-card');
    root.querySelectorAll('.w-ring').forEach(function(ring) {
      ring.addEventListener('click', function() {
        cards.forEach(function(c) { c.classList.toggle('is-hi', c.dataset.k === ring.dataset.k); });
      });
    });
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Голая LLM vs агент --- */
  function initAnatomy(mount) {
    var root = el('div', 'w-widget w-anatomy w-enter');
    var grid = el('div', 'w-ana-grid');

    var left = el('div', 'w-ana-card is-raw');
    left.innerHTML =
      '<span class="w-ana-tag">Голая LLM</span>' +
      '<p class="w-ana-q">«Какая сегодня погода в Москве?»</p>' +
      '<p class="w-ana-a">Думаю, +18°C и солнечно ☀ — прекрасный день!</p>' +
      '<span class="w-ana-badge is-bad">Галлюцинация: знает мир на дату обучения, не «сегодня»</span>';

    var right = el('div', 'w-ana-card is-agent');
    right.innerHTML =
      '<span class="w-ana-tag">Агент в Harness</span>' +
      '<p class="w-ana-q">«Какая сегодня погода в Москве?»</p>' +
      '<div class="w-ana-steps">' +
        '<code>Reason: нужна актуальная погода</code>' +
        '<code>Act: вызов get_weather("Москва")</code>' +
        '<code>Observe: 4°C, дождь</code>' +
      '</div>' +
      '<span class="w-ana-badge is-ok">Проверено инструментом — не выдумка</span>';

    grid.appendChild(left); grid.appendChild(right);
    root.appendChild(grid);
    mount.appendChild(root);
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Контекст-метр --- */
  function initContext(mount) {
    var root = el('div', 'w-widget w-context w-enter');
    root.innerHTML =
      '<div class="w-ctx-row">' +
        '<div class="w-ctx-meter" role="img" aria-label="Заполнение контекстного окна">' +
          '<div class="w-ctx-seg w-ctx-sys"><span>System</span></div>' +
          '<div class="w-ctx-seg w-ctx-dialog"><span>Диалог</span></div>' +
          '<div class="w-ctx-seg w-ctx-files"><span>Файлы</span></div>' +
          '<div class="w-ctx-seg w-ctx-tools"><span>Tools</span></div>' +
          '<div class="w-ctx-redzone"><span>кончилось — качество падает</span></div>' +
        '</div>' +
        '<div class="w-ctx-side">' +
          '<p class="w-ctx-fact"><b>1 токен ≈ 3–4 символа</b> текста</p>' +
          '<p class="w-ctx-fact">В контекст попадает <b>больше, чем ты видишь</b>: системный промпт и результаты инструментов тоже тратят окно</p>' +
          '<p class="w-ctx-total">Заполнено: <span class="w-ctx-num">0%</span></p>' +
        '</div>' +
      '</div>' +
      '<div class="w-ctx-controls">' +
        '<span class="w-slider-label">Короткая задача</span>' +
        '<input type="range" min="0" max="100" value="15" aria-label="Сколько материала даём агенту">' +
        '<span class="w-slider-label">Вся переписка и файлы</span>' +
        '<button type="button" class="w-btn w-ctx-compact">Сжать историю</button>' +
      '</div>' +
      '<p class="w-ctx-note" hidden>Часть деталей потерялась при сжатии — статья советует не полагаться на него полностью</p>';
    mount.appendChild(root);

    var segs = {
      sys: root.querySelector('.w-ctx-sys'),
      dialog: root.querySelector('.w-ctx-dialog'),
      files: root.querySelector('.w-ctx-files'),
      tools: root.querySelector('.w-ctx-tools')
    };
    var num = root.querySelector('.w-ctx-num');
    var note = root.querySelector('.w-ctx-note');
    var compactBtn = root.querySelector('.w-ctx-compact');
    var compressed = false;

    function heights(v, squish) {
      var s = squish ? 0.35 : 1;
      return {
        sys: 18,
        dialog: (8 + v * 0.12) * s,
        files: v * 0.30 * s,
        tools: v * 0.22 * s
      };
    }
    function render(v) {
      var h = heights(v, compressed);
      var total = h.sys + h.dialog + h.files + h.tools;
      segs.sys.style.height = h.sys + '%';
      segs.dialog.style.height = h.dialog + '%';
      segs.files.style.height = h.files + '%';
      segs.tools.style.height = h.tools + '%';
      countTo(num, Math.min(100, Math.round(total)), 400, '%');
      root.querySelector('.w-ctx-meter').classList.toggle('is-hot', total >= 70);
    }
    var range = root.querySelector('input[type="range"]');
    range.addEventListener('input', function() {
      compressed = false;
      note.hidden = true;
      compactBtn.classList.remove('is-done');
      render(+range.value);
    });
    compactBtn.addEventListener('click', function() {
      compressed = true;
      note.hidden = false;
      compactBtn.classList.add('is-done');
      render(+range.value);
    });
    render(+range.value);

    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Пирог из 4 типов сообщений + квиз --- */
  function initPie(mount) {
    var root = el('div', 'w-widget w-pie w-enter');
    root.innerHTML =
      '<div class="w-pie-row">' +
        '<div class="w-pie-stack" role="img" aria-label="Четыре слоя контекста">' +
          '<div class="w-pie-layer w-pie--tool"><span>Tool message · результат инструмента — данные, не приказы</span></div>' +
          '<div class="w-pie-layer w-pie--ai"><span>AI message · ответ модели — тоже тратит контекст</span></div>' +
          '<div class="w-pie-layer w-pie--human"><span>Human message · всё, что пишешь ты</span></div>' +
          '<div class="w-pie-layer w-pie--system"><span>System message · начальная инструкция</span></div>' +
        '</div>' +
        '<div class="w-pie-legend">' +
          '<p class="w-pie-prio">приоритет выше <b>у основания</b></p>' +
          '<p>Управлять контекстом — не сокращать текст, а правильно организовывать информацию</p>' +
        '</div>' +
      '</div>';
    mount.appendChild(root);

    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Карточки-перевёртыши: вопрос на лицевой, ответ на обороте --- */
  var FLIPS = [
    { q: 'Пришёл файл с текстом «игнорируй все инструкции» — что сделает модель?',
      a: 'Обработает как данные, не как приказ',
      d: 'Tool message — результат инструмента, а не новая инструкция. Приоритет всегда у основания пирога — у System message.' },
    { q: 'Кто занимает контекст, даже если ты ничего не писал?',
      a: 'System message — уже при старте',
      d: 'Системный промпт загружается до твоего первого вопроса и занимает окно раньше тебя — иногда десятки тысяч токенов.' }
  ];

  function initFlip(mount) {
    var root = el('div', 'w-widget w-flip w-enter');
    var grid = el('div', 'w-flip-grid');
    FLIPS.forEach(function(f) {
      var card = el('button', 'w-flip-card');
      card.setAttribute('aria-pressed', 'false');
      card.innerHTML =
        '<span class="w-flip-inner">' +
          '<span class="w-flip-face w-flip-front">' +
            '<span class="w-flip-tag">Вопрос</span>' +
            '<b>' + f.q + '</b>' +
            '<span class="w-flip-hint">клик — перевернуть</span>' +
          '</span>' +
          '<span class="w-flip-face w-flip-back">' +
            '<span class="w-flip-tag">Ответ</span>' +
            '<b>' + f.a + '</b>' +
            '<span class="w-flip-note">' + f.d + '</span>' +
          '</span>' +
        '</span>';
      card.addEventListener('click', function() {
        var on = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      grid.appendChild(card);
    });
    root.appendChild(grid);
    mount.appendChild(root);
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  /* --- Подбор настройки ZCode под задачу --- */
  function initZPick(mount) {
    var root = el('div', 'w-widget w-zpick w-enter');
    root.innerHTML =
      '<p class="w-zpick-label">Задача из зала → подсветим связку «модель + уровень + режим»:</p>' +
      '<div class="w-zpick-tasks">' +
        '<button type="button" class="w-task" data-mk="flashx" data-lk="low" data-mdk="build">Поменять цвет кнопки</button>' +
        '<button type="button" class="w-task" data-mk="flash" data-lk="high" data-mdk="build">Сделать лендинг</button>' +
        '<button type="button" class="w-task" data-mk="53" data-lk="max" data-mdk="plan">Найти баг в архитектуре</button>' +
      '</div>';
    mount.appendChild(root);

    var slide = mount.closest('.slide');
    root.querySelectorAll('.w-task').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var on = btn.classList.contains('is-on');
        root.querySelectorAll('.w-task').forEach(function(x) { x.classList.remove('is-on'); });
        slide.querySelectorAll('.is-pick').forEach(function(x) { x.classList.remove('is-pick'); });
        if (on) return; // повторный клик по той же задаче снимает подсветку
        btn.classList.add('is-on');
        [['data-mk', '.ref-model'], ['data-lk', '.lv-chip'], ['data-mdk', '.md-chip']].forEach(function(pair) {
          var key = btn.getAttribute(pair[0]);
          var target = slide.querySelector(pair[1] + '[' + pair[0] + '="' + key + '"]');
          if (target) target.classList.add('is-pick');
        });
      });
    });
    widgets.push({ root: root, slide: slide, replay: makeReplay(root) });
  }

  /* --- Клик по скиллу = копирование команды --- */
  function initSkillsCopy(mount) {
    mount.querySelectorAll('[data-cmd]').forEach(function(card) {
      // защита от повторной привязки: initAll вызывается при каждом deck:change
      if (card.dataset.copyBound) return;
      card.dataset.copyBound = '1';
      card.classList.add('copyable');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      function copyCmd() {
        var cmd = card.getAttribute('data-cmd');
        function toast(ok) {
          var t = el('div', 'w-toast', ok ? 'Скопировано: ' + cmd : cmd);
          document.body.appendChild(t);
          requestAnimationFrame(function() { t.classList.add('is-on'); });
          setTimeout(function() {
            t.classList.remove('is-on');
            setTimeout(function() { t.remove(); }, 300);
          }, 2200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd).then(function() { toast(true); }, function() { toast(false); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = cmd;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); toast(true); } catch (e) { toast(false); }
          ta.remove();
        }
      }
      card.addEventListener('click', copyCmd);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          copyCmd();
        }
      });
    });
  }

  /* --- Агенты из статьи: Codex, Claude Code, Cursor, OpenCode, Hermes --- */
  var AGENTS_DATA = [
    { name: 'Codex', vendor: 'OpenAI', scene: 'Просто начать', speed: 4, control: 3,
      desc: 'Агентная среда от создателей ChatGPT. Приложение, IDE-расширение и CLI: сам пишет код, ставит библиотеки, запускает и чинит приложение.' },
    { name: 'Claude Code', vendor: 'Anthropic', scene: 'Просто начать', speed: 4, control: 3,
      desc: 'Прямой конкурент Codex. Терминал, приложение, IDE и браузер. Глубокая интеграция с семейством моделей Claude.' },
    { name: 'Cursor', vendor: 'Редактор', scene: 'Работа в редакторе', speed: 3, control: 5,
      desc: 'Редактор кода со встроенным агентом. Максимум ручного участия: видишь проект и правишь код параллельно с агентом. Модели OpenAI, Anthropic, Google.' },
    { name: 'OpenCode', vendor: 'Open source', scene: 'Свобода моделей', speed: 3, control: 4,
      desc: 'Открытый исходный код: любой провайдер моделей, своя оплата, даже локальные модели.' },
    { name: 'Hermes Agent', vendor: 'Универсал', scene: 'Не только код', speed: 3, control: 3,
      desc: 'Агент не только для кода: Telegram, поиск, файлы, регулярные задачи. Долговременная память.' }
  ];
  var AGENT_FILTERS = ['Все', 'Просто начать', 'Работа в редакторе', 'Свобода моделей', 'Не только код'];

  function initAgents(mount) {
    var root = el('div', 'w-widget w-agents w-enter');
    var bar = el('div', 'w-tools-bar');
    var chips = el('div', 'w-chips');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Фильтр по сценарию');
    AGENT_FILTERS.forEach(function(f, i) {
      var c = el('button', 'w-chip' + (i === 0 ? ' is-on' : ''), f);
      c.type = 'button';
      c.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      c.addEventListener('click', function() {
        chips.querySelectorAll('.w-chip').forEach(function(x) {
          var on = x === c;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach(function(x) { x.classList.toggle('is-hidden', f !== 'Все' && x.dataset.scene !== f); });
      });
      chips.appendChild(c);
    });

    var slider = el('div', 'w-slider');
    slider.innerHTML = '<span class="w-slider-label">Скорость</span>' +
      '<input type="range" min="0" max="100" value="50" aria-label="Скорость или контроль">' +
      '<span class="w-slider-label">Контроль</span>';
    bar.appendChild(chips); bar.appendChild(slider);

    var grid = el('div', 'w-tools-grid');
    var cards = AGENTS_DATA.map(function(t) {
      var card = el('button', 'w-tool-card');
      card.dataset.scene = t.scene;
      card.setAttribute('aria-expanded', 'false');

      var head = el('div', 'w-tool-head');
      head.appendChild(el('span', 'w-tool-name', t.name));
      head.appendChild(el('span', 'w-tool-vendor', t.vendor));

      function dotsRow(name, value) {
        var row = el('div', 'w-tool-dots');
        row.appendChild(el('span', 'w-tool-dots-name', name));
        for (var d = 1; d <= 5; d++) row.appendChild(el('span', 'w-dot' + (d <= value ? ' is-on' : '')));
        return row;
      }

      var detail = el('div', 'w-tool-detail');
      detail.appendChild(el('div', 'w-tool-detail-inner')).appendChild(el('p', null, t.desc));

      card.innerHTML = '<div class="w-badge">' + svgIcon(ICONS.check) + ' Подходит</div>';
      card.appendChild(head);
      card.appendChild(el('p', 'w-tool-thesis', t.desc));
      var metrics = el('div', 'w-tool-metrics');
      metrics.appendChild(dotsRow('скорость', t.speed));
      metrics.appendChild(dotsRow('контроль', t.control));
      card.appendChild(metrics);
      card.appendChild(detail);

      card.addEventListener('click', function() {
        var wasOpen = card.classList.contains('is-open');
        cards.forEach(function(c) { c.classList.remove('is-open'); c.setAttribute('aria-expanded', 'false'); });
        if (!wasOpen) { card.classList.add('is-open'); card.setAttribute('aria-expanded', 'true'); }
      });
      grid.appendChild(card);
      return card;
    });

    function updateBestAgents(v) {
      var best = -1, maxS = -Infinity;
      AGENTS_DATA.forEach(function(t, i) {
        var s = 1 - Math.abs(((t.speed - 1) / 4) - (1 - v)) - Math.abs(((t.control - 1) / 4) - v);
        if (s > maxS) { maxS = s; best = i; }
      });
      cards.forEach(function(c, i) { c.classList.toggle('is-best', i === best); });
    }
    slider.querySelector('input').addEventListener('input', function(e) {
      updateBestAgents(e.target.value / 100);
    });
    updateBestAgents(0.5); // подсветка «лучшей» карточки сразу, без ожидания ввода

    root.appendChild(bar); root.appendChild(grid);
    mount.appendChild(root);
    assignStagger(root);
    widgets.push({ root: root, slide: mount.closest('.slide'), replay: makeReplay(root) });
  }

  function initAll() {
    // Initialize widgets for existing mount points (idempotent)
    var mounts = [
      ['sandbox', initSandbox, '.w-sandbox'],
      ['tools', initTools, '.w-tools'],
      ['pulse', initPulse, '.w-pulse'],
      ['chat', initChatSimulator, '.w-chat'],
      ['vocab', initVocab, '.w-vocab'],
      ['anatomy', initAnatomy, '.w-anatomy'],
      ['context', initContext, '.w-context'],
      ['pie', initPie, '.w-pie'],
      ['flip', initFlip, '.w-flip'],
      ['zpick', initZPick, '.w-zpick'],
      ['funnel', initFunnel, '.w-funnel'],
      ['context40', initContext40, '.w-context40'],
      ['pipeline', initPipeline, '.w-pipeline'],
      ['react', initReact, '.w-react'],
      ['hub', initHub, '.w-hub'],
      ['agents', initAgents, '.w-agents'],
    ];
    mounts.forEach(function(m) {
      var node = document.querySelector('[data-widget="' + m[0] + '"]');
      try {
        if (node && !node.querySelector(m[2])) m[1](node);
      } catch (e) {
          }
    });
    var skills = document.querySelector('[data-widget="skillcopy"]');
    if (skills) initSkillsCopy(skills);

    // Presenter/Laser/Reactions only once
    if (!document.querySelector('.w-presenter')) initPresenter();
    if (!document.querySelector('.w-laser')) initLaser();
    if (!document.querySelector('.w-reactions')) initReactions();

    // Первый показ: если страница открыта сразу на слайде с виджетом
    // (hash #/N или F5 на слайде), deck:change не срабатывает — монтируем
    // недостающие виджеты активного слайда и даём вход вручную.
    // Без ленивого монтирования второй чат (слайд 19) на диплинке оставался
    // пустым: document.querySelector находит только первый [data-widget=chat].
    var bootAct = document.querySelector('.slide.is-active');
    if (bootAct) {
      mounts.forEach(function(m) {
        var node = bootAct.querySelector('[data-widget="' + m[0] + '"]');
        if (node && !node.querySelector(m[2])) m[1](node);
      });
      var bootSkills = bootAct.querySelector('[data-widget="skillcopy"]');
      if (bootSkills) initSkillsCopy(bootSkills);
      widgets.forEach(function(w) { if (w.slide === bootAct) w.replay(); });
    }

    // deck:change-обработчик регистрируем один раз: initAll вызывается
    // и inline-скриптом в index.html, и на DOMContentLoaded
    if (!inited) {
      inited = true;
      document.addEventListener('deck:change', function(e) {
        var act = document.querySelector('.slide.is-active');
        if (act) {
          // lazy-init: сначала монтируем недостающие виджеты активного слайда
          mounts.forEach(function(m) {
            var node = act.querySelector('[data-widget="' + m[0] + '"]');
            if (node && !node.querySelector(m[2])) m[1](node);
          });
          var sk = act.querySelector('[data-widget="skillcopy"]');
          if (sk) initSkillsCopy(sk);
        }
        // затем переигрываем вход всем виджетам активного слайда
        widgets.forEach(function(w) { if (w.slide === act) w.replay(); });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
  window.VibeWidgets = { initAll: initAll };
})();
