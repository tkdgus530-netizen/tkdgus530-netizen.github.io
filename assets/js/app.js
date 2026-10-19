/*
 * 결혼식 사회자 소개 사이트 — 화면 렌더링
 *
 * 내용은 data/site.json 에서 읽어 와서 그린다.
 * 글·후기·일정·사진을 바꾸려면 site.json 만 고치면 된다 (README.md 참고).
 */
(function () {
  'use strict';

  var DATA_URL = 'data/site.json';
  var app = document.getElementById('app');
  var state = null;

  // ===== 공통 도구 =====
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ml(s) { return esc(s).replace(/\n/g, '<br>'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  // 사진·링크는 허용한 형식만 쓴다
  function safeUrl(u, fallback) { u = String(u || '').trim(); return /^(https?:|mailto:|images\/)/i.test(u) ? u : fallback; }
  function mailHref() { return 'mailto:' + encodeURIComponent(state.contact.email || '').replace(/%40/g, '@') + '?subject=' + encodeURIComponent('결혼식 사회 문의'); }
  // 값이 있을 때만 태그를 만든다
  function tag(name, cls, value) {
    if (!value) return '';
    return '<' + name + (cls ? ' class="' + cls + '"' : '') + '>' + ml(value) + '</' + name + '>';
  }

  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function dateLabel(s) { var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return (+p[1]) + '월 ' + (+p[2]) + '일 (' + WD[d.getDay()] + ')'; }
  var TODAY = (function () { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth(), s: ymd(d.getFullYear(), d.getMonth(), d.getDate()) }; })();
  var cal = { y: TODAY.y, m: TODAY.m, sel: '' }; // 달력 화면 상태
  var firstRender = true;

  // ===== 후기 =====
  function visibleReviews() { return state.reviews.items.filter(function (it) { return it.text || it.image; }); }
  function dateStr(it) { return it.year ? it.year + '년' + (it.month ? ' ' + it.month + '월' : '') : ''; }
  function reviewWho(it) {
    var parts = [];
    if (it.author) parts.push('<span class="review-author">' + esc(it.author) + '</span>');
    var rest = [dateStr(it), it.meta].filter(Boolean).map(esc);
    if (rest.length) parts.push('<span class="review-meta">' + rest.join(' · ') + '</span>');
    return parts.length ? '<p class="review-who">' + parts.join(' · ') + '</p>' : '';
  }

  // ===== 예식 일정 =====
  var MIN_GAP = 60;                     // 이보다 짧은 빈 시간은 '비어 있음'으로 보지 않는다 (분)
  var T_MIN = 9 * 60, T_MAX = 21 * 60;  // 하루 기준 시간: 09:00 ~ 21:00
  function toMin(t) { var m = /^(\d{2}):(\d{2})$/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function fromMin(n) { return pad(Math.floor(n / 60)) + ':' + pad(n % 60); }
  function rangeText(it) { return (it.start || '시작 미정') + ' ~ ' + (it.end || '종료 미정'); }
  function bookingsOn(date) {
    return state.schedule.items
      .filter(function (it) { return it.date === date; })
      .sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); });
  }
  // 그날의 예약 구간과, 마감 여부를 계산한다
  function dayInfo(date) {
    var list = bookingsOn(date), busy = [];
    list.forEach(function (it) {
      var st = toMin(it.start); if (st == null) return;
      var en = toMin(it.end); if (en == null || en <= st) en = st + 60; // 종료가 없으면 1시간으로 본다
      busy.push([st, en]);
    });
    busy.sort(function (a, b) { return a[0] - b[0]; });
    var free = [], cur = T_MIN;
    busy.forEach(function (bk) { if (bk[0] > cur) free.push([cur, Math.min(bk[0], T_MAX)]); cur = Math.max(cur, bk[1]); });
    if (cur < T_MAX) free.push([cur, T_MAX]);
    free = free.filter(function (fr) { return fr[1] - fr[0] >= MIN_GAP; });
    return { list: list, busy: busy, full: list.length > 0 && free.length === 0 };
  }
  function timeline(d) {
    var span = T_MAX - T_MIN;
    function seg(s0, e0) {
      var s1 = Math.max(T_MIN, s0), e1 = Math.min(T_MAX, e0);
      if (e1 <= s1) return '';
      return '<span class="tl-busy" style="left:' + ((s1 - T_MIN) / span * 100).toFixed(2) + '%;width:' + ((e1 - s1) / span * 100).toFixed(2) + '%"></span>';
    }
    var ticks = [T_MIN];
    for (var t = Math.ceil((T_MIN + 1) / 180) * 180; t < T_MAX - 60; t += 180) if (t - T_MIN >= 60) ticks.push(t);
    ticks.push(T_MAX);
    return '<div class="tl" aria-hidden="true"><div class="tl-bar">' + d.busy.map(function (bk) { return seg(bk[0], bk[1]); }).join('') + '</div>' +
      '<div class="tl-ticks">' + ticks.map(function (t) { return '<span style="left:' + ((t - T_MIN) / span * 100).toFixed(2) + '%">' + fromMin(t) + '</span>'; }).join('') + '</div></div>';
  }
  function bookingItem(it, withDate) {
    return '<li class="cal-item busy"><span class="when">' + (withDate ? esc(dateLabel(it.date)) + ' · ' : '') + esc(rangeText(it)) + '</span>' +
      (it.area ? '<span class="area">' + esc(it.area) + '</span>' : '') + '</li>';
  }
  function renderSchedule() {
    var sc = state.schedule, y = cal.y, m = cal.m;
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var atMin = y < TODAY.y || (y === TODAY.y && m <= TODAY.m); // 지난 달로는 넘기지 않는다
    var h = '<section class="section schedule" id="schedule"><div class="wrap"><span class="eyebrow">SCHEDULE</span>' +
      tag('h2', 'section-title', sc.heading) + tag('p', 'section-lead', sc.lead) +
      '<div class="cal-wrap"><div class="cal"><div class="cal-head">' +
      '<button type="button" class="cal-nav" data-act="calprev" aria-label="이전 달"' + (atMin ? ' disabled' : '') + '>‹</button>' +
      '<strong aria-live="polite">' + y + '년 ' + (m + 1) + '월</strong>' +
      '<button type="button" class="cal-nav" data-act="calnext" aria-label="다음 달">›</button></div><div class="cal-grid">' +
      WD.map(function (w, i) { return '<span class="cal-wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '">' + w + '</span>'; }).join('');
    for (var e = 0; e < first; e++) h += '<span class="cal-day is-empty"></span>';
    for (var d = 1; d <= days; d++) {
      var ds = ymd(y, m, d), wd = (first + d - 1) % 7, info = dayInfo(ds), n = info.list.length;
      var cls = 'cal-day' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '') + (ds < TODAY.s ? ' is-past' : '') + (ds === TODAY.s ? ' is-today' : '') +
        (n ? ' is-booked' : '') + (info.full ? ' is-full' : '') + (ds === cal.sel ? ' is-sel' : '');
      var label = info.full ? '마감' : n ? n + '건' : '';
      h += '<button type="button" class="' + cls + '" data-act="calpick" data-date="' + ds + '" aria-label="' + dateLabel(ds) +
        (info.full ? ', 마감' : n ? ', 예식 ' + n + '건' : ', 비어 있음') + '"' + (ds === cal.sel ? ' aria-pressed="true"' : '') + '>' +
        '<span class="num">' + d + '</span>' + (label ? '<span class="cal-count">' + label + '</span>' : '') + '</button>';
    }
    h += '</div><div class="cal-legend"><span><i style="background:var(--blush)"></i>예식 있음</span><span><i style="background:#D9A79A"></i>마감</span><span><i style="border:1px solid var(--line)"></i>비어 있음</span></div></div>';

    // 오른쪽: 고른 날짜의 잡힌 시간, 고른 날짜가 없으면 이번 달 목록
    h += '<div class="cal-list">';
    if (cal.sel) {
      var di = dayInfo(cal.sel);
      h += '<h3>' + dateLabel(cal.sel) + '</h3>' + (di.busy.length ? timeline(di) : '');
      if (di.list.length) h += '<p class="slot-title">잡혀 있는 시간</p><ul class="cal-items">' + di.list.map(function (it) { return bookingItem(it, false); }).join('') + '</ul>';
      if (!di.list.length) h += '<p class="cal-none">잡힌 예식이 없어 하루 종일 비어 있습니다. 이 날짜로 문의해 주세요.</p>';
      else if (di.full) h += '<p class="cal-none">이 날은 예약이 모두 찼습니다.</p>';
      else h += '<p class="cal-none">위 시간을 뺀 나머지는 비어 있습니다.</p>';
    } else {
      var prefix = y + '-' + pad(m + 1) + '-';
      var monthList = sc.items
        .filter(function (it) { return it.date && it.date.indexOf(prefix) === 0 && it.date >= TODAY.s; })
        .sort(function (a, b) { return (a.date + (a.start || '99')).localeCompare(b.date + (b.start || '99')); });
      h += '<h3>' + (m + 1) + '월 예식 일정</h3>';
      h += monthList.length ? '<ul class="cal-items">' + monthList.map(function (it) { return bookingItem(it, true); }).join('') + '</ul>' : '<p class="cal-none">이 달은 아직 잡힌 예식이 없습니다.</p>';
      h += '<p class="cal-none">날짜를 누르면 그날 잡혀 있는 시간을 볼 수 있습니다.</p>';
    }
    return h + '</div></div></div></section>';
  }

  // ===== 페이지 전체 =====
  function renderPage() {
    var kakao = esc(safeUrl(state.contact.kakao, '#contact'));
    var mail = esc(mailHref());
    var reviews = visibleReviews(), album = state.album.items;
    var h = '';

    h += '<header class="topbar"><a class="topbar-name" href="#top">' + esc(state.brand) + '</a>' +
      '<nav class="topbar-nav" aria-label="페이지 내 이동">' +
      (reviews.length ? '<a href="#reviews">후기</a>' : '') + '<a href="#schedule">일정</a><a href="#about">소개</a><a href="#services">서비스</a>' +
      (album.length ? '<a href="#album">앨범</a>' : '') + '<a href="#contact">문의</a></nav></header>';

    h += '<main id="top">';

    // 첫 화면
    h += '<section class="hero">' + (firstRender ? '<div class="confetti" aria-hidden="true"></div>' : '') +
      '<div class="wrap hero-grid"><div class="hero-text">' + tag('h1', 'hero-title', state.hero.title) + tag('p', 'hero-lead', state.hero.lead) +
      '<div class="actions"><a class="btn btn-kakao" href="' + kakao + '" target="_blank" rel="noopener">카카오톡으로 문의하기</a><a class="btn btn-mail" href="' + mail + '">메일로 문의하기</a></div></div>' +
      '<div class="hero-photo">' + (state.hero.photo ? '<img src="' + esc(safeUrl(state.hero.photo, '')) + '" alt="' + esc(state.brand) + '" width="294" height="353">' : '<div class="photo-empty"></div>') + '</div></div></section>';

    // 1. 후기 (후기가 있을 때만)
    if (reviews.length) {
      var r = state.reviews;
      h += '<section class="section reviews" id="reviews"><div class="wrap"><span class="eyebrow">REVIEWS</span>' + tag('h2', 'section-title', r.heading) + tag('p', 'section-lead', r.lead) +
        '<div class="review-grid">' + reviews.map(function (it) {
          return '<article class="review">' +
            (it.image ? '<button type="button" class="review-shot" data-zoom="' + esc(it.image) + '" data-cap="' + esc(it.author) + '"><img src="' + esc(safeUrl(it.image, '')) + '" alt="' + esc((it.author || '고객') + ' 후기 이미지') + '" loading="lazy"></button>' : '') +
            tag('p', 'review-text', it.text) + reviewWho(it) + '</article>';
        }).join('') + '</div></div></section>';
    }

    // 2. 예식 일정
    h += renderSchedule();

    // 3. 소개
    var a = state.about;
    h += '<section class="section about" id="about"><div class="wrap about-grid"><div><span class="eyebrow">ABOUT</span>' + tag('h2', 'section-title', a.heading) + '</div><div>' +
      tag('p', 'about-intro', a.intro) +
      '<ul class="points">' + a.points.map(function (p) { return '<li>' + tag('h3', '', p.title) + tag('p', '', p.desc) + '</li>'; }).join('') + '</ul>' +
      '<div class="career">' + tag('p', 'career-lead', a.careerLead) +
      '<ol class="timeline">' + a.timeline.map(function (t) { return '<li>' + tag('span', 'year', t.year) + tag('p', '', t.text) + '</li>'; }).join('') + '</ol></div></div></div></section>';

    // 4. 서비스 안내
    var s = state.services;
    h += '<section class="section services" id="services"><div class="wrap"><span class="eyebrow">SERVICE</span>' + tag('h2', 'section-title', s.heading) + tag('p', 'section-lead', s.lead) +
      '<div class="service-grid">' + s.items.map(function (it) {
        return '<article class="service">' + tag('h3', '', it.title) + tag('p', '', it.desc) + tag('p', 'price', it.price) + '</article>';
      }).join('') + '</div>' +
      tag('h3', 'steps-title', s.stepsTitle) +
      '<ol class="steps">' + s.steps.map(function (st) { return '<li>' + tag('h4', '', st.title) + tag('p', '', st.desc) + '</li>'; }).join('') + '</ol>' +
      tag('p', 'service-note', s.note) + '</div></section>';

    // 5. 앨범 (사진이 있을 때만)
    if (album.length) {
      var al = state.album;
      h += '<section class="section album" id="album"><div class="wrap"><span class="eyebrow">ALBUM</span>' + tag('h2', 'section-title', al.heading) + tag('p', 'section-lead', al.lead) +
        '<div class="album-grid">' + album.map(function (it) {
          return '<figure class="photo"><button type="button" class="photo-btn" data-zoom="' + esc(it.src) + '" data-cap="' + esc(it.caption) + '"><img src="' + esc(safeUrl(it.src, '')) + '" alt="' + esc(it.caption || '예식 현장 사진') + '" loading="lazy"></button>' +
            tag('figcaption', '', it.caption) + '</figure>';
        }).join('') + '</div></div></section>';
    }

    // 6. 문의 (CTA)
    h += '<section class="contact" id="contact"><div class="wrap">' + tag('h2', 'contact-title', state.cta.title) + tag('p', 'contact-lead', state.cta.lead) +
      '<div class="actions"><a class="btn btn-kakao" href="' + kakao + '" target="_blank" rel="noopener">카카오톡으로 문의하기</a><a class="btn btn-mail" href="' + mail + '">메일로 문의하기</a></div>' +
      '<p class="contact-email"><span>' + esc(state.contact.email) + '</span><button type="button" class="copy-btn" data-act="copy">메일 주소 복사</button><span class="copy-status" role="status" aria-live="polite"></span></p></div></section>';

    h += '</main><footer class="footer">' + tag('p', '', state.footer) + '</footer>';

    // 화면 아래에 항상 붙어 있는 문의 버튼
    h += '<div class="sticky-bar"><div class="sticky-inner"><a class="btn btn-kakao" href="' + kakao + '" target="_blank" rel="noopener">카카오톡 문의</a><a class="btn btn-mail" href="' + mail + '">메일 문의</a></div></div>';
    return h;
  }

  function render() {
    var y = window.scrollY;
    app.innerHTML = renderPage();
    if (firstRender) { firstRender = false; petals(); } else { window.scrollTo(0, y); }
  }

  // 처음 열 때 첫 화면에 꽃잎을 한 번 흩날린다
  function petals() {
    var box = app.querySelector('.confetti');
    if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#F2C4B8', '#F7DDD5', '#FFFFFF', '#E9B5A6'];
    for (var i = 0; i < 22; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--drift', Math.random() * 160 - 80 + 'px');
      p.style.setProperty('--spin', Math.random() * 360 + 180 + 'deg');
      p.style.animationDuration = 4 + Math.random() * 3 + 's';
      p.style.animationDelay = Math.random() * 1.5 + 's';
      box.appendChild(p);
    }
    setTimeout(function () { box.remove(); }, 9000);
  }

  // ===== 사진 크게 보기 =====
  var lb = document.createElement('dialog');
  lb.className = 'lightbox';
  lb.innerHTML = '<button type="button" class="lightbox-close" aria-label="닫기">×</button><img alt=""><p></p>';
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lightbox-close')) lb.close(); });
  document.body.appendChild(lb);

  // ===== 클릭 처리 =====
  app.addEventListener('click', function (e) {
    var zoom = e.target.closest('[data-zoom]');
    if (zoom) {
      lb.querySelector('img').src = safeUrl(zoom.getAttribute('data-zoom'), '');
      lb.querySelector('img').alt = zoom.getAttribute('data-cap') || '';
      lb.querySelector('p').textContent = zoom.getAttribute('data-cap') || '';
      if (lb.showModal) lb.showModal();
      return;
    }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');

    if (act === 'calpick') {
      var d = b.getAttribute('data-date');
      cal.sel = cal.sel === d ? '' : d;
      render(); return;
    }
    if (act === 'calprev' || act === 'calnext') {
      cal.m += act === 'calnext' ? 1 : -1;
      if (cal.m < 0) { cal.m = 11; cal.y--; }
      if (cal.m > 11) { cal.m = 0; cal.y++; }
      cal.sel = '';
      render(); return;
    }
    if (act === 'copy') {
      var st = app.querySelector('.copy-status');
      if (!navigator.clipboard) { st.textContent = '복사할 수 없습니다. 주소를 직접 선택해 복사해 주세요.'; return; }
      navigator.clipboard.writeText(state.contact.email).then(function () { st.textContent = '메일 주소를 복사했습니다'; }, function () { st.textContent = '복사할 수 없습니다. 주소를 직접 선택해 복사해 주세요.'; });
    }
  });

  // ===== 내용 불러오기 =====
  fetch(DATA_URL, { cache: 'no-cache' })
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(function (data) { state = data; render(); })
    .catch(function () {
      app.innerHTML = '<p class="load-error">내용을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>';
    });
})();
