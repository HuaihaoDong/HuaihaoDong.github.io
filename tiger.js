/* 老虎精灵：只响应空白区域，静止时停止位置更新。 */
(function () {
  if (document.getElementById('tiger')) return;
  var style = document.createElement('style');
  style.textContent = '#tiger{width:96px;height:96px;left:0;top:0;padding:0;border:0;background:none;color:inherit;overflow:visible}'
    + '#tiger .tiger-sprite{display:block;width:100%;height:100%;background-repeat:no-repeat}'
    + '@keyframes tiger-frames{from{background-position:0% 0}to{background-position:100% 0}}';
  document.head.appendChild(style);
  var tiger = document.createElement('button');
  tiger.id = 'tiger'; tiger.type = 'button';
  tiger.setAttribute('aria-label', '和老虎打个招呼');
  tiger.innerHTML = '<span class="tiger-sprite" aria-hidden="true"></span><span class="tiger-bubble" aria-live="polite"></span><span class="tiger-zz" aria-hidden="true">zZ</span>';
  document.body.appendChild(tiger);
  var sprite = tiger.querySelector('.tiger-sprite');
  var bubble = tiger.querySelector('.tiger-bubble');
  var zz = tiger.querySelector('.tiger-zz');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ACTIONS = {
    idle: { img: 'tiger-idle.png', frames: 4, dur: 1.6 },
    run: { img: 'tiger-run8.png', frames: 8, dur: 1.0 },
    sit: { img: 'tiger-sit.png', frames: 2, dur: 0.8 },
    sleep: { img: 'tiger-sleep.png', frames: 2, dur: 1.0 },
    play: { img: 'tiger-play.png', frames: 2, dur: 0.4 }
  };
  var x = Math.max(8, innerWidth - 116), y = Math.max(64, innerHeight - 140);
  var tx = x, ty = y, facing = 1, running = false;
  var idleTimer, playTimer, bubbleTimer, frame = null, lastTime = 0, modalPaused = false;
  function paused() { return document.hidden || modalPaused; }
  function paint() {
    tiger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    sprite.style.transform = facing < 0 ? 'scaleX(-1)' : '';
  }
  function clampX(v) { return Math.max(8, Math.min(v, Math.max(8, innerWidth - 104))); }
  function clampY(v) { return Math.max(64, Math.min(v, Math.max(64, innerHeight - 104))); }
  function setState(s) {
    var a = ACTIONS[s];
    sprite.style.backgroundImage = 'url(' + a.img + ')';
    sprite.style.backgroundSize = (a.frames * 100) + '% 100%';
    sprite.style.animation = motion.matches ? 'none' : 'tiger-frames ' + a.dur + 's steps(' + (a.frames - 1) + ') infinite';
    sprite.style.animationPlayState = paused() ? 'paused' : 'running';
    zz.classList.toggle('show', s === 'sleep' && !motion.matches);
  }
  function idleLoop() {
    clearTimeout(idleTimer);
    if (running || paused() || motion.matches) return;
    var states = ['idle', 'idle', 'sit', 'sleep'];
    setState(states[Math.floor(Math.random() * states.length)]);
    idleTimer = setTimeout(idleLoop, 3000 + Math.random() * 2500);
  }
  function queueFrame() {
    if (frame === null && running && !paused() && !motion.matches) frame = requestAnimationFrame(loop);
  }
  function loop(time) {
    frame = null;
    var delta = Math.min((time - (lastTime || time - 16.67)) / 16.67, 2);
    lastTime = time;
    if (paused()) return;
    var dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);
    if (dist > 3) {
      var speed = Math.min(dist, Math.min(dist * 0.05, 9) * delta);
      x += dx / dist * speed; y += dy / dist * speed;
      if (Math.abs(dx) > 2) facing = dx > 0 ? -1 : 1;
      paint(); queueFrame();
    } else { running = false; setState('idle'); idleLoop(); }
  }
  document.addEventListener('click', function (e) {
    if (paused() || motion.matches || e.target.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable],.ph-item,.avatar-ph,.intro-link,.lb,.avatar-lb,.intro-pop,header')) return;
    tx = clampX(e.clientX - 48); ty = clampY(e.clientY - 62);
    running = true; clearTimeout(idleTimer); clearTimeout(playTimer);
    setState('run'); lastTime = 0; queueFrame();
  });
  tiger.addEventListener('click', function (e) {
    e.stopPropagation(); running = false; clearTimeout(idleTimer); clearTimeout(playTimer); clearTimeout(bubbleTimer);
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    setState('play'); bubble.textContent = '嗷呜'; bubble.classList.add('show');
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 1200);
    playTimer = setTimeout(function () { setState('idle'); idleLoop(); }, 800);
  });
  function syncPause() {
    if (paused()) {
      clearTimeout(idleTimer);
      if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    } else { lastTime = 0; if (running) queueFrame(); else idleLoop(); }
    sprite.style.animationPlayState = paused() ? 'paused' : 'running';
    zz.style.animationPlayState = paused() ? 'paused' : 'running';
    tiger.style.visibility = modalPaused ? 'hidden' : '';
  }
  document.addEventListener('visibilitychange', syncPause);
  document.addEventListener('tiger-pause', function () { modalPaused = true; syncPause(); });
  document.addEventListener('tiger-resume', function () { modalPaused = false; syncPause(); });
  motion.addEventListener('change', function () {
    running = false;
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    setState('idle'); syncPause();
  });
  window.addEventListener('resize', function () { x = clampX(x); y = clampY(y); tx = clampX(tx); ty = clampY(ty); paint(); });
  paint(); setState('idle'); syncPause();
})();
