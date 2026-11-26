/* Controles independentes para recolher o índice (direita) e a navegação (esquerda).
   O Zensical não expõe um feature flag para isso no desktop; o botão reusa a
   estrutura da própria sidebar e guarda o estado no localStorage. */
(function () {
  "use strict";

  var TOC_KEY = "pms.sidebar.toc.collapsed";
  var NAV_KEY = "pms.sidebar.nav.collapsed";
  var CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var PANEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

  function read(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value === null ? fallback : value === "1";
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, value ? "1" : "0");
    } catch (error) {
      /* modo privado: o botão continua funcionando sem persistir */
    }
  }

  function makeButton(className, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "pms-sidebar-toggle " + className;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = CHEVRON;
    return button;
  }

  function setToc(nav, button, collapsed) {
    nav.classList.toggle("pms-toc-collapsed", collapsed);
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    button.setAttribute("aria-label", collapsed ? "Expandir índice" : "Recolher índice");
    button.title = collapsed ? "Expandir índice" : "Recolher índice";
    button.classList.toggle("is-collapsed", collapsed);
  }

  function initToc() {
    var nav = document.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav || nav.dataset.pmsTocBound) return;
    var list = nav.querySelector(":scope > .md-nav__list");
    var title = nav.querySelector(":scope > .md-nav__title");
    if (!list || !title) return;

    nav.dataset.pmsTocBound = "1";
    var button = makeButton("pms-toc-toggle", "Recolher índice");
    nav.appendChild(button);
    var collapsed = read(TOC_KEY, false);
    setToc(nav, button, collapsed);

    button.addEventListener("click", function () {
      var next = !nav.classList.contains("pms-toc-collapsed");
      setToc(nav, button, next);
      write(TOC_KEY, next);
    });

    // No desktop o label não tem função (o checkbox é do drawer mobile).
    if (window.matchMedia("(min-width: 60em)").matches) {
      title.addEventListener("click", function (event) {
        if (event.target.closest("a")) return;
        event.preventDefault();
        var next = !nav.classList.contains("pms-toc-collapsed");
        setToc(nav, button, next);
        write(TOC_KEY, next);
      });
    }
  }

  function setNav(sidebar, button, collapsed) {
    sidebar.classList.toggle("pms-nav-collapsed", collapsed);
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    button.setAttribute("aria-label", collapsed ? "Expandir navegação" : "Recolher navegação");
    button.title = collapsed ? "Expandir navegação" : "Recolher navegação";
    button.classList.toggle("is-collapsed", collapsed);
  }

  function initNav() {
    var sidebar = document.querySelector(".md-sidebar--primary");
    if (!sidebar || sidebar.dataset.pmsNavBound) return;
    var nav = sidebar.querySelector(".md-nav--primary");
    if (!nav) return;

    sidebar.dataset.pmsNavBound = "1";
    var button = makeButton("pms-nav-toggle", "Recolher navegação");
    button.innerHTML = PANEL;
    sidebar.appendChild(button);
    var collapsed = read(NAV_KEY, false);
    setNav(sidebar, button, collapsed);

    button.addEventListener("click", function () {
      var next = !sidebar.classList.contains("pms-nav-collapsed");
      setNav(sidebar, button, next);
      write(NAV_KEY, next);
    });
  }

  function init() {
    initToc();
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  var pending = null;
  var observer = new MutationObserver(function () {
    if (pending) return;
    pending = window.setTimeout(function () {
      pending = null;
      init();
    }, 60);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
