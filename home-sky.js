/* A photographic Milky Way, with the site's original interactive star links. */
(function () {
  'use strict';
  var sky = document.getElementById('sky'), stage = document.getElementById('stage');
  if (!sky || !stage) return;
  var ctx = sky.getContext('2d'), textCtx = stage.getContext('2d');
  if (!ctx || !textCtx) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var galaxyPhoto = new Image(), photoReady = false;
  var w, h, dpr, backdrop, stars, particles, charSize, pointer = null;
  var raf = null, previous = 0, skyAt = -Infinity, skyClock = 0, clock = 0, meteor = null, nextMeteor = 18;
  var seed = 57;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function hash(x, y) {
    var n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function noise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }
  function cloud(x, y) {
    return noise(x, y) * .52 + noise(x * 2.07, y * 2.07) * .27 + noise(x * 4.13, y * 4.13) * .14 + noise(x * 8.31, y * 8.31) * .07;
  }
  function makeCanvas(width, height) {
    var c = document.createElement('canvas'); c.width = width; c.height = height; return c;
  }
  function dot(c, x, y, r, alpha, color) {
    c.fillStyle = 'rgba(' + color + ',' + alpha + ')';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  function makeBackdrop() {
    var c = makeCanvas(Math.round(w * dpr), Math.round(h * dpr)), cctx = c.getContext('2d');
    cctx.scale(dpr, dpr);
    var base = cctx.createLinearGradient(0, 0, w * .25, h);
    base.addColorStop(0, '#050b18'); base.addColorStop(.6, '#0a1223'); base.addColorStop(1, '#0e1525');
    cctx.fillStyle = base; cctx.fillRect(0, 0, w, h);
    if (photoReady) {
      var fit = Math.max(w / galaxyPhoto.naturalWidth, h / galaxyPhoto.naturalHeight);
      var photoW = galaxyPhoto.naturalWidth * fit, photoH = galaxyPhoto.naturalHeight * fit;
      cctx.drawImage(galaxyPhoto, (w - photoW) * .53, (h - photoH) * .5, photoW, photoH);
      // Keep the photographic dust lanes legible; only shade the reading zones.
      var reading = cctx.createLinearGradient(0, 0, 0, h);
      reading.addColorStop(0, 'rgba(3,8,20,.28)');
      reading.addColorStop(.23, 'rgba(3,8,20,.12)');
      reading.addColorStop(.4, 'rgba(3,8,20,.62)');
      reading.addColorStop(.55, 'rgba(3,8,20,.08)');
      reading.addColorStop(1, 'rgba(3,8,20,.36)');
      cctx.fillStyle = reading; cctx.fillRect(0, 0, w, h);
      var edge = cctx.createRadialGradient(w * .53, h * .48, h * .12, w * .53, h * .48, Math.max(w, h) * .7);
      edge.addColorStop(0, 'rgba(2,6,17,0)'); edge.addColorStop(1, 'rgba(2,6,17,.38)');
      cctx.fillStyle = edge; cctx.fillRect(0, 0, w, h);
      return c;
    }
    // Diffuse galactic light and irregular dust, generated once at low resolution.
    var small = makeCanvas(Math.max(180, Math.round(w / 3)), Math.max(160, Math.round(h / 3)));
    var nctx = small.getContext('2d'), data = nctx.createImageData(small.width, small.height);
    for (var y = 0; y < small.height; y++) {
      for (var x = 0; x < small.width; x++) {
        var u = x / small.width, v = y / small.height;
        var spine = .83 - .67 * v + (noise(v * 3.6, 8) - .5) * .14;
        var distance = (u - spine) / .14;
        var band = Math.exp(-distance * distance * 1.35);
        var texture = cloud(u * 8.5 + 2, v * 7 + 13);
        var dust = noise(u * 12 + 7, v * 9 + 5);
        var light = band * Math.max(0, texture - .25) * (.3 + dust * .7);
        var i = (y * small.width + x) * 4;
        data.data[i] = 117; data.data[i + 1] = 130; data.data[i + 2] = 169;
        data.data[i + 3] = Math.round(light * 106);
      }
    }
    nctx.putImageData(data, 0, 0); cctx.drawImage(small, 0, 0, w, h);
    // Fine, mostly faint stars: a few bright points give the field depth.
    var n = Math.round(clamp(w * h / 1350, 260, 1500));
    for (var j = 0; j < n; j++) {
      var brightness = random(), warm = random() < .16;
      dot(cctx, random() * w, random() * h, .26 + Math.pow(brightness, 3) * .65,
        .12 + Math.pow(brightness, 2) * .5, warm ? '230,210,181' : '194,210,237');
    }
    // A denser scattering follows the galactic band without making a dotted stripe.
    for (var k = 0; k < n * .6; k++) {
      var v = random(), spread = (random() + random() + random() - 1.5) * .2;
      var u = .83 - .67 * v + spread;
      dot(cctx, u * w, v * h, .22 + random() * .38, .08 + random() * .22, '184,199,226');
    }
    var veil = cctx.createRadialGradient(w * .5, h * .43, 0, w * .5, h * .43, Math.max(w, h) * .72);
    veil.addColorStop(0, 'rgba(3,7,15,0)'); veil.addColorStop(1, 'rgba(2,5,12,.55)');
    cctx.fillStyle = veil; cctx.fillRect(0, 0, w, h);
    return c;
  }
  function makeStars() {
    stars = [];
    var n = Math.round(Math.min(w, h) / 7);
    for (var i = 0; i < n; i++) {
      stars.push({ x: random() * w, y: random() * h, r: .55 + random() * 1.05,
        vx: (random() - .5) * .22, vy: (random() - .5) * .22,
        phase: random() * Math.PI * 2, speed: .25 + random() * .42, glow: i % 8 === 0 });
    }
  }
  function makeText() {
    var fs = Math.min(200, w * .115), gap, rowGap;
    var off = makeCanvas(Math.round(w), Math.round(h)), octx = off.getContext('2d');
    do {
      octx.font = 'bold ' + fs + 'px Consolas, "Courier New", monospace';
      if (octx.measureText('Tiger Captain').width <= w * .86) break;
      fs -= 2;
    } while (fs > 12);
    gap = Math.max(3, Math.round(fs / 26)); rowGap = Math.ceil(gap * 1.3); charSize = gap * 1.6;
    octx.fillStyle = '#fff'; octx.textAlign = 'center'; octx.textBaseline = 'middle';
    octx.fillText('Tiger Captain', w / 2, h * .4);
    var data = octx.getImageData(0, 0, off.width, off.height).data; particles = [];
    for (var y = 0; y < h; y += rowGap) {
      for (var x = 0; x < w; x += gap) {
        if (data[(y * off.width + x) * 4 + 3] <= 128) continue;
        var mix = x / w;
        particles.push({ tx: x, ty: y, x: reduced.matches ? x : random() * w,
          y: reduced.matches ? y : random() * h, ch: random() < .5 ? '0' : '1',
          color: 'rgb(' + Math.round(224 - 86 * mix) + ',' + Math.round(168 - 46 * mix) + ',' + Math.round(120 + 56 * mix) + ')' });
      }
    }
  }
  function paintSky() {
    ctx.clearRect(0, 0, w, h); ctx.drawImage(backdrop, 0, 0, w, h);
    var step = reduced.matches ? 0 : Math.min(clock - skyClock, .1) * 60;
    skyClock = clock;
    for (var a = 0; a < stars.length; a++) {
      var moving = stars[a]; moving.x += moving.vx * step; moving.y += moving.vy * step;
      if (moving.x < -12) moving.x = w + 12; else if (moving.x > w + 12) moving.x = -12;
      if (moving.y < -12) moving.y = h + 12; else if (moving.y > h + 12) moving.y = -12;
    }
    // Preserve the original drifting star links, on top of the deeper sky.
    ctx.lineWidth = .7;
    for (var l = 0; l < stars.length; l++) {
      for (var b = l + 1; b < stars.length; b++) {
        var dx = stars[l].x - stars[b].x, dy = stars[l].y - stars[b].y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= 118) continue;
        ctx.strokeStyle = 'rgba(180,200,235,' + ((1 - distance / 118) * .22) + ')';
        ctx.beginPath(); ctx.moveTo(stars[l].x, stars[l].y); ctx.lineTo(stars[b].x, stars[b].y); ctx.stroke();
      }
    }
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], alpha = reduced.matches ? .65 : .45 + .26 * Math.sin(clock * s.speed + s.phase);
      if (s.glow) {
        var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
        glow.addColorStop(0, 'rgba(184,207,245,' + alpha * .21 + ')'); glow.addColorStop(1, 'rgba(184,207,245,0)');
        ctx.fillStyle = glow; ctx.fillRect(s.x - s.r * 6, s.y - s.r * 6, s.r * 12, s.r * 12);
      }
      dot(ctx, s.x, s.y, s.r, alpha, '210,224,246');
    }
    if (!reduced.matches && clock >= nextMeteor && !meteor) {
      meteor = { at: clock, x: w * (.25 + random() * .65), y: h * (.08 + random() * .2) };
      nextMeteor = clock + 24 + random() * 22;
    }
    if (meteor) {
      var age = clock - meteor.at;
      if (age > 1.2) meteor = null;
      else {
        var x = meteor.x - age * w * .13, y = meteor.y + age * h * .1;
        var length = Math.min(90, w * .075), fade = Math.sin(age / 1.2 * Math.PI) * .38;
        var trail = ctx.createLinearGradient(x, y, x + length, y - length * .5);
        trail.addColorStop(0, 'rgba(213,226,248,' + fade + ')'); trail.addColorStop(1, 'rgba(213,226,248,0)');
        ctx.strokeStyle = trail; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + length, y - length * .5); ctx.stroke();
      }
    }
  }
  function paintText(dt) {
    textCtx.clearRect(0, 0, w, h); textCtx.font = charSize + 'px Consolas, "Courier New", monospace';
    textCtx.textAlign = 'center'; textCtx.textBaseline = 'middle';
    var factor = 1 - Math.pow(.92, dt * 60);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (pointer && !reduced.matches) {
        var dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 12100 && d2 > .01) {
          var d = Math.sqrt(d2), push = (110 - d) / 110 * 26 * dt * 60;
          p.x += dx / d * push; p.y += dy / d * push;
        }
      }
      if (reduced.matches) { p.x = p.tx; p.y = p.ty; }
      else {
        p.x += (p.tx - p.x) * factor; p.y += (p.ty - p.y) * factor;
        if (random() < .02 * dt * 60) p.ch = random() < .5 ? '0' : '1';
      }
      textCtx.fillStyle = p.color; textCtx.fillText(p.ch, p.x, p.y);
    }
  }
  function frame(t) {
    raf = null;
    if (document.hidden) { previous = 0; return; }
    var dt = previous ? Math.min((t - previous) / 1000, .05) : 1 / 60;
    previous = t; clock += dt;
    // The distant sky needs only 24 fps; the interactive title stays fluid.
    if (t - skyAt >= 1000 / 24) { paintSky(); skyAt = t; }
    paintText(dt);
    if (!reduced.matches) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf !== null) cancelAnimationFrame(raf);
    previous = 0; skyAt = -Infinity;
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  function resize() {
    w = Math.max(1, Math.round(innerWidth)); h = Math.max(1, Math.round(innerHeight));
    dpr = Math.min(devicePixelRatio || 1, 2); seed = 57;
    [sky, stage].forEach(function (canvas) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    backdrop = makeBackdrop(); makeStars(); makeText(); meteor = null; start();
  }
  window.addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { pointer = null; });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') pointer = null; }, { passive: true });
  window.addEventListener('pointercancel', function () { pointer = null; });
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', function () { meteor = null; start(); });
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100); });
  resize();
  galaxyPhoto.decoding = 'async'; galaxyPhoto.fetchPriority = 'high';
  galaxyPhoto.onload = function () { photoReady = true; backdrop = makeBackdrop(); start(); };
  // The procedural sky remains available if the image cannot load.
  galaxyPhoto.src = 'assets/sky/cover-milkyway-v1.webp';
})();
