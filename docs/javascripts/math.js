/* Renderiza os spans gerados por pymdownx.arithmatex com KaTeX.
   O KaTeX só é baixado em páginas que realmente têm fórmula. */
(function () {
  "use strict";

  var current = document.currentScript;
  if (!current) {
    current = document.querySelector('script[src$="javascripts/math.js"]');
  }
  var katexUrl = current && current.src
    ? new URL("../assets/katex/katex.min.js", current.src).href
    : null;

  var loading = null;
  var failed = false;

  function loadKatex() {
    if (window.katex) return Promise.resolve(true);
    if (failed || !katexUrl) return Promise.resolve(false);
    if (loading) return loading;
    loading = new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = katexUrl;
      script.async = true;
      script.onload = function () { resolve(!!window.katex); };
      script.onerror = function () { failed = true; resolve(false); };
      document.head.appendChild(script);
    });
    return loading;
  }

  function renderMath(root) {
    var nodes = (root || document).querySelectorAll(".arithmatex:not([data-math-rendered])");
    if (!nodes.length) return;

    loadKatex().then(function (ready) {
      if (!ready) return;
      Array.prototype.forEach.call(nodes, function (node) {
        if (node.dataset.mathRendered) return;
        var raw = node.textContent.trim();
        var display = false;
        var tex = raw;

        if (raw.indexOf("\\(") === 0 && raw.lastIndexOf("\\)") === raw.length - 2) {
          tex = raw.slice(2, -2);
        } else if (raw.indexOf("\\[") === 0 && raw.lastIndexOf("\\]") === raw.length - 2) {
          tex = raw.slice(2, -2);
          display = true;
        } else if (raw.indexOf("$$") === 0 && raw.lastIndexOf("$$") === raw.length - 2) {
          tex = raw.slice(2, -2);
          display = true;
        } else if (raw.indexOf("$") === 0 && raw.lastIndexOf("$") === raw.length - 1) {
          tex = raw.slice(1, -1);
        }

        try {
          window.katex.render(tex, node, {
            displayMode: display,
            throwOnError: true,
            strict: false,
          });
          node.dataset.mathRendered = "1";
        } catch (error) {
          // Se o TeX não for suportado, mantém o texto original visível.
          node.dataset.mathRendered = "error";
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { renderMath(document); });
  } else {
    renderMath(document);
  }

  var pending = null;
  var observer = new MutationObserver(function () {
    if (pending) return;
    pending = window.setTimeout(function () {
      pending = null;
      renderMath(document);
    }, 50);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
