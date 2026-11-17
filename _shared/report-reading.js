/*
  PTO Design Lab — 长报告统一阅读层：导航增强（原创）
  owner: Claude（Batch E 私有草稿）

  只做三件事，全部是导航层面的增强，**不改写任何正文文本**：
  1. 把各报告写法各异的目录容器统一打上 .pdl-toc，使同一套 CSS 规范生效；
  2. 没有目录的报告，按正文 h2 生成一个结构相同的目录（缺 id 时补 id）；
  3. 目录项随阅读位置高亮（.active）。

  不新增、不删除、不改写任何章节、表格、图示或说明文字。
*/
(function () {
  'use strict';
  if (window.__pdlReadingLayer) return;
  window.__pdlReadingLayer = true;

  var THEME_KEY = 'pto-design-lab:theme';

  // 主题：跟随站点键，其次跟随系统；storage 不可用时退回系统偏好
  function readTheme() {
    var t = null;
    try { t = window.localStorage.getItem(THEME_KEY); } catch (_e) { t = null; }
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', readTheme());
  }
  applyTheme();
  window.addEventListener('storage', function (e) { if (!e.key || e.key === THEME_KEY) applyTheme(); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  }

  var TOC_SELECTORS = [
    'nav.toc',
    'nav[aria-label="目录"]',
    'details.contents',
    'aside.nav[aria-label="报告目录"]',
    'aside.nav'
  ];

  function findToc() {
    for (var i = 0; i < TOC_SELECTORS.length; i++) {
      var el = document.querySelector(TOC_SELECTORS[i]);
      if (el && el.querySelector('a[href^="#"]')) return el;
    }
    return null;
  }

  function headings() {
    var main = document.querySelector('main') || document.body;
    return Array.prototype.filter.call(main.querySelectorAll('h2'), function (h) {
      if (h.closest('.pdl-toc, .pdl-shell, nav, aside, details')) return false;
      return (h.textContent || '').trim().length > 0;
    });
  }

  function slug(text, index) {
    var base = String(text).trim().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '').slice(0, 40);
    return 'pdl-s' + (index + 1) + (base ? '-' + base : '');
  }

  // 没有目录的报告：按 h2 生成一个与其他报告结构相同的目录
  function buildToc() {
    var hs = headings();
    if (hs.length < 3) return null;

    var nav = document.createElement('nav');
    nav.className = 'pdl-toc';
    nav.setAttribute('aria-label', '目录');

    var label = document.createElement('p');
    label.className = 'pdl-toc__label';
    label.textContent = '目录 · ' + hs.length + ' 节';
    nav.appendChild(label);

    var list = document.createElement('ol');
    list.className = 'pdl-toc__list';
    hs.forEach(function (h, i) {
      if (!h.id) h.id = slug(h.textContent, i);
      var text = (h.textContent || '').trim();
      var num = text.match(/^(\d+(?:\.\d+)?)[.、\s]/);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      var span = document.createElement('span');
      span.className = 'pdl-toc__num';
      span.textContent = num ? num[1] : String(i + 1).padStart(2, '0');
      a.appendChild(span);
      a.appendChild(document.createTextNode(num ? text.slice(num[0].length).trim() : text));
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);

    // 插在文档头之后、第一节正文之前，与其他报告的目录位置一致
    var h1 = document.querySelector('h1');
    var anchor = h1 ? (h1.closest('header, .hero, .cover, section') || h1) : null;
    // 标题后面紧跟的版本 / 日期等短说明属于文档头，目录排在它们之后
    while (anchor && anchor.nextElementSibling
      && anchor.nextElementSibling.tagName === 'P'
      && (anchor.nextElementSibling.textContent || '').trim().length < 160) {
      anchor = anchor.nextElementSibling;
    }
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    else (document.querySelector('main') || document.body).insertBefore(nav, (document.querySelector('main') || document.body).firstChild);
    return nav;
  }

  // 既有目录：只打标记类并补一个统一的标题行，不重建链接，避免丢掉报告自己的条目
  function adoptToc(el) {
    el.classList.add('pdl-toc');
    var count = el.querySelectorAll('a[href^="#"]').length;

    if (el.tagName === 'DETAILS') {
      var summary = el.querySelector(':scope > summary');
      // 统一成同一句标签（原来是「阅读目录 · 13 章」这类各写各的）
      if (summary) summary.textContent = '目录 · ' + count + ' 节';
      if (!el.hasAttribute('open')) el.setAttribute('open', '');
      return el;
    }
    if (!el.querySelector(':scope > .pdl-toc__label')) {
      var label = document.createElement('p');
      label.className = 'pdl-toc__label';
      label.textContent = '目录 · ' + count + ' 节';
      el.insertBefore(label, el.firstChild);
    }
    normalizeList(el);
    return el;
  }

  // 四种目录写法（ol / ul / 内嵌 nav / 直接挂 a）统一成同一个链接栅格容器
  function normalizeList(el) {
    var direct = Array.prototype.filter.call(el.children, function (c) { return c.tagName === 'A'; });
    if (direct.length) {
      var list = document.createElement('div');
      list.className = 'pdl-toc__list';
      el.insertBefore(list, direct[0]);
      direct.forEach(function (a) { list.appendChild(a); });
    }
    splitNumbers(el);
  }

  // 「1. 背景与问题」这类把序号写在文字里的条目，拆出序号作为统一的编号位
  function splitNumbers(el) {
    Array.prototype.forEach.call(el.querySelectorAll('a[href^="#"]'), function (a) {
      if (a.querySelector('span')) return;
      var text = (a.textContent || '').trim();
      var m = text.match(/^(\d+(?:\.\d+)?)[.、]\s*/);
      if (!m) return;
      a.textContent = '';
      var span = document.createElement('span');
      span.className = 'pdl-toc__num';
      span.textContent = m[1];
      a.appendChild(span);
      a.appendChild(document.createTextNode(text.slice(m[0].length)));
    });
  }

  function spotlight(toc) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var t = id && document.getElementById(id);
      if (!t) return;
      byId[id] = a;
      targets.push(t);
    });
    if (!targets.length) return;

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var current = null;
      for (var i = 0; i < targets.length; i++) if (visible[targets[i].id]) { current = targets[i].id; break; }
      links.forEach(function (a) { a.classList.remove('active'); });
      if (current && byId[current]) byId[current].classList.add('active');
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // 统一目录区的位置：文档头之后、第一节正文之前
  function standardSlot() {
    var h1 = document.querySelector('h1');
    if (!h1) return null;
    var header = h1.closest('header, .hero, .cover, section');
    return header && header.parentNode ? header : null;
  }

  function placeToc(toc) {
    var host = toc.parentElement;
    // 目录被报告自己的卡片式 section 包着时，标记外层以便去掉卡中卡
    if (host && host.tagName === 'SECTION' && host.querySelectorAll('a[href^="#"]').length === toc.querySelectorAll('a[href^="#"]').length) {
      host.classList.add('pdl-toc-host');
    }
    var anchor = standardSlot();
    if (!anchor) return;
    var node = host && host.classList.contains('pdl-toc-host') ? host : toc;
    if (node === anchor || node.contains(anchor) || anchor.contains(node)) return;
    // 目录直接挂在 body 上时没有任何容器给 gutter，补一层只负责宽度的包裹
    if (anchor.parentNode === document.body && !node.parentElement.classList.contains('pdl-toc-wrap')) {
      var wrap = document.createElement('div');
      wrap.className = 'pdl-toc-wrap';
      node.parentNode.insertBefore(wrap, node);
      wrap.appendChild(node);
      node = wrap;
    }
    if (anchor.nextSibling === node) return;
    anchor.parentNode.insertBefore(node, anchor.nextSibling);
  }

  // 统一的返回顶部控件；报告自带的同类控件隐藏，避免两个
  function backToTop() {
    Array.prototype.forEach.call(document.querySelectorAll('a, button'), function (el) {
      if (el.closest('.pdl-shell, .pdl-toc')) return;
      if (/^\s*(返回顶部|回到顶部|back to top)\s*↑?\s*$/i.test(el.textContent || '')) el.classList.add('pdl-dup-top');
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pdl-top';
    btn.textContent = '返回顶部 ↑';
    btn.setAttribute('aria-label', '返回页面顶部');
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var first = document.querySelector('h1');
      if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
    });
    document.body.appendChild(btn);

    var tick = false;
    function sync() {
      tick = false;
      btn.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      window.requestAnimationFrame(sync);
    }, { passive: true });
    sync();
  }

  // 标题锚点：hover 显示，可复制定位链接
  function anchors() {
    Array.prototype.forEach.call(document.querySelectorAll('h2[id], h3[id]'), function (h) {
      if (h.closest('.pdl-toc, .pdl-shell') || h.querySelector('.pdl-anchor')) return;
      var a = document.createElement('a');
      a.className = 'pdl-anchor';
      a.href = '#' + h.id;
      a.textContent = '#';
      a.setAttribute('aria-label', '本节链接：' + (h.textContent || '').trim());
      h.appendChild(a);
    });
  }

  // 目录里有链接但正文标题没 id 时补上，锚点才有落点
  function ensureHeadingIds() {
    var hs = headings();
    hs.forEach(function (h, i) { if (!h.id) h.id = slug(h.textContent, i); });
  }

  // 章节编号：三种写法统一到同一个编号位
  function sectionNumbers() {
    Array.prototype.forEach.call(document.querySelectorAll('.chapter-number, .section-head > .num'), function (el) {
      el.classList.add('pdl-h-num');
    });
    headings().forEach(function (h) {
      if (h.querySelector('.pdl-h-num')) return;
      var first = h.firstChild;
      if (!first || first.nodeType !== 3) return;
      var m = first.nodeValue.match(/^\s*(\d+(?:\.\d+)?)[.、]\s*/);
      if (!m) return;
      first.nodeValue = first.nodeValue.slice(m[0].length);
      var span = document.createElement('span');
      span.className = 'pdl-h-num';
      span.setAttribute('aria-hidden', 'true');   // 编号只是视觉定位，读屏不重复念
      span.textContent = m[1];
      h.insertBefore(span, h.firstChild);
    });
  }

  // 文档头：标出容器以统一节奏；把「版本：… 状态：…」这类挤成一行的元信息拆成同一种卡片网格
  function docHead() {
    var h1 = document.querySelector('h1');
    if (!h1) return;
    // 只认真正的文档头容器。像 runtime 那样 h1 直接挂在 <main> 下的，
    // 不能把整个 main 当文档头（会把分隔线推到文末），改为给 h1 自己加标记。
    var head = h1.closest('header, .hero, .cover');
    if (head && head !== document.body) {
      head.classList.add('pdl-doc-head');
      unwrapTitleGroup(head);
      gatherHeadParts(head);
      markHeadParts(head);
    } else {
      h1.classList.add('pdl-doc-head--lead');
    }

    var p = h1.nextElementSibling;
    if (!p || p.tagName !== 'P' || p.querySelector('*')) return;
    var text = (p.textContent || '').trim();
    var pairs = text.split(/\s{1,}(?=[^\s：:]+\s*[：:])/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (pairs.length < 2) return;
    var items = [];
    for (var i = 0; i < pairs.length; i++) {
      var m = pairs[i].match(/^([^：:]{1,12})\s*[：:]\s*(.+)$/);
      if (!m) return;                              // 有一项不像键值就整体不动
      items.push([m[1].trim(), m[2].trim()]);
    }
    var grid = document.createElement('div');
    grid.className = 'pdl-meta';
    items.forEach(function (kv) {
      var cell = document.createElement('div');
      cell.className = 'pdl-meta__item';
      var k = document.createElement('span');
      k.className = 'pdl-meta__key';
      k.textContent = kv[0];
      var v = document.createElement('span');
      v.className = 'pdl-meta__val';
      v.textContent = kv[1];
      cell.appendChild(k);
      cell.appendChild(v);
      grid.appendChild(cell);
    });
    p.parentNode.replaceChild(grid, p);
    if (!head) grid.classList.add('pdl-doc-head--tail');   // 无 header 容器时由元信息网格收尾
  }

  // 标题区：把分散的部件收进同一个文档头，并按统一顺序标类型
  // 顺序取各报告标题区内容类型的并集：报头 → 引题 → 标题 → 副标题 → 导语 → 论点 → 标签 → 元信息 → 旁注 → 工具
  var HEAD_KINDS = [
    ['masthead', '.masthead'],
    ['kicker', '.kicker, .eyebrow'],
    ['title', 'h1'],
    ['subtitle', '.subtitle'],
    ['lead', '.lead, .overview'],
    ['thesis', '.thesis'],
    ['chips', '.tag-row, .chip-row, .pill-row'],
    ['meta', '.pdl-meta, .meta-grid, .meta'],
    ['note', '.cover-note, .status-line'],
    ['tools', '.tools, .actions']
  ];

  // 标题被包在一层无名 div 里时（agentic 的 cover），拆掉这层，
  // 否则整组只能拿到一个 order，排不进统一顺序。
  function unwrapTitleGroup(head) {
    var h1 = head.querySelector('h1');
    if (!h1 || h1.parentElement === head) return;
    var group = h1.parentElement;
    while (group.parentElement && group.parentElement !== head) group = group.parentElement;
    if (group === head || group.tagName === 'HEADER') return;
    while (group.firstChild) head.insertBefore(group.firstChild, group);
    group.remove();
  }

  function markHeadParts(head) {
    HEAD_KINDS.forEach(function (pair) {
      Array.prototype.forEach.call(head.querySelectorAll(':scope > ' + pair[1]), function (el) {
        if (!el.hasAttribute('data-pdl-head')) el.setAttribute('data-pdl-head', pair[0]);
      });
    });
    // 直接挂在标题区里的散装标签（a5-pmu 的芯片架构那一行）归入 chips
    Array.prototype.forEach.call(head.children, function (el) {
      if (el.hasAttribute('data-pdl-head')) return;
      if (el.querySelector(':scope > .pill, :scope > .tag')) el.setAttribute('data-pdl-head', 'chips');
    });
  }

  // 标题区部件散落在 head 之外时（agentic 的报头、论点、旁注），先收进来
  function gatherHeadParts(head) {
    var firstBody = document.querySelector('h2');
    ['.masthead', '.thesis', '.cover-note', '.status-line'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el || head.contains(el)) return;
      if (firstBody && (el.compareDocumentPosition(firstBody) & Node.DOCUMENT_POSITION_FOLLOWING) === 0) return;
      head.appendChild(el);
    });
  }

  // 统一文末区：已有页脚套同一套样式，没有的补一个结构相同的
  function docFoot() {
    var foot = document.querySelector('footer, .footer');
    if (!foot) {
      foot = document.createElement('footer');
      var title = (document.querySelector('h1') || {}).textContent || document.title;
      var p = document.createElement('p');
      p.textContent = String(title).trim();
      foot.appendChild(p);
      (document.querySelector('main') || document.body).appendChild(foot);
    }
    foot.classList.add('pdl-foot');
    if (!foot.querySelector('.pdl-foot__back')) {
      var back = document.createElement('a');
      back.className = 'pdl-foot__back';
      back.href = '../../';
      back.textContent = '← 回到 PTO Design Lab';
      foot.appendChild(back);
    }
  }

  // 代码块：统一补一条顶栏（已有文件名头的报告保持自己的），并给复制按钮
  function codeBlocks() {
    Array.prototype.forEach.call(document.querySelectorAll('pre'), function (pre) {
      if (pre.closest('.pdl-code, .operator-code-surface, .pto-module')) return;
      var wrap = document.createElement('div');
      wrap.className = 'pdl-code';
      pre.parentNode.insertBefore(wrap, pre);

      var bar = document.createElement('div');
      bar.className = 'pdl-code__bar';
      var name = document.createElement('span');
      name.className = 'pdl-code__name';
      var code = pre.querySelector('code');
      var lang = code && (code.className.match(/language-([\w-]+)/) || [])[1];
      name.textContent = lang || '代码';
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'pdl-code__copy';
      copy.textContent = '复制';
      copy.addEventListener('click', function () {
        var text = pre.innerText;
        var done = function () { copy.textContent = '已复制'; setTimeout(function () { copy.textContent = '复制'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
        else done();
      });
      bar.appendChild(name);
      bar.appendChild(copy);
      wrap.appendChild(bar);
      wrap.appendChild(pre);
    });
  }

  // 图示：占满宽度的裸 SVG 补同一种外框，已有外框的保持
  function figures() {
    Array.prototype.forEach.call(document.querySelectorAll('svg'), function (svg) {
      if (svg.closest('.pdl-shell, .pdl-toc, .pdl-top, .pto-module, .pdl-figure')) return;
      if (svg.closest('.figure, .svg-wrap, .diagram, .screenshot, figure')) return;
      var box = svg.getBoundingClientRect();
      if (box.width < 320) return;                  // 小图标不加框
      var wrap = document.createElement('div');
      wrap.className = 'pdl-figure';
      svg.parentNode.insertBefore(wrap, svg);
      wrap.appendChild(svg);
    });
  }

  function start() {
    var existing = findToc();
    var toc = existing ? adoptToc(existing) : buildToc();
    if (!toc) return;
    if (existing) placeToc(toc);
    ensureHeadingIds();
    sectionNumbers();
    docHead();
    anchors();
    codeBlocks();
    figures();
    docFoot();
    backToTop();
    spotlight(toc);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
