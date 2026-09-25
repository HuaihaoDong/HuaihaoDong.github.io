/* ==========================================================================
   tiger.js —— 宠物老虎彩蛋：点哪跑哪 / 待机循环 / 方向翻转 / 点击互动
   形象为精灵图逐帧动画（tiger-idle/run/sit/sleep/play 五套 strip）
   ========================================================================== */
(function () {
  var style = document.createElement('style');
  style.textContent = [
    '#tiger { width: 96px; height: 96px; }',
    '#tiger .tiger-sprite { width: 100%; height: 100%; background-repeat: no-repeat; }',
    '@keyframes tiger-frames { from { background-position: 0% 0; } to { background-position: 100% 0; } }'
  ].join('\n');
  document.head.appendChild(style);

  var tiger = document.createElement('div');
  tiger.id = 'tiger';
  tiger.innerHTML = '<div class="tiger-sprite"></div>'
    + '<div class="tiger-bubble"></div>'
    + '<div class="tiger-zz">zZ</div>';
  document.body.appendChild(tiger);

  var sprite = tiger.querySelector('.tiger-sprite');
  var bubble = tiger.querySelector('.tiger-bubble');
  var zz = tiger.querySelector('.tiger-zz');

  // 动作定义：图片 / 帧数 / 循环时长（秒）
  var ACTIONS = {
    idle:  { img: 'tiger-idle.png',  frames: 4, dur: 1.6 },
    run:   { img: 'tiger-run8.png',  frames: 8, dur: 1.0 },   // 8 帧/秒，慢一点
    sit:   { img: 'tiger-sit.png',   frames: 2, dur: 0.8 },
    sleep: { img: 'tiger-sleep.png', frames: 2, dur: 1.0 },
    play:  { img: 'tiger-play.png',  frames: 2, dur: 0.4 }
  };

  var x = window.innerWidth - 116;
  var y = window.innerHeight - 140;
  var tx = x, ty = y;
  var facing = 1;
  var running = false;
  var state = 'idle';
  var idleTimer = null;
  var paused = false;

  function setState(s) {
    state = s;
    var a = ACTIONS[s];
    sprite.style.backgroundImage = 'url(' + a.img + ')';
    sprite.style.backgroundSize = (a.frames * 100) + '% 100%';
    sprite.style.animation = 'tiger-frames ' + a.dur + 's steps(' + (a.frames - 1) + ') infinite';
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
    tx = e.clientX - 48;
    ty = e.clientY - 62;
    running = true;
    clearTimeout(idleTimer);
    setState('run');
  });

  // 点击老虎本体：互动（翻肚皮 + 气泡）
  tiger.addEventListener('click', function (e) {
    e.stopPropagation();
    running = false;
    setState('play');
    bubble.textContent = '嗷呜';
    bubble.classList.add('show');
    setTimeout(function () { bubble.classList.remove('show'); }, 1200);
    setTimeout(function () {
      if (state === 'play') { setState('idle'); idleLoop(); }
    }, 800);
  });

  // 页面不可见时暂停
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
  });

  // 照片灯箱打开/关闭时暂停/恢复（detail.html 灯箱 dispatch）
  document.addEventListener('tiger-pause', function () { paused = true; });
  document.addEventListener('tiger-resume', function () { paused = false; });

  function loop() {
    if (!paused) {
      if (running) {
        var dx = tx - x, dy = ty - y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3) {
          var speed = Math.min(dist * 0.05, 9);   // 远处快、近了减速（整体放慢）
          x += dx / dist * speed;
          y += dy / dist * speed;
          if (dx > 2) facing = -1;       // 帧面朝左：向右移动需翻转
          else if (dx < -2) facing = 1;  // 向左移动不翻转
        } else {
          running = false;
          setState('idle');
          idleLoop();
        }
      }
      tiger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      sprite.style.transform = facing < 0 ? 'scaleX(-1)' : '';
    }
    requestAnimationFrame(loop);
  }

  tiger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  setState('idle');
  idleLoop();
  loop();
})();
