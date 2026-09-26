/* ==========================================================================
   album.js —— 全站共享相册组件
   功能：点击照片放大灯箱（左右切换严格按照片顺序）、缩放（滚轮/双击/双指捏合/拖动平移）、
         瀑布流布局（按编号横向阅读顺序）、图片加载失败占位
   用法：
     Album.init(container, { masonry: true/false })  —— container 内是 .ph-item（内含 img[data-full]）
     masonry=true：绝对定位瀑布流（3列/移动2列），懒加载渐进重排
     masonry=false：布局交给页面自己的 CSS（如横向照片条），只挂灯箱交互
   ========================================================================== */
(function () {
  // —— 灯箱 DOM（首次使用时注入）——
  var lb = null, lbStage, lbZoom, lbImg, lbLoading, lbError, lbClose, lbPrev, lbNext, lbCounter;

  function ensureLightbox() {
    if (lb) return;
    var div = document.createElement('div');
    div.className = 'lb';
    div.id = 'lightbox';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-label', '照片预览');
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = '<div class="lb-stage" id="lbStage">'
      + '<div class="lb-zoom" id="lbZoom"><img class="lb-img" id="lbImg" alt=""></div>'
      + '<div class="lb-loading" id="lbLoading">加载中…</div>'
      + '<div class="lb-error" id="lbError">图片加载失败</div>'
      + '<button class="lb-close" id="lbClose" aria-label="关闭">×</button>'
      + '<button class="lb-prev" id="lbPrev" aria-label="上一张">‹</button>'
      + '<button class="lb-next" id="lbNext" aria-label="下一张">›</button>'
      + '<div class="lb-counter" id="lbCounter">1 / 1</div>'
      + '</div>';
    document.body.appendChild(div);
    lb = div;
    lbStage = document.getElementById('lbStage');
    lbZoom = document.getElementById('lbZoom');
    lbImg = document.getElementById('lbImg');
    lbLoading = document.getElementById('lbLoading');
    lbError = document.getElementById('lbError');
    lbClose = document.getElementById('lbClose');
    lbPrev = document.getElementById('lbPrev');
    lbNext = document.getElementById('lbNext');
    lbCounter = document.getElementById('lbCounter');
    bindLightboxEvents();
  }

  // —— 状态 ——
  var seq = [];
  var idx = 0;
  var open = false;
  var swipeStart = null;
  var justSwiped = false;
  var zoom = { s: 1, tx: 0, ty: 0 };
  var pinch = null;
  var panLast = null;

  function applyZoom() {
    if (zoom.s <= 1.01) {
      zoom.s = 1; zoom.tx = 0; zoom.ty = 0;
      lbZoom.style.transform = '';
    } else {
      lbZoom.style.transform = 'translate(' + zoom.tx + 'px,' + zoom.ty + 'px) scale(' + zoom.s + ')';
    }
  }
  function resetZoom() { zoom.s = 1; zoom.tx = 0; zoom.ty = 0; applyZoom(); }

  function clampPan() {
    var r = lbZoom.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var margin = 120;
    if (r.left < margin - r.width) zoom.tx += (margin - r.width) - r.left;
    else if (r.left > vw - margin) zoom.tx -= r.left - (vw - margin);
    if (r.top < margin - r.height) zoom.ty += (margin - r.height) - r.top;
    else if (r.top > vh - margin) zoom.ty -= r.top - (vh - margin);
  }

  function zoomAt(cx, cy, ns) {
    ns = Math.min(Math.max(ns, 1), 5);
    var r = lbZoom.getBoundingClientRect();
    if (!r.width) return;
    var px = (cx - r.left) / r.width;
    var py = (cy - r.top) / r.height;
    zoom.tx += (px - 0.5) * r.width * (zoom.s - ns) / zoom.s;
    zoom.ty += (py - 0.5) * r.height * (zoom.s - ns) / zoom.s;
    zoom.s = ns;
    clampPan();
    applyZoom();
  }

  function touchDist(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function fullSrc(el) {
    return el.getAttribute('data-full') || el.getAttribute('src');
  }

  function showImage() {
    var el = seq[idx];
    lbImg.src = fullSrc(el);
    lbImg.alt = el.alt || '';
    lbImg.classList.add('swap');
    lbError.classList.remove('show');
    lbLoading.classList.add('show');
    lbCounter.textContent = (idx + 1) + ' / ' + seq.length;
    lbPrev.classList.toggle('hide', idx === 0);
    lbNext.classList.toggle('hide', idx === seq.length - 1);
    resetZoom();
    preload();
  }

  function preload() {
    var nextEl = seq[idx + 1];
    var prevEl = seq[idx - 1];
    if (nextEl) { var n = new Image(); n.src = fullSrc(nextEl); }
    if (prevEl) { var p = new Image(); p.src = fullSrc(prevEl); }
  }

  function step(dir) {
    var target = idx + dir;
    if (target < 0 || target >= seq.length) return;
    idx = target;
    showImage();
  }

  function openLightbox(container, clickedEl) {
    ensureLightbox();
    seq = Array.prototype.slice.call(container.querySelectorAll('.ph-item img'));
    if (!seq.length) return;
    idx = seq.indexOf(clickedEl);
    if (idx < 0) idx = 0;
    open = true;
    document.body.style.paddingRight = (window.innerWidth - document.documentElement.clientWidth) + 'px';
    document.body.classList.add('lb-open');
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('open');
    showImage();
    lbClose.focus();
    document.dispatchEvent(new CustomEvent('tiger-pause'));
  }

  function closeLightbox() {
    open = false;
    document.body.classList.remove('lb-open');
    document.body.style.paddingRight = '';
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    lbLoading.classList.remove('show');
    lbError.classList.remove('show');
    document.dispatchEvent(new CustomEvent('tiger-resume'));
  }

  function bindLightboxEvents() {
    lbImg.addEventListener('load', function () {
      if (!open) return;
      lbImg.classList.remove('swap');
      lbLoading.classList.remove('show');
    });
    lbImg.addEventListener('error', function () {
      if (!open) return;
      lbLoading.classList.remove('show');
      lbError.classList.add('show');
      lbImg.classList.remove('swap');
    });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', function () { step(-1); });
    lbNext.addEventListener('click', function () { step(1); });

    lbStage.addEventListener('click', function (e) {
      if (justSwiped) return;
      if (e.target === lbStage) closeLightbox();
    });

    // 桌面缩放
    lbStage.addEventListener('wheel', function (e) {
      if (!open) return;
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.25 : 0.8;
      zoomAt(e.clientX, e.clientY, zoom.s * factor);
    }, { passive: false });

    lbImg.addEventListener('dblclick', function (e) {
      if (!open) return;
      e.preventDefault();
      if (zoom.s > 1.01) { resetZoom(); }
      else { zoomAt(e.clientX, e.clientY, 2); }
    });

    // 移动端：双指捏合 / 放大后拖动 / 1倍时横滑
    lbStage.addEventListener('touchstart', function (e) {
      if (!open) return;
      if (e.touches.length === 2) {
        pinch = {
          dist: touchDist(e),
          s: zoom.s,
          r: lbZoom.getBoundingClientRect(),
          cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          cy: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        swipeStart = null;
        panLast = null;
      } else if (e.touches.length === 1) {
        swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panLast = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty };
      }
    }, { passive: true });

    lbStage.addEventListener('touchmove', function (e) {
      if (!open) return;
      e.preventDefault();
      if (pinch && e.touches.length === 2) {
        var ns = Math.min(Math.max(pinch.s * (touchDist(e) / pinch.dist), 1), 5);
        var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        var r0 = pinch.r;
        if (r0.width) {
          var u = (pinch.cx - r0.left) / r0.width;
          var v = (pinch.cy - r0.top) / r0.height;
          var w0 = r0.width / pinch.s;
          var h0 = r0.height / pinch.s;
          zoom.s = ns;
          zoom.tx = mx - window.innerWidth / 2 + w0 * ns * (0.5 - u);
          zoom.ty = my - window.innerHeight / 2 + h0 * ns * (0.5 - v);
          clampPan();
          applyZoom();
        }
      } else if (panLast && e.touches.length === 1 && zoom.s > 1.01) {
        var t = e.touches[0];
        zoom.tx = panLast.tx + (t.clientX - panLast.x);
        zoom.ty = panLast.ty + (t.clientY - panLast.y);
        clampPan();
        applyZoom();
      }
    }, { passive: false });

    lbStage.addEventListener('touchend', function (e) {
      if (!open) return;
      if (pinch) pinch = null;
      if (e.touches.length === 1) {
        panLast = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty };
        swipeStart = null;
        return;
      }
      if (e.touches.length === 0 && zoom.s <= 1.01 && swipeStart) {
        var dx = e.changedTouches[0].clientX - swipeStart.x;
        var dy = e.changedTouches[0].clientY - swipeStart.y;
        if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          justSwiped = true;
          setTimeout(function () { justSwiped = false; }, 350);
          step(dx < 0 ? 1 : -1);
        }
      }
      swipeStart = null;
      panLast = null;
    });
  }

  // ==================== 对外接口 ====================

  function init(container, opts) {
    opts = opts || {};
    ensureLightbox();
    if (!container) return;

    // 点击缩略图打开灯箱（seq = 容器内照片顺序）
    container.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName === 'IMG' && t.closest('.ph-item')) {
        openLightbox(container, t);
      }
    });

    // 图片加载失败 → 占位（error 不冒泡，需 capture）
    container.addEventListener('error', function (e) {
      var t = e.target;
      if (t.tagName === 'IMG' && t.parentNode && t.parentNode.className === 'ph-item') {
        t.parentNode.innerHTML = '<div class="ph">图片加载失败</div>';
        if (opts.masonry) layoutMasonry(container);
      }
    }, true);

    if (opts.masonry) {
      var imgs = container.querySelectorAll('.ph-item img');
      for (var i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('load', function () { layoutMasonry(container); });
      }
      layoutMasonry(container);
      window.addEventListener('resize', function () { layoutMasonry(container); });
    }
  }

  // 瀑布流：按照片顺序从左到右放入最矮列
  function layoutMasonry(container) {
    if (!container) return;
    var cols = window.innerWidth <= 768 ? 2 : 3;
    var gap = 10;
    var colW = (container.clientWidth - gap * (cols - 1)) / cols;
    if (colW <= 0) return;
    var hs = [];
    for (var i = 0; i < cols; i++) hs.push(0);
    var items = container.querySelectorAll('.ph-item');
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var c = 0;
      for (var k = 1; k < cols; k++) { if (hs[k] < hs[c]) c = k; }
      item.style.width = colW + 'px';
      item.style.left = c * (colW + gap) + 'px';
      item.style.top = hs[c] + 'px';
      hs[c] += item.offsetHeight + gap;
    }
    container.style.height = (Math.max.apply(null, hs) - gap) + 'px';
  }

  window.Album = {
    init: init,
    masonry: layoutMasonry
  };
})();
