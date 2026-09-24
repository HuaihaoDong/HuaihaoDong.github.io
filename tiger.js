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
    '@keyframes tg-flip { 0%{transform:rotate(0)} 50%{transform:rotate(180deg) scaleY(.9)} 100%{transform:rotate(360deg)} }',
    '#tiger .tail { transform-box: fill-box; transform-origin: 10% 88%; animation: tail-wag 1.8s ease-in-out infinite; }',
    '@keyframes tail-wag { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-18deg)} }',
    '.tiger-body.sleep .tail { animation: none; }'
  ].join('\n');
  document.head.appendChild(style);

  // 注入老虎 DOM
  var svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<path class="tail" d="M72 78 Q88 72 85 54 Q83 45 78 48" stroke="#fb923c" stroke-width="9" fill="none" stroke-linecap="round"/>'
    + '<circle cx="78" cy="48" r="4.5" fill="#7c2d12"/>'
    + '<ellipse cx="50" cy="78" rx="31" ry="24" fill="#fb923c"/>'
    + '<ellipse cx="50" cy="82" rx="18" ry="12" fill="#fff7ed"/>'
    + '<path d="M25 70 q4 9 0 18" stroke="#c2410c" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M75 70 q-4 9 0 18" stroke="#c2410c" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    + '<circle cx="50" cy="40" r="28" fill="#fb923c"/>'
    + '<ellipse cx="22" cy="48" rx="7" ry="10" fill="#fb923c"/>'
    + '<ellipse cx="78" cy="48" rx="7" ry="10" fill="#fb923c"/>'
    + '<ellipse cx="30" cy="18" rx="9.5" ry="12" fill="#fb923c"/>'
    + '<ellipse cx="30" cy="18" rx="5" ry="7.5" fill="#fda4af"/>'
    + '<ellipse cx="70" cy="18" rx="9.5" ry="12" fill="#fb923c"/>'
    + '<ellipse cx="70" cy="18" rx="5" ry="7.5" fill="#fda4af"/>'
    + '<path d="M50 16 v10 M44 16 l-3.5 8 M56 16 l3.5 8 M42 26 h16" stroke="#7c2d12" stroke-width="3" stroke-linecap="round" fill="none"/>'
    + '<ellipse cx="40" cy="41" rx="5.5" ry="7" fill="#3f3f46"/>'
    + '<ellipse cx="60" cy="41" rx="5.5" ry="7" fill="#3f3f46"/>'
    + '<circle cx="42.5" cy="38.5" r="2.3" fill="#fff"/>'
    + '<circle cx="62.5" cy="38.5" r="2.3" fill="#fff"/>'
    + '<ellipse cx="50" cy="50" rx="4.5" ry="3.5" fill="#7c2d12"/>'
    + '<path d="M50 53.5 v4 M46 56 q4 4 8 0" stroke="#7c2d12" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    + '<circle cx="33" cy="48" r="5" fill="#fda4af" opacity="0.55"/>'
    + '<circle cx="67" cy="48" r="5" fill="#fda4af" opacity="0.55"/>'
    + '<ellipse cx="38" cy="96" rx="10" ry="5.5" fill="#fb923c"/>'
    + '<ellipse cx="62" cy="96" rx="10" ry="5.5" fill="#fb923c"/>'
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
