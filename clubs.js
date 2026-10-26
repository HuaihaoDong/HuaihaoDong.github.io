(function () {
  'use strict';
  var list = document.getElementById('clubList');
  var selected = new URLSearchParams(location.search).get('club');
  function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function image(src, title) { return '<img src="' + esc(src) + '" alt="' + esc(title) + '" loading="lazy">'; }
  function card(href, cover, title, meta, summary) {
    return '<a class="event-card" href="' + esc(href) + '"><div class="event-cover">' + image(cover, title)
      + '</div><div class="event-info"><h2 class="event-title">' + esc(title) + '</h2>'
      + (meta ? '<div class="event-meta">' + meta + '</div>' : '')
      + '<p class="event-summary">' + esc(summary) + '</p></div></a>';
  }
  function read(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  Promise.all([read('clubs.json?v=20261026v1'), read('club-events.json?v=20261026v1')]).then(function (data) {
    var clubs = data[0], events = data[1];
    var club = clubs.find(function (c) { return c.id === selected; });
    if (!club) {
      list.className = 'club-select';
      list.innerHTML = clubs.map(function (c) {
        var count = events.filter(function (e) { return e.club === c.id; }).length;
        return card('clubs.html?club=' + encodeURIComponent(c.id), c.cover, c.name, '', count + ' 项活动记录 · 进入查看');
      }).join('');
      return;
    }
    document.title = club.name + ' · 活动记录 | Tiger Captain';
    document.getElementById('clubTitle').textContent = club.name;
    document.getElementById('clubIntro').textContent = '一起走过的山野，一路同行的伙伴。';
    var back = document.getElementById('clubBack'); back.href = 'clubs.html'; back.textContent = '← 返回骆驼社 & 凌峰社';
    var own = events.filter(function (e) { return e.club === club.id; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    list.innerHTML = own.map(function (e) {
      var href = 'detail.html?id=' + encodeURIComponent(e.id) + '&data=club-events.json&back=' + encodeURIComponent('clubs.html?club=' + club.id);
      var n = e.photos && e.photos.length;
      var meta = '<span class="tag">📅 ' + esc(e.date.replace(/-/g, '.')) + '</span><span class="tag">' + (n ? n + ' 张照片' : '照片待补充') + '</span>';
      return card(href, e.cover, e.title, meta, e.summary);
    }).join('') || '<p class="page-foot">活动记录待补充。</p>';
  }).catch(function () { list.innerHTML = '<p class="page-foot">活动数据加载失败，请刷新后重试。</p>'; });
})();
