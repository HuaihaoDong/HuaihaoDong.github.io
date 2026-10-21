(function () {
  'use strict';
  var dialog = document.getElementById('leaderDialog');
  if (!dialog) return;
  var leaders = {
    daydreamer: {
      name: '白日梦想家领队', poster: 'assets/leaders/daydreamer.jpg',
      paragraphs: [
        '生活难免枯燥，我们总在日复一日的奔波里，被现实推着向前。',
        '可总要留下些什么，属于自己。',
        '不必等待，梦里的远方，总有一天要亲自抵达；\n不必犹豫，心里的念头，总要有一次付诸行动。',
        '不必等到夜晚，清醒的时候，也可以做梦。',
        '生活也许无法一直如愿，但至少，我们可以在清醒的白昼里，做一场属于自己的梦。'
      ]
    },
    xiaoyang: { name: '小羊领队', poster: 'assets/leaders/xiaoyang.jpg', paragraphs: [] }
  };
  var intro = document.getElementById('leaderIntro');
  var content = dialog.querySelector('.leader-dialog-content');
  var previousOverflow = '', trigger = null;
  document.querySelectorAll('[data-leader]').forEach(function (button) {
    button.addEventListener('click', function () {
      var leader = leaders[button.dataset.leader];
      if (!leader || dialog.open) return;
      document.getElementById('leaderDialogTitle').textContent = leader.name;
      var poster = document.getElementById('leaderPoster');
      poster.src = leader.poster; poster.alt = leader.name + '的小组海报';
      intro.replaceChildren();
      leader.paragraphs.forEach(function (text) {
        var p = document.createElement('p'); p.textContent = text; intro.appendChild(p);
      });
      intro.hidden = !leader.paragraphs.length;
      content.classList.toggle('poster-only', !leader.paragraphs.length);
      trigger = button; previousOverflow = document.body.style.overflow;
      dialog.showModal(); dialog.scrollTop = 0; document.body.style.overflow = 'hidden';
      document.dispatchEvent(new CustomEvent('tiger-pause'));
    });
  });
  dialog.querySelector('.leader-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    document.dispatchEvent(new CustomEvent('tiger-resume'));
    if (trigger) trigger.focus({ preventScroll: true });
  });
})();
