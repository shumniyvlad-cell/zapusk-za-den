(function () {
  'use strict';

  // Настройки набора. left — сколько мест осталось из total: меняется здесь руками.
  var CONFIG = {
    telegram: 'marchvlvv',
    total: 5,
    left: 5,
    text: {
      any: 'Привет! Хочу «Запуск за день». Расскажи, как занять место.',
      self: 'Привет! Хочу «Запуск за день», вариант «Голосовым».',
      vlad: 'Привет! Хочу «Запуск за день», вариант «Созвоном».'
    }
  };

  var KEY = 'den.torn';
  var WORDS = { 0: 'Мест нет', 1: 'Осталось одно место', 2: 'Осталось два места', 3: 'Осталось три места', 4: 'Осталось четыре места' };

  function link(plan) {
    var t = CONFIG.text[plan] || CONFIG.text.any;
    return 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(t);
  }

  function mine() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* без хранилища страница работает так же */ }
  }

  var left = Math.max(0, Math.min(CONFIG.total, CONFIG.left));

  function seatsText() {
    if (left >= CONFIG.total) return null;
    if (left === 0) return 'Мест в этом наборе нет. Напиши, поставлю в следующий.';
    return WORDS[left] + '. Оторви корешок, чтобы занять.';
  }

  function stub() {
    var s = document.createElement('span');
    s.className = 'tab-stub';
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  function buildTabs(box) {
    var plan = box.getAttribute('data-plan') || 'any';
    var gone = CONFIG.total - left;
    for (var i = 0; i < CONFIG.total; i++) {
      // оторванные корешки стоят вразбивку, как на настоящем объявлении
      var order = [3, 0, 4, 1, 2];
      if (order.indexOf(i) < gone) { box.appendChild(stub()); continue; }
      var a = document.createElement('a');
      a.className = 'tab';
      a.href = link(plan);
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Занять место: написать Владу в Telegram');
      var b = document.createElement('b');
      b.appendChild(document.createTextNode('Запуск за день'));
      var sm = document.createElement('small');
      sm.textContent = '@' + CONFIG.telegram;
      b.appendChild(sm);
      a.appendChild(b);
      a.addEventListener('click', tear);
      box.appendChild(a);
    }
  }

  function tear(e) {
    var a = e.currentTarget;
    if (a.classList.contains('fall') || a.classList.contains('torn')) return;
    remember();
    a.classList.add('fall');
    var done = function () {
      a.classList.remove('fall');
      a.classList.add('torn');
      var s = stub();
      a.parentNode.insertBefore(s, a);
      s.appendChild(a);
    };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) done(); else setTimeout(done, 720);
    // ссылка открывается сама: это обычный <a target="_blank">
  }

  var boxes = document.querySelectorAll('[data-tabs]');
  for (var i = 0; i < boxes.length; i++) buildTabs(boxes[i]);

  var st = seatsText();
  if (st) {
    var spans = document.querySelectorAll('[data-left-text]');
    for (var j = 0; j < spans.length; j++) spans[j].textContent = st;
  }

  var strips = document.querySelectorAll('a.strip[data-plan]');
  for (var k = 0; k < strips.length; k++) strips[k].href = link(strips[k].getAttribute('data-plan'));

  // для проверки без клика
  window.DEN = { config: CONFIG, link: link, mine: mine };
})();
