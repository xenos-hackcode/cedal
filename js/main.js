(function () {
  var THEMES = ['default', 'ocean', 'terminal', 'lava', 'aurora'];
  var root = document.documentElement;

  function applyTheme(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'default';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('cs-theme', theme);
    document.querySelectorAll('.cs-theme-swatch').forEach(function (btn) {
      btn.classList.toggle('cs-active', btn.dataset.themeOption === theme);
    });
  }

  function applyLanguage(lang) {
    var dict = window.CS_I18N && window.CS_I18N[lang];
    if (!dict) {
      lang = 'en';
      dict = window.CS_I18N.en;
    }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = dict[key];
      if (Array.isArray(val)) {
        el.innerHTML = val.join('<br /> ');
      }
    });

    root.setAttribute('lang', lang);
    localStorage.setItem('cs-lang', lang);

    var select = document.getElementById('cs-lang-select');
    if (select) select.value = lang;
  }

  function initSettingsPanel() {
    var toggle = document.getElementById('cs-settings-toggle');
    var closeBtn = document.getElementById('cs-settings-close');
    var overlay = document.getElementById('cs-settings-overlay');
    var panel = document.getElementById('cs-settings-panel');
    if (!toggle || !panel) return;

    function open() {
      panel.classList.add('cs-open');
      overlay.classList.add('cs-open');
      panel.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function close() {
      panel.classList.remove('cs-open');
      overlay.classList.remove('cs-open');
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      if (panel.classList.contains('cs-open')) close();
      else open();
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    document.querySelectorAll('.cs-theme-swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.dataset.themeOption);
      });
    });

    var select = document.getElementById('cs-lang-select');
    if (select) {
      select.addEventListener('change', function () {
        applyLanguage(select.value);
      });
    }
  }

  function initMobileMenu() {
    var hamburger = document.getElementById('cs-hamburger');
    var menu = document.getElementById('cs-mobile-menu');
    if (!hamburger || !menu) return;

    function close() {
      menu.classList.remove('cs-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('cs-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('cs-open')) return;
      if (menu.contains(e.target) || hamburger.contains(e.target)) return;
      close();
    });
  }

  function initScrollReveal() {
    var items = document.querySelectorAll('.cs-reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('cs-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('cs-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  function initActiveNav() {
    var ids = ['services', 'products', 'founder', 'contact'];
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var links = document.querySelectorAll('.cs-nav-links a');
    if (!('IntersectionObserver' in window) || !sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('cs-nav-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { threshold: 0.4 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  function initFooterYear() {
    var el = document.getElementById('cs-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function initNavHeight() {
    var nav = document.querySelector('.cs-nav');
    if (!nav) return;

    function setHeight() {
      root.style.setProperty('--cs-nav-h', nav.offsetHeight + 'px');
    }

    setHeight();
    window.addEventListener('resize', setHeight);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var savedTheme = localStorage.getItem('cs-theme') || 'default';
    var savedLang = localStorage.getItem('cs-lang') || 'en';

    applyTheme(savedTheme);
    applyLanguage(savedLang);
    initNavHeight();
    initSettingsPanel();
    initMobileMenu();
    initScrollReveal();
    initActiveNav();
    initFooterYear();
  });
})();
