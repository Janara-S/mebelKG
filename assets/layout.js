/* MebelPro KG — общая оболочка: шапка/подвал сайта, боковое меню ERP, навигация, тосты, RU/KG */
(function () {
  const MP = (window.MP = window.MP || {});
  const queue = [];
  let ready = false;
  MP.ready = (fn) => (ready ? fn() : queue.push(fn));

  const PUBLIC_NAV = [
    ['landing', 'index.html', 'Главная', 'Башкы бет'],
    ['studio', 'studio.html', '3D-Конструктор', '3D-конструктор'],
    ['dashboard', 'dashboard.html', 'Мастерская', 'Устакана'],
    ['cutting', 'cutting.html', 'Раскрой и документы', 'Бычуу жана документтер'],
    ['pricing', 'pricing.html', 'Тарифы', 'Тарифтер'],
    ['admin', 'soon.html?s=admin', 'Админ-панель', 'Админ-панель']
  ];
  const APP_NAV = [
    ['dashboard', 'dashboard.html', 'factory', 'Главная', 'Башкы бет'],
    ['studio', 'studio.html', 'view_in_ar', '3D-конструктор', '3D-конструктор'],
    ['projects', 'projects.html', 'folder_open', 'Мои проекты', 'Менин долбоорлорум'],
    ['orders', 'dashboard.html#orders', 'assignment', 'Заказы', 'Буйрутмалар'],
    ['cutting', 'cutting.html', 'grid_view', 'Раскрой', 'Бычуу'],
    ['documents', 'cutting.html#docs', 'description', 'Документы и смета', 'Документтер'],
    ['catalog', 'soon.html?s=catalog', 'menu_book', 'Каталог мебели', 'Эмерек каталогу'],
    ['clients', 'soon.html?s=clients', 'group', 'Клиенты', 'Кардарлар'],
    ['materials', 'soon.html?s=materials', 'inventory_2', 'Материалы и склад', 'Материалдар жана кампа'],
    ['finance', 'soon.html?s=finance', 'account_balance_wallet', 'Финансы', 'Финансы'],
    ['settings', 'soon.html?s=settings', 'settings', 'Настройки', 'Жөндөөлөр']
  ];
  MP.sections = {
    admin: 'Админ-панель платформы', catalog: 'Каталог мебели', clients: 'Клиенты (CRM)', materials: 'Материалы и склад',
    finance: 'Финансы и касса', settings: 'Настройки мастерской'
  };

  let lang = 'ru';
  try { lang = localStorage.getItem('mebelpro_lang') || 'ru'; } catch (e) { /* */ }

  MP.logo = (cls) => `<svg viewBox="0 0 32 32" class="${cls || 'h-8 w-8'}" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#006194"/><path d="M7.5 22.5V9.5l8.5 7 8.5-7v13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M7.5 25h17" stroke="#86f2e4" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const ico = (n, cls) => `<span class="material-symbols-outlined ${cls || 'text-[18px]'}">${n}</span>`;
  MP.ico = ico;

  function langToggle() {
    const b = (code) => `<button type="button" data-lang="${code}" class="px-2 py-0.5 rounded ${lang === code ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}">${code.toUpperCase()}</button>`;
    return `<div class="flex items-center bg-surface-container rounded-lg p-0.5 text-label-sm font-label-sm">${b('ru')}${b('kg')}</div>`;
  }

  function publicHeader(active) {
    const links = PUBLIC_NAV.map(([k, href, ru, kg]) => {
      const on = k === active;
      return `<a href="${href}" ${on ? 'aria-current="page"' : ''} class="py-1 transition-colors ${on ? 'text-on-surface font-semibold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}">${lang === 'kg' ? kg : ru}</a>`;
    }).join('');
    return `<header class="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-16 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        <a href="index.html" class="flex items-center gap-2.5 shrink-0">${MP.logo('h-8 w-8')}<span class="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase">MebelPro<span class="text-primary">.KG</span></span></a>
        <nav class="hidden xl:flex items-center gap-6 font-body-md text-body-md">${links}</nav>
        <div class="flex items-center gap-2 sm:gap-3">
          ${langToggle()}
          <span class="hidden sm:flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded text-label-sm font-label-sm"><span class="text-primary font-bold">KGS</span><span>(сом)</span></span>
          <a href="auth.html" class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary transition-colors">Вход в цех</a>
          <button type="button" id="mp-menu-btn" class="xl:hidden p-1.5 rounded-lg hover:bg-surface-container" aria-label="Меню">${ico('menu', 'text-[22px]')}</button>
        </div>
      </div>
      <nav id="mp-mobile-nav" class="hidden xl:hidden border-t border-surface-container-high bg-surface px-4 py-2 flex-col font-body-md">${PUBLIC_NAV.map(([k, href, ru]) => `<a href="${href}" class="py-2 ${k === active ? 'text-primary font-semibold' : 'text-on-surface'}">${ru}</a>`).join('')}<a href="auth.html" class="py-2 text-primary font-semibold">Вход в цех</a></nav>
    </header>`;
  }

  function publicFooter() {
    return `<footer class="w-full bg-surface-container-low text-on-surface-variant py-8 mt-0">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 grid gap-8 md:grid-cols-3">
        <div class="flex flex-col gap-2 max-w-sm"><div class="flex items-center gap-2">${MP.logo('h-6 w-6')}<span class="font-headline-sm text-headline-sm text-on-surface">MebelPro KG</span></div>
          <p class="font-body-sm text-body-sm">Облачная система для мебельных цехов Кыргызстана: 3D-проект, раскрой, документы и смета в сомах.</p>
          <span class="flex items-center gap-2 text-label-sm font-label-sm">${ico('pin_drop', 'text-[16px] text-primary')}г. Бишкек, ул. Кулатова 14</span>
          <span class="flex items-center gap-2 text-label-sm font-label-sm">${ico('call', 'text-[16px] text-primary')}${MP.company.phone}</span></div>
        <div class="flex flex-col gap-2"><span class="font-headline-sm text-body-md text-on-surface uppercase tracking-wider">Разделы</span>
          ${PUBLIC_NAV.map(([, href, ru]) => `<a class="font-body-sm text-body-sm hover:text-primary" href="${href}">${ru}</a>`).join('')}</div>
        <div class="flex flex-col gap-1 text-body-sm font-body-sm"><span class="font-headline-sm text-body-md text-on-surface uppercase tracking-wider mb-1">Поддержка цеха</span>
          <span>Пн–Сб: 08:30 — 19:00</span><span>support@mebelpro.kg</span>
          <span class="mt-2 inline-flex w-fit px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm">Демо-прототип: данные вымышлены</span></div>
      </div>
      <div class="max-w-7xl mx-auto px-4 lg:px-8 mt-6 pt-4 border-t border-surface-container-high flex flex-col sm:flex-row justify-between gap-2 text-label-sm font-label-sm"><p>© 2025 MebelPro KG. Прототип интерфейса.</p><p>Бишкек • Ош • Джалал-Абад</p></div>
    </footer>`;
  }

  function appShell(active) {
    const links = APP_NAV.map(([k, href, icon, ru, kg]) => {
      const on = k === active;
      return `<a href="${href}" ${on ? 'aria-current="page"' : ''} class="flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm font-body-sm transition-colors ${on ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}">${ico(icon)}${lang === 'kg' ? kg : ru}${href.startsWith('soon') ? '<span class="ml-auto text-[10px] font-mono opacity-60">скоро</span>' : ''}</a>`;
    }).join('');
    const aside = `<aside id="mp-aside" class="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col shadow-[1px_0_8px_rgba(0,0,0,0.05)] -translate-x-full lg:translate-x-0 transition-transform">
      <a href="index.html" class="h-16 px-4 flex items-center gap-2.5 bg-surface-container-lowest/60 shrink-0">${MP.logo('h-7 w-7')}<div class="flex flex-col"><span class="font-headline-sm text-body-lg font-bold tracking-tight text-on-surface leading-none">MebelPro</span><span class="font-label-sm text-label-sm text-primary font-medium">ERP Workshop</span></div></a>
      <div class="px-3 py-2"><div class="p-2 rounded-lg bg-surface-container-lowest flex flex-col shadow-xs"><span class="font-label-sm text-label-sm text-on-surface-variant">Цех / Локация</span><span class="font-body-sm text-body-sm font-semibold text-on-surface truncate">${MP.company.name}</span><span class="font-label-sm text-label-sm text-secondary font-medium">${MP.company.city} • ${MP.company.shift}</span></div></div>
      <nav class="flex-1 px-2 py-1 overflow-y-auto space-y-0.5">${links}</nav>
      <div class="p-3 bg-surface-container-lowest/50 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant"><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-secondary"></span>ЧПУ: онлайн</span><a href="index.html" class="text-primary font-semibold hover:underline">На сайт</a></div>
    </aside><div id="mp-backdrop" class="fixed inset-0 bg-inverse-surface/40 z-40 hidden lg:hidden"></div>`;
    const header = `<header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/90 backdrop-blur-xl z-30 px-3 sm:px-6 flex items-center justify-between gap-2 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="flex items-center gap-2 min-w-0">
        <button type="button" id="mp-aside-btn" class="lg:hidden p-1.5 rounded-lg hover:bg-surface-container" aria-label="Меню">${ico('menu', 'text-[22px]')}</button>
        <span class="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container text-label-sm font-label-sm font-medium truncate"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>${MP.company.name} (${MP.company.city})</span>
        ${langToggle()}
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <span class="hidden sm:flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded text-label-sm font-label-sm"><span class="text-primary font-bold">KGS</span><span class="font-mono">сом</span></span>
        <a href="projects.html#new" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold hover:bg-secondary-fixed transition-colors shadow-sm">${ico('add')}<span class="hidden sm:inline">Новый проект</span></a>
        <button type="button" data-toast="3 уведомления: аванс по #2025-107 ожидается, замер #2025-110 завтра в 11:00, сдача #2025-106 сегодня." class="relative p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container" aria-label="Уведомления">${ico('notifications', 'text-[20px]')}<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-tertiary-container"></span></button>
        <a href="auth.html" title="${MP.company.director}" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-sm font-bold">АЖ</a>
      </div>
    </header>`;
    return aside + header;
  }

  /* ---------- Тосты ---------- */
  MP.toast = function (msg, title, kind) {
    let box = document.getElementById('mp-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'mp-toasts'; box.className = 'fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm print:hidden'; document.body.appendChild(box); }
    const icon = kind === 'error' ? 'error' : kind === 'warn' ? 'warning' : kind === 'info' ? 'info' : 'check_circle';
    const tone = kind === 'error' ? 'text-error' : kind === 'warn' ? 'text-tertiary' : kind === 'info' ? 'text-primary' : 'text-secondary';
    const el = document.createElement('div');
    el.className = 'bg-surface-container-lowest shadow-xl rounded-lg p-3 flex items-start gap-2 border border-surface-container-high transition-all duration-300 opacity-0 translate-y-2';
    el.innerHTML = `${ico(icon, 'text-[22px] ' + tone)}<div class="flex flex-col min-w-0">${title ? `<span class="font-label-md text-label-md text-on-surface font-bold">${MP.esc(title)}</span>` : ''}<span class="font-body-sm text-body-sm text-on-surface-variant">${MP.esc(msg)}</span></div>`;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.remove('opacity-0', 'translate-y-2'));
    setTimeout(() => { el.classList.add('opacity-0'); setTimeout(() => el.remove(), 300); }, 4200);
  };

  MP.download = function (name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body, shell = body.dataset.shell, active = body.dataset.active;
    if (shell === 'public') {
      body.insertAdjacentHTML('afterbegin', publicHeader(active));
      const main = document.getElementById('page');
      if (main) main.insertAdjacentHTML('afterend', publicFooter());
    } else if (shell === 'app') {
      body.insertAdjacentHTML('afterbegin', appShell(active));
      const main = document.getElementById('page');
      if (main) { const wrap = document.createElement('div'); wrap.className = 'lg:pl-64'; main.parentNode.insertBefore(wrap, main); wrap.appendChild(main); }
      const aside = document.getElementById('mp-aside'), back = document.getElementById('mp-backdrop');
      const toggle = (open) => { aside.classList.toggle('-translate-x-full', !open); back.classList.toggle('hidden', !open); };
      document.getElementById('mp-aside-btn').addEventListener('click', () => toggle(aside.classList.contains('-translate-x-full')));
      back.addEventListener('click', () => toggle(false));
    }
    const mb = document.getElementById('mp-menu-btn');
    if (mb) mb.addEventListener('click', () => { const n = document.getElementById('mp-mobile-nav'); n.classList.toggle('hidden'); n.classList.toggle('flex'); });

    document.addEventListener('click', (e) => {
      const l = e.target.closest('[data-lang]');
      if (l) {
        lang = l.dataset.lang;
        try { localStorage.setItem('mebelpro_lang', lang); } catch (err) { /* */ }
        MP.toast(lang === 'kg' ? 'Кыргызча: азырынча меню гана которулду (демо).' : 'Интерфейс на русском языке.', lang === 'kg' ? 'Тил: KG' : 'Язык: RU', 'info');
        setTimeout(() => location.reload(), 900);
        return;
      }
      const t = e.target.closest('[data-toast]');
      if (t) MP.toast(t.dataset.toast, t.dataset.toastTitle || '', t.dataset.toastKind || 'info');
    });

    MP.bind();
    ready = true;
    queue.splice(0).forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
  });
})();
