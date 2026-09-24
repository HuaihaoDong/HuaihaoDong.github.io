/* ==========================================================================
   tiger.js —— 宠物老虎彩蛋：点哪跑哪 / 待机循环 / 方向翻转 / 点击互动
   形象为真实幼虎照片（tiger.jpg，圆形裁剪），后续可替换其他形象
   ========================================================================== */
(function () {
  // 注入老虎专属动效样式
  var style = document.createElement('style');
  style.textContent = [
    '#tiger { width: 88px; height: 88px; }',
    '.tiger-body { transition: transform .3s ease; transform-origin: 50% 100%; }',
    '.tiger-body.idle { animation: tg-breathe 2.6s ease-in-out infinite; }',
    '.tiger-body.sit { animation: tg-breathe 3.4s ease-in-out infinite; }',
    '.tiger-body.run { animation: tg-bob .28s ease-in-out infinite; }',
    '.tiger-body.sleep { transform: scaleY(.86) rotate(5deg); animation: none; }',
    '.tiger-body.flip { animation: tg-flip .6s ease; }',
    '#tiger .tiger-body img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 2px solid rgba(201, 162, 107, 0.5); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45); }',
    '@keyframes tg-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }',
    '@keyframes tg-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }',
    '@keyframes tg-flip { 0%{transform:rotate(0)} 50%{transform:rotate(180deg) scaleY(.92)} 100%{transform:rotate(360deg)} }'
  ].join('\n');
  document.head.appendChild(style);

  // 注入老虎 DOM
  var tiger = document.createElement('div');
  tiger.id = 'tiger';
  tiger.innerHTML = '<div class="tiger-body"><img src="tiger.jpg" alt="小老虎"></div>'
    + '<div class="tiger-bubble"></div>'
    + '<div class="tiger-zz">zZ</div>';
  document.body.appendChild(tiger);

  var body = tiger.querySelector('.tiger-body');
  var bubble = tiger.querySelector('.tiger-bubble');
  var zz = tiger.querySelector('.tiger-zz');

  var x = window.innerWidth - 110;
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
    tx = e.clientX - 44;
    ty = e.clientY - 56;
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
