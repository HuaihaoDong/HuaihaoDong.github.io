/* ==========================================================================
   nav.js —— 导航栏交互：滚动毛玻璃 / 下拉 / 汉堡 / 手风琴 / 高亮
   ========================================================================== */
(function () {
  var navbar = document.getElementById('navbar');
  var dropdown = document.getElementById('aboutDropdown');
  var toggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mAbout = document.getElementById('mAbout');
  var mAboutSub = document.getElementById('mAboutSub');
  var isCoarse = window.matchMedia('(hover: none)').matches;

  if (!navbar) return;

  // 1. 滚动超过一屏后，导航栏切换毛玻璃
  function onScroll() {
    if (window.scrollY > window.innerHeight) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. 「关于我」下拉：桌面 hover 展开，移动端点击展开
  if (dropdown) {
    if (!isCoarse) {
      dropdown.addEventListener('mouseenter', function () { dropdown.classList.add('open'); });
      dropdown.addEventListener('mouseleave', function () { dropdown.classList.remove('open'); });
    }
    dropdown.addEventListener('click', function (e) {
      if (isCoarse) {
        e.preventDefault();
        dropdown.classList.toggle('open');
      }
    });
    // 点击下拉项后收起
    dropdown.querySelectorAll('.dropdown-menu a').forEach(function (a) {
      a.addEventListener('click', function () { dropdown.classList.remove('open'); });
    });
  }

  // 3. 汉堡菜单（平板/手机）
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileMenu.classList.remove('open'); });
    });
  }

  // 4. 移动端「关于我」手风琴
  if (mAbout && mAboutSub) {
    mAbout.addEventListener('click', function () {
      mAbout.classList.toggle('open');
      mAboutSub.classList.toggle('open');
    });
  }

  // 5. 当前页面高亮
  var path = (window.location.pathname.split('/').pop() || 'index.html').split('#')[0];
  document.querySelectorAll('.nav-links .nav-item[href], .nav-links .nav-item > a[href]').forEach(function (el) {
    var href = el.getAttribute('href') || '';
    if (href && href.indexOf(path) > -1) el.classList.add('active');
  });
  // 桌面「关于我」在 about 页也标为高亮
  if (path === 'about.html' && dropdown) dropdown.classList.add('active');
})();
