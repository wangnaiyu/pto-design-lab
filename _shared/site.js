/*
  PTO Design Lab — 公开导航首页逻辑（原创）
  owner: Claude（Batch D 私有草稿）；F 审核后单向迁入 11-public/_shared/site.js
  - 只读取同源 ./_catalog.json（catalog v1，见实施包 §3.3）；词表从 catalog.vocabulary 读取，前端不另存第二份
  - 所有 catalog / URL 文本一律经 textContent 或属性写入，不拼 HTML
  - 筛选状态写入 query：tab / sub / topic（可重复）/ gen（可重复，兼容 A5、A2/A3 别名）/ q
*/
(function () {
  'use strict';

  var SITE = {
    themeKey: 'pto-design-lab:theme',
    github: 'https://github.com/wangnaiyu/pto-design-lab',
    catalogUrl: './_catalog.json',
    trackId: 'pto-basics',
    defaultTab: 'research'
  };

  /* ---------- storage：禁用或抛错时退化为内存 ---------- */
  var memoryStore = {};
  var store = {
    get: function (key) {
      try { var v = window.localStorage.getItem(key); return v == null ? memoryStore[key] || null : v; }
      catch (_e) { return memoryStore[key] || null; }
    },
    set: function (key, value) {
      memoryStore[key] = value;
      try { window.localStorage.setItem(key, value); } catch (_e) { /* storage 不可用时只保留本次会话 */ }
    }
  };

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }
  // hidden 的 IDL 属性只定义在 HTMLElement 上；对 <svg> 赋值 el.hidden 只会写一个
  // JS expando，不会生成 hidden 内容属性，CSS 的 [hidden] 也就永远匹配不上。
  // 图标是 SVG，必须直接操作属性。
  function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }
  function paintThemeButton() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var dark = effectiveTheme() === 'dark';
    btn.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题');
    btn.setAttribute('title', dark ? '浅色主题' : '深色主题');
    setHidden(btn.querySelector('[data-icon="moon"]'), dark);   // 深色时显示太阳（点击回到浅色）
    setHidden(btn.querySelector('[data-icon="sun"]'), !dark);
  }
  function initTheme() {
    var saved = store.get(SITE.themeKey);
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    paintThemeButton();
    document.getElementById('themeToggle').addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set(SITE.themeKey, next);
      paintThemeButton();
    });
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', paintThemeButton);
  }

  /* ---------- DOM 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'className') node.className = v;
      else node.setAttribute(k, v === true ? '' : String(v));
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* ---------- 原创几何封面（cover.webp 缺失时的前端回退，不是素材） ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function fallbackCover(entry) {
    var h = hash(entry.id);
    var svg = svgEl('svg', { viewBox: '0 0 320 180', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'xMidYMid slice' });
    var color = 'var(--' + entry.intent + ')';
    svg.appendChild(svgEl('rect', { width: '320', height: '180', fill: 'var(--surface-2)' }));
    var lanes = 3 + (h % 3);
    for (var i = 0; i < lanes; i++) {
      var y = 26 + i * (128 / lanes);
      var seed = hash(entry.id + ':' + i);
      var x = 18 + (seed % 70);
      var w = 60 + ((seed >>> 7) % 150);
      svg.appendChild(svgEl('rect', { x: '18', y: String(y + 9), width: '284', height: '1', fill: 'var(--line-strong)' }));
      svg.appendChild(svgEl('rect', {
        x: String(x), y: String(y), width: String(Math.min(w, 302 - x)), height: '18', rx: '9',
        fill: color, opacity: String(0.28 + (i % 3) * 0.2)
      }));
    }
    svg.appendChild(svgEl('circle', { cx: String(250 + (h % 40)), cy: String(40 + ((h >>> 5) % 30)), r: '16', fill: 'none', stroke: color, 'stroke-width': '3' }));
    return svg;
  }

  /* ---------- catalog 读取与规范化 ---------- */
  var V = null;            // vocabulary
  var entries = [];        // 规范化后的条目
  var byId = {};
  var intentOrder = [];
  var intentMap = {};      // id -> {label, subs:[{id,label}]}
  var topicLabel = {};
  var topicOrder = [];
  var genLabel = {};
  var genOrder = [];
  var genAlias = {};       // 大小写无关别名 -> id

  function asList(v) { return Array.isArray(v) ? v : []; }
  function normalizeVocabulary(cat) {
    V = cat && cat.vocabulary ? cat.vocabulary : {};
    asList(V.intents).forEach(function (it) {
      if (!it || typeof it.id !== 'string') return;
      intentOrder.push(it.id);
      intentMap[it.id] = {
        label: String(it.label || it.id),
        subs: asList(it.subs).filter(function (s) { return s && typeof s.id === 'string'; })
          .map(function (s) { return { id: s.id, label: String(s.label || s.id) }; })
      };
    });
    asList(V.topics).forEach(function (t) {
      if (!t || typeof t.id !== 'string') return;
      topicOrder.push(t.id); topicLabel[t.id] = String(t.label || t.id);
    });
    asList(V.gens).forEach(function (g) {
      if (!g || typeof g.id !== 'string') return;
      genOrder.push(g.id); genLabel[g.id] = String(g.label || g.id);
      genAlias[g.id.toLowerCase()] = g.id;
      genAlias[String(g.label || '').toLowerCase()] = g.id;
      asList(g.aliases).forEach(function (a) { genAlias[String(a).toLowerCase()] = g.id; });
    });
  }
  function subLabel(intent, sub) {
    var it = intentMap[intent];
    if (!it || !sub) return '';
    for (var i = 0; i < it.subs.length; i++) if (it.subs[i].id === sub) return it.subs[i].label;
    return '';
  }
  function normalizeEntries(cat) {
    var seen = {};
    asList(cat && cat.entries).forEach(function (raw) {
      if (!raw || typeof raw.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw.id)) return;
      if (seen[raw.id] || !intentMap[raw.intent]) return;
      var it = intentMap[raw.intent];
      var sub = it.subs.length ? raw.sub : null;
      if (it.subs.length && !subLabel(raw.intent, sub)) return;
      seen[raw.id] = true;
      var e = {
        id: raw.id,
        title: String(raw.title || raw.id),
        summary: String(raw.summary || ''),
        cover: typeof raw.cover === 'string' ? raw.cover : null,
        intent: raw.intent,
        sub: sub,
        topics: asList(raw.topics).filter(function (t) { return topicLabel[t]; }),
        gens: asList(raw.gens).filter(function (g) { return genLabel[g]; }),
        readMin: Number.isInteger(raw.readMin) && raw.readMin > 0 ? raw.readMin : null,
        wip: raw.wip === true,
        featured: raw.featured === true,
        track: raw.track && raw.track.id === SITE.trackId && Number.isInteger(raw.track.step) && raw.intent === 'research' && sub === 'domain' ? raw.track : null,
        order: entries.length
      };
      entries.push(e); byId[e.id] = e;
    });
  }
  function hrefOf(e) { return e.intent + '/' + e.id + '/'; }
  // 封面不限 webp：catalog 给了 cover 就按它取；没给就依次探测常见格式，都没有才回退几何封面。
  var COVER_NAMES = ['cover.webp', 'cover.png', 'cover.jpg', 'cover.jpeg', 'cover.avif', 'cover.svg'];
  function coverCandidates(e) {
    var base = hrefOf(e) + 'assets/';
    if (e && typeof e.cover === 'string' && e.cover) {
      return [/^(https?:)?\/\//.test(e.cover) || e.cover.indexOf('/') === 0 ? e.cover : base + e.cover];
    }
    return COVER_NAMES.map(function (n) { return base + n; });
  }
  function showsReadMin(e) { return e.readMin && (e.intent === 'research' || (e.intent === 'design' && e.sub === 'report')); }

  /* ---------- 状态 ---------- */
  var state = { tab: SITE.defaultTab, sub: null, topics: [], gens: [], q: '' };

  function firstSub(tab) { var it = intentMap[tab]; return it && it.subs.length ? it.subs[0].id : null; }
  function tabValues(tab, key) {
    var have = {};
    entries.forEach(function (e) { if (e.intent === tab) e[key].forEach(function (v) { have[v] = true; }); });
    return (key === 'topics' ? topicOrder : genOrder).filter(function (v) { return have[v]; });
  }
  function pruneTags() {
    var t = tabValues(state.tab, 'topics'), g = tabValues(state.tab, 'gens');
    state.topics = state.topics.filter(function (v) { return t.indexOf(v) >= 0; });
    state.gens = state.gens.filter(function (v) { return g.indexOf(v) >= 0; });
  }
  function uniq(list) { return list.filter(function (v, i) { return list.indexOf(v) === i; }); }

  function readQuery() {
    var p = new URLSearchParams(window.location.search);
    var tab = p.get('tab');
    state.tab = intentMap[tab] ? tab : (intentMap[SITE.defaultTab] ? SITE.defaultTab : intentOrder[0]);
    var sub = p.get('sub');
    state.sub = subLabel(state.tab, sub) ? sub : firstSub(state.tab);
    state.topics = uniq(p.getAll('topic').filter(function (t) { return topicLabel[t]; }));
    state.gens = uniq(p.getAll('gen').map(function (g) { return genAlias[String(g).toLowerCase()]; }).filter(Boolean));
    state.q = (p.get('q') || '').trim().slice(0, 80);
    pruneTags();
  }
  function queryString() {
    var p = new URLSearchParams();
    p.set('tab', state.tab);
    if (state.sub) p.set('sub', state.sub);
    state.topics.forEach(function (t) { p.append('topic', t); });
    state.gens.forEach(function (g) { p.append('gen', g); });
    if (state.q) p.set('q', state.q);
    return '?' + p.toString();
  }
  function isDefaultState() {
    return state.tab === SITE.defaultTab && state.sub === firstSub(SITE.defaultTab) && !state.topics.length && !state.gens.length && !state.q;
  }
  function writeQuery(mode) {
    var url = isDefaultState() ? window.location.pathname : window.location.pathname + queryString();
    if (url === window.location.pathname + window.location.search) return;
    try { window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url); } catch (_e) { /* sandbox */ }
  }

  /* ---------- 匹配 ---------- */
  function textHit(e) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    var hay = [e.title, e.summary, subLabel(e.intent, e.sub)]
      .concat(e.topics.map(function (t) { return topicLabel[t]; }))
      .concat(e.gens.map(function (g) { return genLabel[g]; }))
      .join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }
  function anyOf(have, want) {
    if (!want.length) return true;
    for (var i = 0; i < want.length; i++) if (have.indexOf(want[i]) >= 0) return true;
    return false;
  }
  function tagMatch(e) { return anyOf(e.topics, state.topics) && anyOf(e.gens, state.gens); }
  function visibleEntries() {
    var list = entries.filter(function (e) {
      return e.intent === state.tab && (!state.sub || e.sub === state.sub) && tagMatch(e) && textHit(e);
    });
    return list.sort(function (a, b) { return (b.featured - a.featured) || (a.order - b.order); });
  }

  /* ---------- 渲染 ---------- */
  function renderTabs() {
    var wrap = $('tabs');
    clear(wrap);
    intentOrder.forEach(function (id) {
      var selected = id === state.tab;
      var btn = el('button', {
        type: 'button', role: 'tab', id: 'tab-' + id, className: 'tab', 'data-tab': id,
        'aria-selected': selected ? 'true' : 'false', 'aria-controls': 'results', tabindex: selected ? '0' : '-1'
      }, [el('span', { text: intentMap[id].label })]);
      if (state.q) {
        var n = entries.filter(function (e) { return e.intent === id && textHit(e); }).length;
        btn.appendChild(el('span', { className: 'tab__count', text: String(n), 'aria-label': '命中 ' + n + ' 条' }));
      }
      wrap.appendChild(btn);
    });
  }

  function chipGroup(containerId, groupId, values, labels, selected, key) {
    var box = $(containerId);
    clear(box);
    $(groupId).hidden = !values.length;
    values.forEach(function (v) {
      var attrs = { type: 'button', className: 'chip', 'aria-pressed': selected.indexOf(v) >= 0 ? 'true' : 'false', text: labels[v] };
      attrs['data-' + key] = v;
      box.appendChild(el('button', attrs));
    });
  }

  function renderSide() {
    var it = intentMap[state.tab];
    var cats = $('cats');
    clear(cats);
    $('catGroup').hidden = !it.subs.length;
    it.subs.forEach(function (s) {
      cats.appendChild(el('button', {
        type: 'button', className: 'cat', 'data-sub': s.id,
        'aria-pressed': s.id === state.sub ? 'true' : 'false', text: s.label
      }));
    });
    chipGroup('topics', 'topicGroup', tabValues(state.tab, 'topics'), topicLabel, state.topics, 'topic');
    chipGroup('gens', 'genGroup', tabValues(state.tab, 'gens'), genLabel, state.gens, 'gen');
  }

  function renderTrack(main) {
    if (!(state.tab === 'research' && state.sub === 'domain')) return;
    var track = asList(V.tracks).filter(function (t) { return t && t.id === SITE.trackId; })[0];
    var steps = entries.filter(function (e) { return e.track; }).sort(function (a, b) { return a.track.step - b.track.step; });
    var section = el('section', { className: 'track', 'aria-labelledby': 'trackTitle' });
    section.appendChild(el('h2', { className: 'section-title', id: 'trackTitle', text: '学习路径' + (track && track.title ? ' · ' + track.title : '') }));
    if (!steps.length) {
      section.appendChild(el('p', { className: 'track__empty', text: '学习路径的内容正在整理，完成后会按顺序出现在这里。' }));
    } else {
      var ol = el('ol', { className: 'track__steps' });
      steps.forEach(function (e, i) {
        var dim = !(tagMatch(e) && textHit(e));
        var li = el('li', { className: 'track__step' + (dim ? ' is-dim' : '') }, [
          el('a', { className: 'track__link', href: hrefOf(e), title: e.title }, [
            el('small', { text: String(i + 1).padStart(2, '0') }),
            el('span', { text: e.title })
          ])
        ]);
        ol.appendChild(li);
      });
      section.appendChild(ol);
    }
    main.appendChild(section);
  }

  function card(e) {
    var cover = el('div', { className: 'card__cover' });
    var sources = coverCandidates(e);
    var at = 0;
    var img = el('img', { src: sources[at], alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () {
      at += 1;
      if (at < sources.length) { img.src = sources[at]; return; }
      if (img.parentNode === cover) cover.replaceChild(fallbackCover(e), img);
    });
    cover.appendChild(img);
    var sub = subLabel(e.intent, e.sub);
    var kicker = el('div', { className: 'card__kicker' }, [
      el('span', { className: 'card__dot', style: 'background:var(--' + e.intent + ')', 'aria-hidden': 'true' }),
      el('span', { text: intentMap[e.intent].label + (sub ? ' · ' + sub : '') })
    ]);
    var meta = el('div', { className: 'card__meta' });
    if (showsReadMin(e)) meta.appendChild(el('span', { className: 'read', text: '预估阅读 ' + e.readMin + ' 分钟' }));
    if (e.featured) meta.appendChild(el('span', { className: 'badge badge--featured', text: '精选' }));
    if (e.wip) meta.appendChild(el('span', { className: 'badge badge--wip', text: '进行中' }));
    var tags = el('div', { className: 'card__tags' });
    e.topics.forEach(function (t) { tags.appendChild(el('span', { className: 'tag' + (state.topics.indexOf(t) >= 0 ? ' is-on' : ''), text: topicLabel[t] })); });
    e.gens.forEach(function (g) { tags.appendChild(el('span', { className: 'tag' + (state.gens.indexOf(g) >= 0 ? ' is-on' : ''), text: genLabel[g] })); });
    return el('li', null, [el('a', { className: 'card', href: hrefOf(e) }, [
      cover, kicker, el('h3', { className: 'card__title', text: e.title }),
      e.summary ? el('p', { className: 'card__summary', text: e.summary }) : null, meta, tags
    ])]);
  }

  function renderMain() {
    var main = $('results');
    clear(main);
    main.setAttribute('aria-labelledby', 'tab-' + state.tab);
    renderTrack(main);
    var list = visibleEntries();
    if (state.q) {
      var note = el('p', { className: 'result-note', role: 'status' });
      note.appendChild(document.createTextNode('“' + state.q + '”在「' + intentMap[state.tab].label + '」中命中 ' + list.length + ' 条，其他分区的命中数显示在分区名旁。'));
      note.appendChild(document.createTextNode(' '));
      note.appendChild(el('button', { type: 'button', className: 'link-btn', 'data-action': 'clear-search', text: '清除搜索' }));
      main.appendChild(note);
    }
    var ul = el('ul', { className: 'cards', 'aria-label': '条目' });
    if (!list.length) {
      var empty = el('li', { className: 'empty' });
      var filtered = state.q || state.topics.length || state.gens.length;
      var inTab = entries.some(function (e) { return e.intent === state.tab && (!state.sub || e.sub === state.sub); });
      if (filtered && inTab) {
        empty.appendChild(el('strong', { text: '没有符合当前筛选的条目' }));
        empty.appendChild(el('span', { text: '可以减少标签或换个关键词。' }));
      } else {
        empty.appendChild(el('strong', { text: '这里还没有公开内容' }));
        empty.appendChild(el('span', { text: '内容完成整理后会陆续放在这里。' }));
      }
      ul.appendChild(empty);
    } else {
      list.forEach(function (e) { ul.appendChild(card(e)); });
    }
    main.appendChild(ul);
  }

  function render() {
    renderTabs();
    renderSide();
    renderMain();
    var input = $('search');
    if (input.value.trim() !== state.q && document.activeElement !== input) input.value = state.q;
  }

  /* ---------- 交互 ---------- */
  function setTab(id, focus) {
    if (!intentMap[id] || id === state.tab) return;
    state.tab = id;
    state.sub = firstSub(id);
    pruneTags();
    writeQuery('push');
    render();
    if (focus) { var t = $('tab-' + id); if (t) t.focus(); }
  }
  function toggle(list, v) { var i = list.indexOf(v); if (i < 0) list.push(v); else list.splice(i, 1); }
  function keepFocus(selector) {
    var n = document.querySelector(selector);
    if (n) n.focus();
  }

  function bind() {
    $('tabs').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tab]');
      if (b) setTab(b.getAttribute('data-tab'), false);
    });
    $('tabs').addEventListener('keydown', function (ev) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(ev.key) < 0) return;
      var i = intentOrder.indexOf(state.tab);
      var n = ev.key === 'Home' ? 0 : ev.key === 'End' ? intentOrder.length - 1
        : (i + (ev.key === 'ArrowRight' ? 1 : -1) + intentOrder.length) % intentOrder.length;
      ev.preventDefault();
      setTab(intentOrder[n], true);
    });
    $('side').addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var sel;
      if (b.hasAttribute('data-sub')) {
        var sub = b.getAttribute('data-sub');
        if (sub === state.sub) return;           // 分类始终单选，不可取消
        state.sub = sub; sel = '[data-sub="' + sub + '"]';
      } else if (b.hasAttribute('data-topic')) {
        toggle(state.topics, b.getAttribute('data-topic'));
        state.topics = topicOrder.filter(function (t) { return state.topics.indexOf(t) >= 0; });
        sel = '[data-topic="' + b.getAttribute('data-topic') + '"]';
      } else if (b.hasAttribute('data-gen')) {
        toggle(state.gens, b.getAttribute('data-gen'));
        state.gens = genOrder.filter(function (g) { return state.gens.indexOf(g) >= 0; });
        sel = '[data-gen="' + b.getAttribute('data-gen') + '"]';
      } else return;
      writeQuery('push');
      render();
      keepFocus('#side ' + sel);
    });
    $('results').addEventListener('click', function (ev) {
      if (ev.target.closest('[data-action="clear-search"]')) {
        state.q = ''; $('search').value = '';
        writeQuery('push'); render(); $('search').focus();
      }
    });
    var timer = null;
    var input = $('search');
    var composing = false;
    function applySearch() {
      var q = input.value.trim().slice(0, 80);
      if (q === state.q) return;
      var startNew = !state.q && q;
      state.q = q;
      writeQuery(startNew ? 'push' : 'replace');
      render();
    }
    input.addEventListener('compositionstart', function () { composing = true; });
    input.addEventListener('compositionend', function () { composing = false; applySearch(); });
    input.addEventListener('input', function () {
      if (composing) return;
      clearTimeout(timer); timer = setTimeout(applySearch, 120);
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && input.value) { input.value = ''; applySearch(); }
    });
    $('searchForm').addEventListener('submit', function (ev) { ev.preventDefault(); clearTimeout(timer); applySearch(); });
    window.addEventListener('popstate', function () { readQuery(); input.value = state.q; render(); });
  }

  function showLoadError() {
    var main = $('results');
    clear(main);
    main.appendChild(el('div', { className: 'empty', role: 'alert' }, [
      el('strong', { text: '目录暂时无法加载' }),
      el('span', { text: '请稍后刷新页面重试。' })
    ]));
  }

  function start() {
    initTheme();
    $('githubLink').setAttribute('href', SITE.github);
    fetch(SITE.catalogUrl, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('catalog ' + r.status); return r.json(); })
      .then(function (cat) {
        if (!cat || cat.schemaVersion !== 1) throw new Error('unsupported catalog');
        normalizeVocabulary(cat);
        if (!intentOrder.length) throw new Error('empty vocabulary');
        normalizeEntries(cat);
        readQuery();
        writeQuery('replace');   // 把别名、未知值和缺省项规范化到地址栏，分享链接与内部状态一致
        bind();
        render();
        document.body.setAttribute('data-ready', 'true');
      })
      .catch(function () { showLoadError(); document.body.setAttribute('data-ready', 'error'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
