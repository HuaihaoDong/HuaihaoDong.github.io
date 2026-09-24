/* ==========================================================================
   tiger.js —— 宠物老虎彩蛋：点哪跑哪 / 待机循环 / 方向翻转 / 点击互动
   形象为 SVG 手绘占位（Q 版橙虎），后续可替换为精修 sprite sheet
   ========================================================================== */
(function () {
  // 注入老虎专属动作样式
  var style = document.createElement('style');
  style.textContent = [
    '.tiger-body { transition: transform .3s ease; transform-origin: 50% 100%; }',
    '.tiger-body.idle { animation: tg-sway 2.4s ease-in-out infinite; }',
    '.tiger-body.sit { animation: tg-sway 3.2s ease-in-out infinite; }',
    '.tiger-body.run { animation: tg-bob .28s ease-in-out infinite; }',
    '.tiger-body.sleep { transform: scaleY(.82) rotate(6deg); animation: none; }',
    '.tiger-body.flip { animation: tg-flip .6s ease; }',
    '@keyframes tg-sway { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-3deg)} }',
    '@keyframes tg-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }',
    '@keyframes tg-flip { 0%{transform:rotate(0)} 50%{transform:rotate(180deg) scaleY(.9)} 100%{transform:rotate(360deg)} }'
  ].join('\n');
  document.head.appendChild(style);

  // 注入老虎 DOM
  var svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="32" cy="44" rx="21" ry="17" fill="#f5a623"/>'
    + '<ellipse cx="32" cy="50" rx="13" ry="9" fill="#fce4c8"/>'
    + '<circle cx="32" cy="24" r="16" fill="#f5a623"/>'
    + '<circle cx="19" cy="12" r="5.5" fill="#f5a623"/><circle cx="19" cy="12" r="2.5" fill="#e88f3a"/>'
    + '<circle cx="45" cy="12" r="5.5" fill="#f5a623"/><circle cx="45" cy="12" r="2.5" fill="#e88f3a"/>'
    + '<circle cx="26" cy="23" r="2.6" fill="#3a2a1a"/>'
    + '<circle cx="38" cy="23" r="2.6" fill="#3a2a1a"/>'
    + '<ellipse cx="32" cy="28" rx="2.6" ry="1.9" fill="#3a2a1a"/>'
    + '<path d="M32 28 L32 31 M28 30 L36 30" stroke="#3a2a1a" stroke-width="1" stroke-linecap="round"/>'
    + '<text x="32" y="15" font-size="7" fill="#3a2a1a" text-anchor="middle" font-weight="bold">王</text>'
    + '<path d="M52 46 Q60 40 55 30" stroke="#f5a623" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
    + '<ellipse cx="24" cy="58" rx="6.5" ry="4" fill="#f5a623"/>'
    + '<ellipse cx="40" cy="58" rx="6.5" ry="4" fill="#f5a623"/>'
    + '</svg>';

  var tiger = document.createElement('div');
  tiger.id = 'tiger';
  tiger.innerHTML = '<div class="tiger-body">' + svg + '</div>'
    + '<div class="tiger-bubble"></div>'
    + '<div class="tiger-zz">zZ</div>';
  document.body.appendChild(tiger);

  var body = tiger.querySelector('.tiger-body');
  var bubble = tiger.querySelector('.tiger-bubble');
  var zz = tiger.querySelector('.tiger-zz');

  var x = window.innerWidth - 100;
  var y = window.innerHeight - 130;
  var tx = x, ty = y;
  var facing = 1;
  var running = false;
  var state = 'idle';
  var idleTimer = null;
  var paused = false;

  function setState(s) {
    state = s;
    body.className = 'tiger-body ' + s;
    zz.classList.toggle('show', s === 'sleep');
  }

  function idleLoop() {
    if (running) return;
    var states = ['idle', 'idle', 'sit', 'sleep'];
    setState(states[Math.floor(Math.random() * states.length)]);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idleLoop, 3000 + Math.random() * 2500);
  }

  // 点击页面空白：跑过去（点老虎本体不触发）
  document.addEventListener('click', function (e) {
    if (e.target.closest('#tiger')) return;
    tx = e.clientX - 36;
    ty = e.clientY - 50;
    running = true;
    clearTimeout(idleTimer);
    setState('run');
  });

  // 点击老虎本体：互动（翻肚皮 + 气泡）
  tiger.addEventListener('click', function (e) {
    e.stopPropagation();
    running = false;
    setState('flip');
    bubble.textContent = '嗷呜';
    bubble.classList.add('show');
    setTimeout(function () { bubble.classList.remove('show'); }, 1200);
    setTimeout(function () {
      if (state === 'flip') { setState('idle'); idleLoop(); }
    }, 650);
  });

  // 页面不可见时暂停
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
  });

  function loop() {
    if (!paused) {
      if (running) {
        var dx = tx - x, dy = ty - y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3) {
          var speed = Math.min(dist * 0.09, 14);   // 远处快、近了减速
          x += dx / dist * speed;
          y += dy / dist * speed;
          if (dx > 2) facing = 1;
          else if (dx < -2) facing = -1;
        } else {
          running = false;
          setState('idle');
          idleLoop();
        }
      }
      tiger.style.transform = 'translate(' + x + 'px,' + y + 'px)'
        + (facing < 0 ? ' scaleX(-1)' : '');
    }
    requestAnimationFrame(loop);
  }

  tiger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  idleLoop();
  loop();
})();
