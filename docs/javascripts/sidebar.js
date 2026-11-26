/* Estado do índice recolhível.
   O botão é o controle nativo do tema (.md-sidebar-button + #__toc);
   aqui só sincronizamos a preferência no desktop, sem criar UI nova. */
(function () {
  "use strict";

  var KEY = "pms.toc.collapsed";
  var desktop = window.matchMedia("(min-width: 60em)");
  var stored = false;

  try {
    stored = window.localStorage.getItem(KEY) === "1";
  } catch (error) {
    stored = false;
  }

  function labelFor(collapsed) {
    return collapsed ? "Expandir índice" : "Recolher índice";
  }

  function syncLabel(label, collapsed) {
    label.setAttribute("title", labelFor(collapsed));
    label.setAttribute("aria-label", labelFor(collapsed));
  }

  function apply(input, label) {
    input.checked = desktop.matches ? stored : false;
    syncLabel(label, input.checked);
  }

  function init() {
    var sidebar = document.querySelector(".md-sidebar--secondary");
    if (!sidebar) return;
    var input = sidebar.querySelector("#__toc");
    var label = sidebar.querySelector(".md-sidebar-button");
    if (!input || !label || input.dataset.pmsBound) return;

    input.dataset.pmsBound = "1";
    label.setAttribute("role", "button");
    apply(input, label);

    input.addEventListener("change", function () {
      stored = input.checked;
      try {
        window.localStorage.setItem(KEY, stored ? "1" : "0");
      } catch (error) {
        /* modo privado: o botão continua funcionando sem persistir */
      }
      syncLabel(label, stored);
    });

    desktop.addEventListener("change", function () {
      apply(input, label);
    });
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
