(function () {
  'use strict';

  var page = document.body.dataset.hujiaPage;
  if (!page) return;

  var sections = {
    life: [
      ['all', '全部'], ['food', '美食'], ['scenery', '美景'], ['indoor', '室内游玩']
    ],
    outdoors: [
      ['all', '全部'], ['route', '路线'], ['gear', '装备'],
      ['knowledge', '知识'], ['experience', '运动体验']
    ]
  };
  var messageTypes = [
    ['all', '全部'], ['wish', '活动愿望'], ['suggestion', '建议与批评'],
    ['review', '评价'], ['other', '其他']
  ];
  var params = new URLSearchParams(window.location.search);
  var section = params.get('section') === 'outdoors' ? 'outdoors' : 'life';
  var filterOptions = page === 'voices' ? messageTypes : sections[section];
  var query = (params.get('q') || '').trim();
  var category = resolveCategory(params.get('category') || 'all', filterOptions);
  if (page === 'library') { document.querySelector('h1').textContent = section === 'outdoors' ? '户外资料库' : '吃喝玩乐'; document.title = (section === 'outdoors' ? '户外资料库' : '吃喝玩乐') + ' | 虎家'; }
  document.querySelectorAll('.h-nav a').forEach(function (link) {
    var destination = new URL(link.href);
    if (destination.pathname === window.location.pathname &&
        (page !== 'library' || destination.searchParams.get('section') === section)) {
      link.setAttribute('aria-current', 'page');
    }
  });
  var aboutMenu = document.getElementById('aboutDropdown');
  var aboutButton = document.querySelector('.h-about-toggle');
  var menuButton = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileAbout = document.getElementById('mAbout');
  function syncMenus() {
    if (aboutButton) aboutButton.setAttribute('aria-expanded', String(aboutMenu.classList.contains('open')));
    if (menuButton) menuButton.setAttribute('aria-expanded', String(mobileMenu.classList.contains('open')));
    if (mobileAbout) mobileAbout.setAttribute('aria-expanded', String(mobileAbout.classList.contains('open')));
  }
  if (aboutButton) aboutButton.addEventListener('click', function (event) {
    event.stopPropagation(); aboutMenu.classList.toggle('open'); syncMenus();
  });
  [aboutMenu, mobileMenu, mobileAbout].forEach(function (element) {
    if (element) new MutationObserver(syncMenus).observe(element, { attributes: true, attributeFilter: ['class'] });
  });
  if (aboutMenu) aboutMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function (event) { event.stopPropagation(); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    if (aboutMenu && aboutMenu.classList.contains('open')) { aboutMenu.classList.remove('open'); aboutButton.focus(); }
    if (mobileMenu && mobileMenu.classList.contains('open')) { mobileMenu.classList.remove('open'); menuButton.focus(); }
    syncMenus();
  });
  document.addEventListener('click', function (event) {
    if (aboutMenu && !aboutMenu.contains(event.target)) aboutMenu.classList.remove('open');
    if (mobileMenu && !mobileMenu.contains(event.target) && !menuButton.contains(event.target)) mobileMenu.classList.remove('open');
  });
  var data = null;
  var loading = false;
  var search = document.getElementById('hujiaSearch');

  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function string(value) {
    return typeof value === 'string' ? value : '';
  }

  function strings(value) {
    return Array.isArray(value) ? value.filter(function (item) {
      return typeof item === 'string' && item.trim();
    }) : [];
  }

  function resolveCategory(value, options) {
    var found = options.find(function (option) {
      return option[0] === value || option[1] === value;
    });
    return found ? found[0] : 'all';
  }

  function labelFor(value, options) {
    var found = options.find(function (option) {
      return option[0] === value || option[1] === value;
    });
    return found ? found[1] : string(value);
  }

  function safeLink(value, allowLocal) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      var url = allowLocal ? new URL(value, window.location.href) : new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      if (allowLocal && url.origin !== window.location.origin) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function writeQuery() {
    var url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (category !== 'all') url.searchParams.set('category', category);
    else url.searchParams.delete('category');
    if (page === 'library') url.searchParams.set('section', section);
    window.history.replaceState(null, '', url.href);
  }

  function empty(title, text) {
    var block = node('div', 'h-empty');
    block.appendChild(node('h3', 'h-empty-title', title));
    block.appendChild(node('p', '', text));
    return block;
  }

  function setStatus(id, text) {
    var target = document.getElementById(id);
    if (target) target.textContent = text;
  }

  function renderFilters(id, options) {
    var target = document.getElementById(id);
    if (!target) return;
    target.replaceChildren();
    options.forEach(function (option) {
      var button = node('button', 'h-filter', option[1]);
      button.type = 'button';
      button.dataset.category = option[0];
      button.setAttribute('aria-pressed', String(category === option[0]));
      button.addEventListener('click', function () {
        category = option[0];
        writeQuery();
        target.querySelectorAll('button').forEach(function (item) {
          item.setAttribute('aria-pressed', String(item.dataset.category === category));
        });
        if (data) renderSearchResults();
      });
      target.appendChild(button);
    });
  }

  function entryCard(entry) {
    var card = node('article', 'h-card h-entry');
    if (entry.id) card.id = 'entry-' + entry.id;
    var options = sections[entry.section] || sections.life;
    var top = node('div', 'h-card-top');
    top.appendChild(node('span', 'h-tag', labelFor(entry.category, options)));
    if (entry.location) top.appendChild(node('span', 'h-meta', entry.location));
    card.appendChild(top);
    card.appendChild(node('h3', '', entry.title));
    if (entry.summary) card.appendChild(node('p', 'h-summary', entry.summary));
    if (entry.budget) card.appendChild(node('p', 'h-meta', '参考花费 · ' + entry.budget));
    var tags = strings(entry.tags);
    if (tags.length) {
      var tagList = node('div', 'h-tags');
      tags.forEach(function (tag) { tagList.appendChild(node('span', 'h-tag h-tag-soft', tag)); });
      card.appendChild(tagList);
    }
    var details = node('details', 'h-detail');
    details.appendChild(node('summary', '', '展开阅读'));
    var body = node('div', 'h-detail-body');
    var paragraphs = strings(entry.body);
    paragraphs.forEach(function (paragraph) { body.appendChild(node('p', '', paragraph)); });
    if (!paragraphs.length) body.appendChild(node('p', 'h-meta', '更多体验和细节，后续继续补充。'));
    var names = strings(entry.contributors);
    if (names.length) body.appendChild(node('p', 'h-meta', '分享与补充 · ' + names.join('、')));
    if (entry.experienceDate) body.appendChild(node('p', 'h-meta', '体验／资料时间 · ' + entry.experienceDate));
    if (entry.updatedAt) body.appendChild(node('p', 'h-meta', '最近更新 · ' + entry.updatedAt));
    var source = safeLink(entry.sourceUrl, false);
    if (source) {
      var link = node('a', 'h-text-link', '查看原始资料 ↗');
      link.href = source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      body.appendChild(link);
    }
    details.appendChild(body);
    card.appendChild(details);
    return card;
  }

  function entryMatches(entry) {
    var entryCategory = resolveCategory(entry.category, sections[section]);
    if (category !== 'all' && category !== entryCategory) return false;
    if (!query) return true;
    var haystack = [entry.title, entry.summary, entry.location].concat(strings(entry.tags))
      .map(string).join(' ').toLocaleLowerCase();
    return haystack.indexOf(query.toLocaleLowerCase()) !== -1;
  }

  function renderLibrary() {
    var target = document.getElementById('libraryResults');
    if (!target) return;
    target.replaceChildren();
    var available = data.entries.filter(function (entry) { return entry.section === section; });
    var results = available.filter(entryMatches);
    if (!available.length && !query && category === 'all') {
      target.appendChild(empty('第一份分享，正在路上', section === 'outdoors'
        ? '路线、装备、知识与运动体验，会随着大家的分享慢慢补充。'
        : '好吃的、好看的、好玩的，会随着大家的分享慢慢补充。'));
      setStatus('resultStatus', '内容正在整理，欢迎以后再来看看。');
    } else if (!results.length) {
      target.appendChild(empty('暂时没有找到相关内容', '可以换个关键词，或选择“全部”再看看。'));
      setStatus('resultStatus', '没有匹配的内容');
    } else {
      results.forEach(function (entry) { target.appendChild(entryCard(entry)); });
      setStatus('resultStatus', '找到 ' + results.length + ' 份分享');
    }
  }

  function messageCard(message) {
    var card = node('article', 'h-card h-message');
    if (message.id) card.id = 'message-' + message.id;
    var top = node('div', 'h-card-top');
    top.appendChild(node('span', 'h-tag', labelFor(message.type, messageTypes)));
    var replied = message.reply && string(message.reply.text).trim();
    top.appendChild(node('span', 'h-status', replied ? '已回复' : '待回复'));
    card.appendChild(top);
    card.appendChild(node('blockquote', 'h-message-text', message.text));
    var byline = string(message.displayName) || '匿名朋友';
    if (message.submittedAt) byline += ' · ' + message.submittedAt;
    card.appendChild(node('p', 'h-meta', byline));
    var reply = node('div', 'h-reply');
    reply.appendChild(node('h3', '', '老虎的回复'));
    reply.appendChild(node('p', '', replied ? message.reply.text : '还没有回复。'));
    if (replied && message.reply.date) reply.appendChild(node('p', 'h-meta', message.reply.date));
    card.appendChild(reply);
    if (message.progress && string(message.progress.text).trim()) {
      var progress = node('div', 'h-progress');
      progress.appendChild(node('h3', '', '后续进展'));
      progress.appendChild(node('p', '', message.progress.text));
      if (message.progress.date) progress.appendChild(node('p', 'h-meta', message.progress.date));
      card.appendChild(progress);
    }
    return card;
  }

  function renderMessages() {
    var target = document.getElementById('messageResults');
    if (!target) return;
    target.replaceChildren();
    var results = data.messages.filter(function (message) {
      if (category !== 'all' && message.type !== category) return false;
      if (!query) return true;
      var haystack = [message.text, message.displayName, message.reply && message.reply.text]
        .map(string).join(' ').toLocaleLowerCase();
      return haystack.indexOf(query.toLocaleLowerCase()) !== -1;
    });
    if (!data.messages.length && !query && category === 'all') {
      target.appendChild(empty('想说的话，慢慢聊', '活动愿望、建议、批评和评价，都可以留在这里。整理好的留言和老虎的回复，会一起展示。'));
      setStatus('messageStatus', '留言正在整理，之后会陆续补充。');
    } else if (!results.length) {
      target.appendChild(empty('暂时没有找到相关留言', '可以换个关键词，或选择“全部”再看看。'));
      setStatus('messageStatus', '没有匹配的留言');
    } else {
      results.forEach(function (message) { target.appendChild(messageCard(message)); });
      setStatus('messageStatus', '共 ' + results.length + ' 条留言');
    }
  }

  function renderFriends() {
    var contributors = document.getElementById('contributorsList');
    if (contributors) {
      contributors.replaceChildren();
      data.contributors.forEach(function (person) {
        var card = node('li', 'h-person');
        card.appendChild(node('span', 'h-person-name', person.displayName));
        contributors.appendChild(card);
      });
      if (!data.contributors.length) contributors.appendChild(empty('谢谢一起共建的朋友', '大家的帮助，会陆续记录在这里。'));
    }
    var leaders = document.getElementById('leadersList');
    if (leaders && !leaders.hasAttribute("data-leaders-grid")) {
      leaders.replaceChildren();
      data.leaderProfiles.forEach(function (leader) {
        var card = node('article', 'h-leader');
        card.appendChild(node('h3', '', leader.name));
        var destination = safeLink(leader.link, true);
        if (destination) {
          var link = node('a', 'h-text-link', '认识这位朋友 ↗');
          link.href = destination;
          link.setAttribute('aria-label', '了解' + leader.name);
          card.appendChild(link);
        }
        leaders.appendChild(card);
      });
    }
    var encounters = document.getElementById('encounterList');
    if (encounters) {
      encounters.replaceChildren();
      // No encounter statistics have been supplied. A future schema must retain
      // the confirmed activity-based unit and the actual coverage period.
      encounters.appendChild(empty('一起走过的活动，慢慢记下来', '相遇按活动次数记录，不按天数累计。记录还在整理，确认后再和大家分享。'));
    }
  }

  function renderRecent() {
    var entries = document.getElementById('recentEntries');
    if (entries) {
      entries.replaceChildren();
      if (!data.entries.length) {
        entries.appendChild(empty('第一份分享，正在路上', '从一家喜欢的小店，到一段走过的路线，一起把虎家慢慢填满。'));
      } else {
        data.entries.slice().sort(function (a, b) {
          return string(b.updatedAt).localeCompare(string(a.updatedAt));
        }).slice(0, 3).forEach(function (entry) {
          var card = node('article', 'h-card h-recent');
          card.appendChild(node('span', 'h-tag', labelFor(entry.category, sections[entry.section] || sections.life)));
          var title = node('h3');
          var link = node('a', '', entry.title);
          link.href = 'hujia-library.html?section=' + encodeURIComponent(entry.section === 'outdoors' ? 'outdoors' : 'life')
            + '#entry-' + encodeURIComponent(entry.id);
          title.appendChild(link);
          card.appendChild(title);
          if (entry.summary) card.appendChild(node('p', '', entry.summary));
          entries.appendChild(card);
        });
      }
    }
    var messages = document.getElementById('recentMessages');
    if (messages) {
      messages.replaceChildren();
      var replies = data.messages.filter(function (message) {
        return message.reply && string(message.reply.text).trim();
      }).sort(function (a, b) {
        return string(b.reply.date).localeCompare(string(a.reply.date));
      });
      if (!replies.length) {
        messages.appendChild(empty('你的想法，放在心上', '整理好的留言和回复，会在这里和大家见面。'));
      } else {
        replies.slice(0, 2).forEach(function (message) {
          var card = messageCard(message);
          var link = node('a', 'h-text-link', '查看留言与回复 →');
          link.href = 'hujia-voices.html#message-' + encodeURIComponent(message.id);
          card.appendChild(link);
          messages.appendChild(card);
        });
      }
    }
  }

  function renderSearchResults() {
    if (page === 'library') renderLibrary();
    if (page === 'voices') renderMessages();
  }

  function showLoadError() {
    var ids = ['libraryResults', 'messageResults', 'contributorsList', 'leadersList', 'encounterList', 'recentEntries', 'recentMessages'];
    ids.forEach(function (id) {
      var target = document.getElementById(id);
      if (!target || target.hasAttribute('data-leaders-grid')) return;
      target.replaceChildren();
      var error = node(target.tagName === 'UL' || target.tagName === 'OL' ? 'li' : 'div', 'h-error');
      error.appendChild(node('p', '', '内容暂时没有加载成功，请重试。'));
      var button = node('button', 'h-retry', '重新加载');
      button.type = 'button';
      button.addEventListener('click', loadData);
      error.appendChild(button);
      target.appendChild(error);
    });
    setStatus('resultStatus', '加载失败');
    setStatus('messageStatus', '加载失败');
  }

  function loadData() {
    if (loading) return;
    loading = true;
    document.querySelectorAll('.h-retry').forEach(function (button) {
      button.disabled = true;
      button.textContent = '正在加载…';
    });
    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 15000);
    fetch('hujia-data.json', { cache: 'no-cache', signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('Unable to load hujia content');
        return response.json();
      })
      .then(function (result) {
        ['entries', 'messages', 'contributors', 'leaderProfiles', 'encounters'].forEach(function (key) {
          if (!Array.isArray(result[key])) throw new Error('Invalid hujia content');
        });
        data = result;
        renderSearchResults();
        renderFriends();
        renderRecent();
        if (window.location.hash) {
          var targetId;
          try { targetId = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { targetId = ''; }
          var anchor = document.getElementById(targetId);
          if (anchor) anchor.scrollIntoView({ block: 'start' });
        }
      })
      .catch(function () { showLoadError(); })
      .finally(function () { window.clearTimeout(timeout); loading = false; });
  }

  if (page === 'library') renderFilters('categoryFilters', sections[section]);
  if (page === 'voices') renderFilters('messageFilters', messageTypes);
  if (search) {
    search.value = query;
    search.addEventListener('input', function () {
      query = search.value.trim();
      writeQuery();
      if (data) renderSearchResults();
    });
    if (search.form) search.form.addEventListener('submit', function (event) { event.preventDefault(); });
  }
  loadData();
})();
