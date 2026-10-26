/* Tiger companion v2 — complete sprite frames, acceleration and explicit action states. */
(function () {
  'use strict';
  function clamp(value, min, max) { return Math.max(min, Math.min(value, max)); }
  function advanceStep(p, target, dt, limits) {
    var dx = target.x - p.x, dy = target.y - p.y, distance = Math.hypot(dx, dy);
    var speed = Math.hypot(p.vx, p.vy);
    if (distance < .7 && speed <= Math.max(1,limits.brake*dt)) return { x: target.x, y: target.y, vx: 0, vy: 0, arrived: true };
    var desired = Math.min(limits.speed, Math.sqrt(2 * limits.brake * distance),distance*7);
    var vx = distance ? dx / distance * desired : 0, vy = distance ? dy / distance * desired : 0;
    var ax = vx - p.vx, ay = vy - p.vy, change = Math.hypot(ax, ay);
    var acceleration = speed > desired ? limits.brake : limits.acceleration;
    var fraction = change ? Math.min(1, acceleration * dt / change) : 1;
    vx = p.vx + ax * fraction; vy = p.vy + ay * fraction;
    var x = p.x + vx * dt, y = p.y + vy * dt;
    if ((target.x - x) * dx + (target.y - y) * dy <= 0 && speed <= limits.brake*dt) {
      return { x: target.x, y: target.y, vx: 0, vy: 0, arrived: true };
    }
    return { x: x, y: y, vx: vx, vy: vy, arrived: false };
  }
  function advance(p,target,dt,limits) {
    var steps=Math.max(1,Math.ceil(dt*240)),result=p;
    for(var step=0;step<steps;step++) {
      result=advanceStep(result,target,dt/steps,limits);
      if(result.arrived)break;
    }
    return result;
  }
  function brake(p, dt, deceleration) {
    var speed = Math.hypot(p.vx, p.vy), next = Math.max(0, speed - deceleration * dt);
    var ratio = speed ? next / speed : 0;
    var vx = p.vx * ratio, vy = p.vy * ratio;
    return { x: p.x + (p.vx + vx) * dt / 2, y: p.y + (p.vy + vy) * dt / 2, vx: vx, vy: vy };
  }
  function frameAt(sequence, durations, elapsed) {
    var sum = durations.reduce(function (a, b) { return a + b; }, 0);
    var cursor = Math.max(0, elapsed) % sum;
    for (var i = 0; i < durations.length; i++) { if (cursor < durations[i]) return sequence[i]; cursor -= durations[i]; }
    return sequence[sequence.length - 1];
  }
  var model = { advance: advance, brake: brake, frameAt: frameAt, clamp: clamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (typeof document === 'undefined' || document.getElementById('tiger')) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.createElement('div');
  root.id = 'tiger';
  root.innerHTML = '<button type="button" class="tiger-hit" aria-label="摸摸老虎" aria-describedby="tigerHelp">'
    + '<span class="tiger-shadow" aria-hidden="true"></span><span class="tiger-body" aria-hidden="true">'
    + '<span class="tiger-frame"></span><span class="tiger-frame"></span></span></button>'
    + '<span class="tiger-bubble" role="status" aria-live="polite"></span><span class="tiger-zz" aria-hidden="true"></span>'
    + '<span id="tigerHelp" class="tiger-help">点击互动，双击跳一跳；右键或长按打开小菜单，方向键带它走，Escape 收起菜单。</span>'
    + '<div class="tiger-menu" role="group" aria-label="和老虎玩" hidden>'
    + '<button type="button" data-action="wave">挥爪打招呼</button><button type="button" data-action="stretch">伸个懒腰</button>'
    + '<button type="button" data-action="sleep">睡一会儿</button><button type="button" data-action="hide">先休息一下</button></div>';
  document.body.appendChild(root);
  var recall = document.createElement('button');
  recall.type = 'button'; recall.className = 'tiger-recall'; recall.textContent = '🐯';
  recall.setAttribute('aria-label', '叫老虎回来'); recall.hidden = true; document.body.appendChild(recall);
  var hit = root.querySelector('.tiger-hit'), body = root.querySelector('.tiger-body');
  var smoothGroom = window.CSS && CSS.supports('mix-blend-mode', 'plus-lighter');
  var layers = root.querySelectorAll('.tiger-frame'), bubble = root.querySelector('.tiger-bubble');
  var zz = root.querySelector('.tiger-zz'), menu = root.querySelector('.tiger-menu');
  var assets = {
    idle: { src: 'assets/tiger/idle-v3.webp', cols: 4, rows: 1 },
    sit: { src: 'assets/tiger/sit-v3.webp', cols: 2, rows: 1 },
    sleep: { src: 'assets/tiger/sleep-v4.png', cols: 2, rows: 1 },
    oldRun: { src: 'assets/tiger/run8-v3.webp', cols: 8, rows: 1 },
    oldPlay: { src: 'assets/tiger/play-v3.webp', cols: 2, rows: 1 },
    run: { src: 'assets/tiger/run-v3.webp', cols: 4, rows: 2, offset: 0.055 },
    actions: { src: 'assets/tiger/actions-v3.webp', cols: 4, rows: 4, offset: 0.005 },
    groom: { src: 'assets/tiger/groom-v3.webp', cols: 4, rows: 2 }
  };
  // Three slow cycles: two licks, then a complete cheek-to-eye wipe.
  var groomFrames = [], groomTimes = [];
  for (var cycle = 0; cycle < 3; cycle++) {
    groomFrames = groomFrames.concat([0,1,2,3,2,1,2,3,4,5,4,6,7]);
    groomTimes = groomTimes.concat([120,140,200,140,140,140,200,140,160,260,160,200,200]);
  }
  var clips = {
    idle: { asset: 'idle', frames: [0,1,0,2,0,3,0], times: [2300,110,1700,700,1600,700,1900] },
    sit: { asset: 'sit', frames: [0,1,0], times: [3400,750,1800] },
    sleep: { asset: 'sleep', frames: [0,1], times: [1700,1700] },
    turn: { asset: 'idle', frames: [2,0], times: [100,100], duration: 200 },
    wave: { asset: 'actions', frames: [0,1,2,1,2,3], times: [150,180,230,170,230,200], duration: 1160 },
    stretch: { asset: 'actions', frames: [4,5,6,7], times: [200,350,850,350], duration: 1750 },
    roll: { asset: 'actions', frames: [8,9,10,11,10,11,10,9,8], times: [120,240,480,300,300,300,350,240,180], duration: 2510 },
    groom: { asset: 'groom', frames: groomFrames, times: groomTimes, duration: 6600 },
    bounce: { asset: 'idle', frames: [0,1,0], times: [180,120,350], duration: 650 }
  };
  var size = innerWidth <= 600 ? 78 : 96;
  var p = { x: innerWidth - size - 20, y: innerHeight - size - 24, vx: 0, vy: 0 };
  var target = { x: p.x, y: p.y }, facing = 1, wantedFacing = 1;
  var state = 'idle', stateAt = 0, lastStep = 0, lastActivity = 0, nextIdle = 11000, nextYawn = 18000;
  var bubbleUntil = 0, userSleep = false, afterAction = null, dismissed = false;
  var pausedAt = null, pausedTotal = 0, modalDepth = 0;
  var raf = null, timer = null, activeLayer = 0, currentAsset = '', currentFacing = 1, currentFrame = -1;
  var longTimer = null, longHandled = false, lastTap = -10000, greeting = 0;
  function now() { return (pausedAt === null ? performance.now() : pausedAt) - pausedTotal; }
  function paused() { return pausedAt !== null || dismissed; }
  function limits() { return { speed: size === 78 ? 155 : 205, acceleration: 420, brake: 650 }; }
  function bounds() {
    var safeBottom = 12;
    p.x = clamp(p.x, 8, Math.max(8, innerWidth - size - 8));
    p.y = clamp(p.y, 66, Math.max(66, innerHeight - size - safeBottom));
    target.x = clamp(target.x, 8, Math.max(8, innerWidth - size - 8));
    target.y = clamp(target.y, 66, Math.max(66, innerHeight - size - safeBottom));
  }
  function say(text, duration) {
    if (text !== '嗷呜～') return;
    bubble.textContent = text; bubbleUntil = now() + (duration || 1800); bubble.classList.add('show');
  }
  function cancelTicks() {
    if (raf !== null) cancelAnimationFrame(raf);
    if (timer !== null) clearTimeout(timer);
    raf = timer = null;
  }
  function schedule(delay) {
    if (paused() || !menu.hidden) return;
    if (delay <= 20) {
      raf = requestAnimationFrame(tick);
      // A visible but occluded webview can throttle RAF without a visibility event.
      // Keep action deadlines advancing; the next RAF cancels this fallback.
      timer = setTimeout(tick,80);
    }
    else timer = setTimeout(tick, delay);
  }
  function stateTo(name, next) {
    state = name; stateAt = now(); root.dataset.state = name;
    if (name !== 'move' && name !== 'brake') p.vx = p.vy = 0;
    afterAction = next || null;
    zz.classList.toggle('show', name === 'sleep' && !reduced.matches);
    hit.setAttribute('aria-label', name === 'sleep' ? '轻轻叫醒老虎' : '摸摸老虎');
    lastStep = now();
  }
  function load(name) {
    var asset = assets[name];
    if (asset.image) return;
    var image = new Image(); asset.image = image;
    image.decoding='async'; image.fetchPriority=name==='idle'?'high':'low';
    image.onload = function () { asset.ready = true; if (!paused()) refresh(); };
    image.onerror = function () { asset.failed = true; };
    image.src = asset.src;
  }
  function paint(assetName, frame, direction) {
    var asset = assets[assetName];
    if (!asset.ready) {
      load(assetName);
      if (assetName === 'run') { assetName = 'oldRun'; frame %= 8; }
      else if (assetName === 'actions' || assetName === 'groom') { assetName = state === 'roll' ? 'oldPlay' : 'idle'; frame %= state === 'roll' ? 2 : 4; }
      asset = assets[assetName]; load(assetName);
      if (!asset.ready) return;
    }
    if (assetName !== currentAsset || direction !== currentFacing || (assetName === 'groom' && frame !== currentFrame)) {
      // Additive crossfades keep identical opaque pixels at full brightness.
      // Source-over opacity blending otherwise dims the tiger at every grooming frame.
      var grooming = assetName === 'groom';
      body.classList.toggle('tiger-groom-blend', grooming && smoothGroom);
      for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        layers[layerIndex].style.transitionDuration = grooming ? (smoothGroom ? '100ms' : '0ms') : '150ms';
        layers[layerIndex].style.transitionTimingFunction = grooming ? 'linear' : 'ease';
      }
      layers[activeLayer].classList.remove('visible');
      activeLayer = 1 - activeLayer; currentAsset = assetName; currentFacing = direction;
      layers[activeLayer].style.backgroundImage = 'url("' + asset.src + '")';
      layers[activeLayer].style.backgroundSize = (asset.cols * 100) + '% ' + (asset.rows * 100) + '%';
      layers[activeLayer].style.transform = 'translateY(' + ((asset.offset || 0) * size) + 'px) scaleX(' + direction + ')';
      layers[activeLayer].classList.add('visible');
    }
    currentFrame = frame;
    var col = frame % asset.cols, row = Math.floor(frame / asset.cols);
    layers[activeLayer].style.backgroundPosition = (asset.cols > 1 ? col / (asset.cols - 1) * 100 : 0) + '% ' + (asset.rows > 1 ? row / (asset.rows - 1) * 100 : 0) + '%';
  }
  function draw(t) {
    var elapsed = Math.max(0, t - stateAt);
    if (state === 'move' || state === 'brake') {
      // Distance-based phase keeps the paws tied to travel speed rather than a fixed timer.
      paint('run', Math.floor(stridePhase) % 8, facing);
    } else {
      var clip = clips[state] || clips.idle;
      paint(clip.asset, reduced.matches ? clip.frames[0] : frameAt(clip.frames,clip.times,elapsed), 1);
    }
    root.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,0)';
    if (state === 'bounce' && !reduced.matches) {
      var jump = Math.sin(clamp(elapsed / 650,0,1) * Math.PI);
      body.style.transform = 'translateY(' + (-jump * 20).toFixed(2) + 'px) scale(' + (1 - jump*.035) + ',' + (1 + jump*.035) + ')';
    } else body.style.transform = '';
    bubble.classList.toggle('right-edge', p.x > innerWidth - 160);
    bubble.classList.toggle('left-edge', p.x < 80);
    menu.classList.toggle('left-edge', p.x < 80);
    menu.classList.toggle('below',p.y<210);
    bubble.classList.toggle('below',p.y<100);
    if (t >= bubbleUntil) bubble.classList.remove('show');
  }
  var stridePhase = 0;
  function startMove() {
    if (reduced.matches) { stateTo('idle'); return; }
    var dx = target.x - p.x;
    wantedFacing = Math.abs(dx) > 8 ? (dx > 0 ? -1 : 1) : facing;
    if (wantedFacing !== facing) stateTo('turn');
    else stateTo('move');
  }
  function moveTo(x, y) {
    lastActivity = now(); nextYawn = lastActivity + 18000; userSleep = false; closeMenu(false);
    target = { x: x - size/2, y: y - size*.78 }; bounds();
    var desired = Math.abs(target.x-p.x)>10 ? (target.x > p.x ? -1 : 1) : facing;
    wantedFacing = desired;
    if (state === 'sleep') { stateTo('stretch',startMove); }
    else if (state === 'move' && desired !== facing) stateTo('brake');
    else if (state === 'move' || state === 'brake') { /* Keep momentum and phase on repeated destinations. */ }
    else startMove();
    refresh();
  }
  function interact(name, text) {
    lastActivity = now(); nextYawn = lastActivity + 18000; userSleep = false;
    bubble.classList.remove('show'); bubbleUntil = 0;
    if (name === 'sleep') { userSleep = true; stateTo('sleep'); }
    else { stateTo(name); if (text) say(text); }
    closeMenu(false); refresh();
  }
  function finishAction() {
    var follow = afterAction; afterAction = null;
    if (follow) follow();
    else { stateTo('idle'); nextIdle = now() + 9000 + Math.random()*7000; }
  }
  function tick() {
    cancelTicks();
    if (paused()) return;
    var t = now(), dt = Math.min(Math.max((t-lastStep)/1000,0),.08); lastStep = t;
    if (state === 'move') {
      var before = { x:p.x,y:p.y };
      var options = limits();
      if (Math.hypot(target.x-p.x,target.y-p.y)<120) options.speed = Math.min(options.speed,120);
      p = advance(p,target,dt,options); bounds();
      stridePhase += Math.hypot(p.x-before.x,p.y-before.y)/17;
      if (p.arrived) { stateTo('sit'); nextIdle = t+1300; }
    } else if (state === 'brake') {
      var oldX=p.x,oldY=p.y; p=brake(p,dt,limits().brake); bounds();
      stridePhase += Math.hypot(p.x-oldX,p.y-oldY)/17;
      if (Math.hypot(p.vx,p.vy)<4) stateTo('turn');
    } else if (state === 'turn' && t-stateAt>=200) {
      facing=wantedFacing; stridePhase=0; stateTo('move');
    } else if (clips[state] && clips[state].duration && t-stateAt>=clips[state].duration) finishAction();
    else if (!clips[state].duration) {
      var quiet = t-lastActivity;
      if (userSleep || quiet>=60000) { if(state!=='sleep') stateTo('sleep'); }
      else if (!reduced.matches && t>=nextYawn) { stateTo('stretch'); nextYawn=t+22000; }
      else if (quiet>=26000) { if(state!=='sit') stateTo('sit'); }
      else if(state==='sit' && t>=nextIdle) {
        stateTo('idle'); nextIdle=t+11000;
      }
      else if(t>=nextIdle) {
        var choices=['groom','wave'];
        stateTo(choices[Math.floor(Math.random()*choices.length)]);
        nextIdle=t+10000+Math.random()*6000;
      }
    }
    draw(t);
    if (!menu.hidden) return;
    var active = state==='move'||state==='brake'||Boolean(clips[state] && clips[state].duration);
    if(active&&!reduced.matches) schedule(0);
    else {
      var clip=clips[state]||clips.idle;
      var total=clip.times.reduce(function(a,b){return a+b;},0);
      var elapsed=Math.max(0,t-stateAt), cycle=elapsed%total, boundary=0;
      for(var i=0;i<clip.times.length;i++){boundary+=clip.times[i];if(boundary>cycle)break;}
      var delay=reduced.matches?5000:boundary-cycle;
      if(active)delay=Math.min(delay,Math.max(20,clip.duration-elapsed));
      if(bubbleUntil>t)delay=Math.min(delay,bubbleUntil-t);
      if(!active&&!userSleep){
        [nextIdle,nextYawn,lastActivity+26000,lastActivity+60000].forEach(function(deadline){if(deadline>t)delay=Math.min(delay,deadline-t);});
      }
      schedule(Math.max(30,delay));
    }
  }
  function refresh() { cancelTicks(); if(!paused()) tick(); }
  function closeMenu(focus) { menu.hidden=true; hit.setAttribute('aria-expanded','false'); if(focus)hit.focus(); }
  function openMenu() {
    cancelTicks(); p.vx=p.vy=0; stateTo('sit'); draw(now()); menu.hidden=false;
    hit.setAttribute('aria-expanded','true'); menu.querySelector('button').focus();
  }
  hit.setAttribute('aria-haspopup','true'); hit.setAttribute('aria-expanded','false');
  hit.addEventListener('click',function(e){
    e.stopPropagation();
    if(longHandled){longHandled=false;return;}
    var t=now();
    if(state==='sleep'){interact('stretch');lastTap=t;return;}
    if(t-lastTap<320){interact('bounce');lastTap=-10000;return;}
    lastTap=t;
    var actions=[['roll','嗷呜～'],['wave'],['groom'],['roll','嗷呜～']];
    var action=actions[greeting++%actions.length];interact(action[0],action[1]);
  });
  hit.addEventListener('contextmenu',function(e){e.preventDefault();openMenu();});
  hit.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse')return;
    var sx=e.clientX,sy=e.clientY;longHandled=false;
    clearTimeout(longTimer);longTimer=setTimeout(function(){longHandled=true;openMenu();},500);
    function moved(ev){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>12)clearTimeout(longTimer);}
    function end(){clearTimeout(longTimer);hit.removeEventListener('pointermove',moved);hit.removeEventListener('pointerup',end);hit.removeEventListener('pointercancel',end);}
    hit.addEventListener('pointermove',moved);hit.addEventListener('pointerup',end);hit.addEventListener('pointercancel',end);
  });
  hit.addEventListener('keydown',function(e){
    var delta={ArrowLeft:[-90,0],ArrowRight:[90,0],ArrowUp:[0,-70],ArrowDown:[0,70]}[e.key];
    if(delta){e.preventDefault();moveTo(p.x+size/2+delta[0],p.y+size*.78+delta[1]);}
    if(e.key==='Escape'){e.preventDefault();closeMenu(true);p.vx=p.vy=0;stateTo('idle');refresh();}
  });
  menu.addEventListener('click',function(e){
    var button=e.target.closest('button[data-action]');if(!button)return;e.stopPropagation();
    var action=button.dataset.action;
    if(action==='hide'){closeMenu(false);dismissed=true;cancelTicks();root.hidden=true;recall.hidden=false;recall.focus();}
    else if(action==='wave')interact('wave');
    else if(action==='stretch')interact('stretch');
    else interact('sleep');
    if(action!=='hide')hit.focus();
  });
  menu.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();closeMenu(true);refresh();return;}
    var buttons=Array.prototype.slice.call(menu.querySelectorAll('button')),i=buttons.indexOf(document.activeElement);
    if(e.key==='Tab'||e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();var reverse=e.shiftKey||e.key==='ArrowUp';buttons[(i+(reverse?-1:1)+buttons.length)%buttons.length].focus();
    }
  });
  recall.addEventListener('click',function(){dismissed=false;root.hidden=false;recall.hidden=true;lastActivity=now();nextYawn=lastActivity+18000;stateTo('wave');hit.focus();refresh();});
  document.addEventListener('click',function(e){
    if(root.contains(e.target)||recall.contains(e.target))return;
    if(!menu.hidden){closeMenu(false);refresh();return;}
    if(paused()||reduced.matches||e.defaultPrevented)return;
    if(window.getSelection && String(window.getSelection()).trim())return;
    if(e.target.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable],.ph-item,.avatar-ph,.intro-pop,.avatar-lb,.lb,header,p,figcaption,h1,h2,h3'))return;
    moveTo(e.clientX,e.clientY);
  });
  function syncPause(){
    var shouldPause=document.hidden||modalDepth>0;
    if(shouldPause&&pausedAt===null){pausedAt=performance.now();cancelTicks();clearTimeout(longTimer);}
    else if(!shouldPause&&pausedAt!==null){pausedTotal+=performance.now()-pausedAt;pausedAt=null;lastStep=now();}
    root.classList.toggle('is-paused',shouldPause);
    root.style.visibility=modalDepth>0?'hidden':'';
    recall.style.visibility=modalDepth>0?'hidden':'';
    if(!shouldPause)refresh();
  }
  document.addEventListener('visibilitychange',syncPause);
  document.addEventListener('tiger-pause',function(){modalDepth++;closeMenu(false);syncPause();});
  document.addEventListener('tiger-resume',function(){modalDepth=Math.max(0,modalDepth-1);syncPause();});
  reduced.addEventListener('change',function(){p.vx=p.vy=0;stateTo('idle');lastActivity=now();nextYawn=lastActivity+18000;refresh();});
  window.addEventListener('resize',function(){size=innerWidth<=600?78:96;bounds();currentAsset='';refresh();});
  // Respect a visitor who is reading: no autonomous wandering, sounds or page-scroll changes.
  bounds();stateTo('idle');
  ['idle','sit','sleep','run','actions','groom'].forEach(load);
  syncPause();
})();
