/* 全站导航：鼠标、触屏与键盘共用一套展开状态。 */
(function () {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  var dropdown = document.getElementById('aboutDropdown');
  var about = dropdown && dropdown.querySelector('.nav-about-toggle');
  var toggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mAbout = document.getElementById('mAbout');
  var mAboutSub = document.getElementById('mAboutSub');
  var desktop = window.matchMedia('(min-width: 1025px)');
  var openedByHover = false;
  function setDropdown(expanded) {
    if (!dropdown || !about) return;
    dropdown.classList.toggle('open', expanded);
    about.setAttribute('aria-expanded', String(expanded));
  }
  function setMobile(expanded) {
    if (!toggle || !mobileMenu) return;
    mobileMenu.classList.toggle('open', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? '关闭菜单' : '打开菜单');
    if (!expanded && mAbout && mAboutSub) {
      mAbout.classList.remove('open');
      mAboutSub.classList.remove('open');
      mAbout.setAttribute('aria-expanded', 'false');
    }
  }
  function onScroll() { navbar.classList.toggle('scrolled', window.scrollY > 16); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (about) {
    about.addEventListener('click', function (e) {
      var keepHoverOpen = e.detail > 0 && openedByHover;
      openedByHover = false;
      setDropdown(keepHoverOpen || about.getAttribute('aria-expanded') !== 'true');
    });
    dropdown.addEventListener('mouseenter', function () {
      if (window.matchMedia('(hover: hover)').matches) {
        openedByHover = about.getAttribute('aria-expanded') !== 'true';
        setDropdown(true);
      }
    });
    dropdown.addEventListener('mouseleave', function () {
      openedByHover = false;
      if (!dropdown.contains(document.activeElement)) setDropdown(false);
    });
    dropdown.addEventListener('focusout', function (e) {
      if (!dropdown.contains(e.relatedTarget)) setDropdown(false);
    });
    dropdown.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setDropdown(false); });
    });
  }
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () { setMobile(toggle.getAttribute('aria-expanded') !== 'true'); });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMobile(false); });
    });
    mobileMenu.addEventListener('focusout', function (e) {
      if (!navbar.contains(e.relatedTarget)) setMobile(false);
    });
  }
  if (mAbout && mAboutSub) {
    mAbout.addEventListener('click', function () {
      var expanded = mAbout.getAttribute('aria-expanded') !== 'true';
      mAbout.classList.toggle('open', expanded);
      mAboutSub.classList.toggle('open', expanded);
      mAbout.setAttribute('aria-expanded', String(expanded));
    });
  }
  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target)) { setDropdown(false); setMobile(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mobileMenu && mobileMenu.classList.contains('open')) { setMobile(false); toggle.focus(); }
    if (dropdown && dropdown.classList.contains('open')) { setDropdown(false); about.focus(); }
  });
  desktop.addEventListener('change', function () { setMobile(false); setDropdown(false); });
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (el) {
    var url = new URL(el.href, location.href);
    if (url.origin === location.origin && url.pathname.split('/').pop() === path && !url.hash) {
      el.classList.add('active'); el.setAttribute('aria-current', 'page');
    }
  });
  if (path === 'about.html' && dropdown) dropdown.classList.add('active');
})();
