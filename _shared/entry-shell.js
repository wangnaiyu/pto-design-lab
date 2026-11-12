/*
  PTO Design Lab — 条目页薄外壳（原创）
  owner: Claude（Batch D 私有草稿）；F 审核后单向迁入 11-public/_shared/entry-shell.js

  注入契约（E 在 canonical 的唯一标记处替换为一行 script，见 notes/verification-2026-11-06.md）：
    <script src="../../_shared/entry-shell.js" data-entry="<entry-id>" data-mode="compact|bar" defer></script>
  - 站根与 catalog 一律以本脚本自身 URL 为基准解析（../ 与 ../_catalog.json），不从深链拼接
  - data-entry 缺省时从 <站根>/<intent>/<id>/ 路径推出；data-mode 缺省时 Demo 用 compact，其余用 bar
  - 自动加载同目录 entry-shell.css；catalog 读取失败时仍保留返回首页与 GitHub
  - 只读同源资源；不写 storage，只读取站点主题键 pto-design-lab:theme
*/
(function () {
  'use strict';
  if (window.__pdlEntryShell) return;
  window.__pdlEntryShell = true;

  var GITHUB = 'https://github.com/wangnaiyu/pto-design-lab';
  var THEME_KEY = 'pto-design-lab:theme';

  var script = document.currentScript;
  if (!script) {
    var all = document.querySelectorAll('script[src*="entry-shell.js"]');
    script = all[all.length - 1];
  }
  if (!script) return;
  var shellBase = new URL('./', script.src);
  var siteRoot = new URL('../', script.src);
  var catalogUrl = new URL('../_catalog.json', script.src);

  function deriveEntry() {
    var explicit = script.getAttribute('data-entry');
    var rel = window.location.pathname.indexOf(siteRoot.pathname) === 0
      ? window.location.pathname.slice(siteRoot.pathname.length) : '';
    var parts = rel.split('/').filter(Boolean);
    return { id: explicit || parts[1] || '', intent: parts.length >= 2 ? parts[0] : '' };
  }

  function ensureCss() {
    // Pages without an icon otherwise request /favicon.ico outside the project root.
    // Preserve any entry-specific icon; the empty data icon has no network request.
    if (!document.querySelector('link[rel~="icon"]')) {
      var iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.href = 'data:,';
      document.head.appendChild(iconLink);
    }
    // 样式表由脚本自己注入，必须沿用脚本 URL 上的版本串，
    // 否则脚本更新了、样式表还会被浏览器按旧副本缓存（改完刷新看不到效果就是这么来的）。
    var version = '';
    try { version = new URL(script.src, window.location.href).search || ''; } catch (_e) { version = ''; }
    var href = new URL('entry-shell.css' + version, shellBase).href;
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) if (links[i].href === href) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function readTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    try { t = window.localStorage.getItem(THEME_KEY); } catch (_e) { t = null; }
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] == null) return;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'className') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function icon(path) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    svg.appendChild(p);
    return svg;
  }

  function vocabLabel(cat, intent, sub) {
    var res = { intent: '', sub: '' };
    ((cat && cat.vocabulary && cat.vocabulary.intents) || []).forEach(function (it) {
      if (!it || it.id !== intent) return;
      res.intent = String(it.label || it.id);
      (it.subs || []).forEach(function (s) { if (s && s.id === sub) res.sub = String(s.label || s.id); });
    });
    return res;
  }

  function relatedOf(cat, id) {
    var list = Array.isArray(cat && cat.entries) ? cat.entries : [];
    var byId = {};
    list.forEach(function (e) { if (e && typeof e.id === 'string') byId[e.id] = e; });
    var self = byId[id];
    if (!self) return { self: null, related: [] };
    var ids = [];
    (Array.isArray(self.related) ? self.related : []).forEach(function (r) { if (r !== id && byId[r] && ids.indexOf(r) < 0) ids.push(r); });
    list.forEach(function (e) {   // 只在一侧登记的关联，展示时补成双向
      if (e && e.id !== id && Array.isArray(e.related) && e.related.indexOf(id) >= 0 && ids.indexOf(e.id) < 0) ids.push(e.id);
    });
    return { self: self, related: ids.map(function (r) { return byId[r]; }) };
  }

  function build(cat) {
    var info = deriveEntry();
    var rel = relatedOf(cat, info.id);
    var self = rel.self;
    var intent = self ? self.intent : info.intent;
    var labels = vocabLabel(cat, intent, self && self.sub);
    var mode = script.getAttribute('data-mode');
    if (mode !== 'compact' && mode !== 'bar') {
      mode = (self && self.sub === 'demo') || document.querySelector('[data-ide-frame]') ? 'compact' : 'bar';
    }

    var shell = el('nav', { className: 'pdl-shell pdl-shell--' + mode, 'aria-label': 'PTO Design Lab 导航', 'data-pdl-theme': readTheme() });
    var row = el('div', { className: 'pdl-shell__row' });
    var extra = el('div', { className: 'pdl-shell__group pdl-shell__extra', id: 'pdlShellExtra' });

    var mark = el('span', { className: 'pdl-shell__mark', 'aria-hidden': 'true' });
    var toggle = el('button', {
      type: 'button', className: 'pdl-shell__btn pdl-shell__toggle', 'aria-expanded': 'false',
      'aria-controls': 'pdlShellExtra', 'aria-label': '展开 PTO Design Lab 导航', title: 'PTO Design Lab'
    }, [mark, icon('m9 6 6 6-6 6')]);

    var home = el('a', { className: 'pdl-shell__link pdl-shell__home', href: siteRoot.href }, [
      icon('M15 18l-6-6 6-6'), el('span', { text: 'PTO Design Lab' })
    ]);
    var lead = el('div', { className: 'pdl-shell__group' });
    if (mode === 'bar') lead.appendChild(mark.cloneNode(true));
    lead.appendChild(home);
    if (labels.intent) {
      var q = new URLSearchParams();
      q.set('tab', intent);
      if (self && self.sub) q.set('sub', self.sub);
      lead.appendChild(el('span', { className: 'pdl-shell__sep', 'aria-hidden': 'true', text: '/' }));
      lead.appendChild(el('a', { className: 'pdl-shell__link pdl-shell__intent', href: siteRoot.href + '?' + q.toString(), text: labels.intent }));
    }

    var tail = el('div', { className: 'pdl-shell__group' });
    if (rel.related.length) {
      var wrap = el('div', { className: 'pdl-shell__related' });
      var btn = el('button', { type: 'button', className: 'pdl-shell__btn', 'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': 'pdlShellRelated' }, [
        el('span', { text: '相关条目 ' + rel.related.length }), icon('m6 9 6 6 6-6')
      ]);
      var menu = el('ul', { className: 'pdl-shell__menu', id: 'pdlShellRelated', hidden: '' });
      rel.related.forEach(function (r) {
        var l = vocabLabel(cat, r.intent, r.sub);
        menu.appendChild(el('li', null, [el('a', { href: new URL(r.intent + '/' + r.id + '/', siteRoot).href }, [
          el('span', { text: String(r.title || r.id) }),
          el('small', { text: l.intent + (l.sub ? ' · ' + l.sub : '') })
        ])]));
      });
      var setMenu = function (open) {
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      btn.addEventListener('click', function () { setMenu(menu.hidden); });
      document.addEventListener('click', function (ev) { if (!wrap.contains(ev.target)) setMenu(false); });
      wrap.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { setMenu(false); btn.focus(); } });
      wrap.appendChild(btn);
      wrap.appendChild(menu);
      tail.appendChild(wrap);
    }
    tail.appendChild(el('a', { className: 'pdl-shell__link', href: GITHUB, target: '_blank', rel: 'noopener noreferrer' }, [
      el('span', { text: 'GitHub' }), icon('M7 17 17 7M8 7h9v9')
    ]));

    if (mode === 'compact') {
      extra.appendChild(lead);
      extra.appendChild(tail);
      row.appendChild(toggle);
      row.appendChild(extra);
      toggle.addEventListener('click', function () {
        var open = !shell.classList.contains('is-open');
        shell.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? '收起 PTO Design Lab 导航' : '展开 PTO Design Lab 导航');
      });
      shell.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && shell.classList.contains('is-open') && !shell.querySelector('.pdl-shell__menu:not([hidden])')) toggle.click();
      });
    } else {
      extra.removeAttribute('id');
      row.appendChild(lead);
      row.appendChild(tail);
    }
    shell.appendChild(row);

    if (mode === 'bar') {
      // 页面自带的跳转链接必须保持为第一个可聚焦元素，外壳插在它之后
      var first = document.body.firstElementChild;
      var skip = first && first.tagName === 'A' && /(^|\s)skip/i.test(first.className || '') ? first : null;
      document.body.insertBefore(shell, skip ? skip.nextSibling : document.body.firstChild);
    } else {
      document.body.appendChild(shell);
    }

    new MutationObserver(function () { shell.setAttribute('data-pdl-theme', readTheme()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function start() {
    ensureCss();
    fetch(catalogUrl.href, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (cat) { build(cat && cat.schemaVersion === 1 ? cat : null); })
      .catch(function () { build(null); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
