/* Widgets de estudo: quiz, ordenação, cálculo, flashcards e progresso.
   Sem dependências. Compatível com a navegação instantânea do Zensical:
   cada componente é inicializado uma única vez (dataset.bound). */

(function () {
  "use strict";

  var STORAGE_PREFIX = "pm-study:";

  function storageGet(key, fallback) {
    try {
      var raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (err) {
      /* modo privado ou storage cheio: o widget continua funcionando sem persistir */
    }
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pageKey() {
    return window.location.pathname.replace(/\/+$/, "") || "/";
  }

  /* ---------------------------------------------------------------- quiz */

  function initQuiz(quiz) {
    if (quiz.dataset.bound) return;
    quiz.dataset.bound = "1";

    var answer = (quiz.dataset.answer || "").trim();
    var options = Array.prototype.slice.call(quiz.querySelectorAll(".options li"));
    var explain = quiz.querySelector(".explain");
    var state = quiz.querySelector(".quiz-state");

    if (!options.length) return;

    if (explain) explain.hidden = true;

    quiz.setAttribute("role", "group");
    options.forEach(function (option) {
      option.setAttribute("tabindex", "0");
      option.setAttribute("role", "button");
      option.setAttribute("aria-pressed", "false");
    });

    function choose(option) {
      if (quiz.dataset.done) return;
      quiz.dataset.done = "1";
      var picked = option.dataset.key;
      var correct = picked === answer;
      quiz.dataset.correct = correct ? "1" : "0";

      options.forEach(function (item) {
        item.classList.add("locked");
        item.setAttribute("aria-pressed", item === option ? "true" : "false");
        if (item.dataset.key === answer) item.classList.add("is-correct");
      });
      if (!correct) option.classList.add("is-wrong");

      if (explain) explain.hidden = false;
      if (state) {
        state.textContent = correct ? "Correto." : "Ainda não — veja a explicação.";
        state.className = "quiz-state " + (correct ? "ok" : "bad");
      }
      quiz.dispatchEvent(new CustomEvent("study:answered", { bubbles: true }));
    }

    options.forEach(function (option) {
      option.addEventListener("click", function () { choose(option); });
      option.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(option);
        }
      });
    });
  }

  /* --------------------------------------------------------------- ordem */

  function initOrder(widget) {
    if (widget.dataset.bound) return;
    widget.dataset.bound = "1";

    var items = (widget.dataset.items || "").split("|").filter(Boolean);
    var prompt = widget.dataset.prompt || "Arraste (ou use as setas) para colocar na ordem correta.";
    if (!items.length) return;

    var list = document.createElement("ol");
    list.className = "order-list";
    var controls = document.createElement("div");
    controls.className = "study-actions";
    var check = document.createElement("button");
    check.type = "button";
    check.textContent = "Conferir ordem";
    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "ghost";
    reset.textContent = "Embaralhar";
    var feedback = document.createElement("p");
    feedback.className = "order-feedback";
    feedback.setAttribute("role", "status");

    widget.appendChild(document.createElement("p")).className = "order-prompt";
    widget.querySelector(".order-prompt").textContent = prompt;
    widget.appendChild(list);
    controls.appendChild(check);
    controls.appendChild(reset);
    widget.appendChild(controls);
    widget.appendChild(feedback);

    var dragged = null;

    function render(values) {
      list.innerHTML = "";
      values.forEach(function (value, index) {
        var li = document.createElement("li");
        li.draggable = true;
        li.dataset.value = value;
        li.innerHTML = '<span class="order-handle" aria-hidden="true">⋮⋮</span>' +
          '<span class="order-label"></span>' +
          '<span class="order-buttons">' +
          '<button type="button" class="up" aria-label="Mover para cima">▲</button>' +
          '<button type="button" class="down" aria-label="Mover para baixo">▼</button>' +
          "</span>";
        li.querySelector(".order-label").textContent = value;
        li.querySelector(".up").addEventListener("click", function () {
          var previous = li.previousElementSibling;
          if (previous) list.insertBefore(li, previous);
          clear();
          refreshButtons();
        });
        li.querySelector(".down").addEventListener("click", function () {
          var next = li.nextElementSibling;
          if (next) list.insertBefore(next, li);
          clear();
          refreshButtons();
        });
        li.addEventListener("dragstart", function () {
          dragged = li;
          li.classList.add("dragging");
        });
        li.addEventListener("dragend", function () {
          li.classList.remove("dragging");
          dragged = null;
          clear();
          refreshButtons();
        });
        li.addEventListener("dragover", function (event) {
          event.preventDefault();
          if (!dragged || dragged === li) return;
          var rect = li.getBoundingClientRect();
          var after = event.clientY > rect.top + rect.height / 2;
          list.insertBefore(dragged, after ? li.nextSibling : li);
        });
        list.appendChild(li);
      });
      refreshButtons();
    }

    function refreshButtons() {
      Array.prototype.forEach.call(list.children, function (li, index) {
        li.querySelector(".up").disabled = index === 0;
        li.querySelector(".down").disabled = index === list.children.length - 1;
      });
    }

    function clear() {
      feedback.textContent = "";
      feedback.className = "order-feedback";
      list.querySelectorAll("li").forEach(function (li) { li.classList.remove("ok", "bad"); });
    }

    function current() {
      return Array.prototype.map.call(list.children, function (li) {
        return li.dataset.value;
      });
    }

    check.addEventListener("click", function () {
      var values = current();
      var correct = values.every(function (value, index) { return value === items[index]; });
      list.querySelectorAll("li").forEach(function (li, index) {
        li.classList.add(values[index] === items[index] ? "ok" : "bad");
      });
      feedback.textContent = correct
        ? "Ordem correta."
        : "Há posições fora de ordem (verde = certa, vermelho = errada). Tente de novo.";
      feedback.className = "order-feedback " + (correct ? "ok" : "bad");
    });

    reset.addEventListener("click", function () {
      render(shuffle(items));
      clear();
    });

    render(shuffle(items));
  }

  /* --------------------------------------------------------------- cálculo */

  function parseNumber(value) {
    if (typeof value !== "string") return NaN;
    return Number(value.replace(/\s/g, "").replace(",", "."));
  }

  function initCalc(widget) {
    if (widget.dataset.bound) return;
    widget.dataset.bound = "1";

    var expected = parseNumber(widget.dataset.answer);
    var tolerance = parseNumber(widget.dataset.tolerance || "0");
    var unit = widget.dataset.unit || "";
    var input = widget.querySelector("input");
    var button = widget.querySelector("button");
    var explain = widget.querySelector(".explain");
    var feedback = widget.querySelector(".calc-feedback");
    if (!input || !button) return;

    if (explain) explain.hidden = true;

    if (!feedback) {
      feedback = document.createElement("p");
      feedback.className = "calc-feedback";
      feedback.setAttribute("role", "status");
      widget.appendChild(feedback);
    }

    function verify() {
      var value = parseNumber(input.value);
      if (isNaN(value)) {
        feedback.textContent = "Digite um número.";
        feedback.className = "calc-feedback bad";
        return;
      }
      var ok = Math.abs(value - expected) <= (tolerance || 0.0000001);
      feedback.textContent = ok
        ? "Certo: " + expected + (unit ? " " + unit : "") + "."
        : "Não é esse valor. Revise a conta e tente novamente.";
      feedback.className = "calc-feedback " + (ok ? "ok" : "bad");
      if (ok && explain) explain.hidden = false;
      input.classList.toggle("ok", ok);
      input.classList.toggle("bad", !ok);
    }

    button.addEventListener("click", verify);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        verify();
      }
    });
  }

  /* ----------------------------------------------------------- flashcards */

  function initFlashcards(group) {
    if (group.dataset.bound) return;
    group.dataset.bound = "1";
    group.querySelectorAll(".flash-card").forEach(function (card) {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", "false");
      function flip() {
        card.classList.toggle("flipped");
        card.setAttribute("aria-pressed", card.classList.contains("flipped") ? "true" : "false");
      }
      card.addEventListener("click", flip);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          flip();
        }
      });
    });
  }

  /* ------------------------------------------------------------ progresso */

  function initChecks(root) {
    root.querySelectorAll(".study-check input[type=checkbox]").forEach(function (box) {
      if (box.dataset.bound) return;
      box.dataset.bound = "1";
      var key = box.dataset.key;
      if (key && storageGet("check:" + key, false)) box.checked = true;
      box.addEventListener("change", function () {
        if (key) storageSet("check:" + key, box.checked);
        updateProgress(root);
      });
    });
    updateProgress(root);
  }

  function updateProgress(root) {
    var boxes = root.querySelectorAll(".study-check input[type=checkbox]");
    var bars = root.querySelectorAll("[data-study-progress]");
    if (!boxes.length || !bars.length) return;
    var done = 0;
    boxes.forEach(function (box) { if (box.checked) done += 1; });
    var signature = done + "/" + boxes.length;
    bars.forEach(function (bar) {
      if (bar.dataset.state === signature) return;
      bar.dataset.state = signature;
      var pct = Math.round((done / boxes.length) * 100);
      bar.innerHTML = '<span class="progress-track"><span class="progress-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="progress-label">' + done + " de " + boxes.length + " itens revisados (" + pct + "%)</span>";
    });
  }

  function initScores(root) {
    var quizzes = root.querySelectorAll(".study-quiz");
    root.querySelectorAll("[data-study-score]").forEach(function (host) {
      var answered = 0;
      var correct = 0;
      quizzes.forEach(function (quiz) {
        if (quiz.dataset.done) {
          answered += 1;
          if (quiz.dataset.correct === "1") correct += 1;
        }
      });
      var signature = correct + "/" + answered + "/" + quizzes.length;
      if (host.dataset.state === signature) return;
      host.dataset.state = signature;
      host.innerHTML = '<span class="score-pill">Quizzes desta página: <strong>' + correct +
        "/" + answered + "</strong> corretos de " + quizzes.length + " possíveis</span>";
    });
  }

  function initAll() {
    document.querySelectorAll(".study-quiz").forEach(initQuiz);
    document.querySelectorAll(".study-order").forEach(initOrder);
    document.querySelectorAll(".study-calc").forEach(initCalc);
    document.querySelectorAll(".study-flash").forEach(initFlashcards);
    initChecks(document);
    initScores(document);
  }

  document.addEventListener("study:answered", function () { initScores(document); });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  /* A navegação instantânea troca o conteúdo sem recarregar a página.
     O observer é debounced para coalescer as mutações do Mermaid e dos
     próprios widgets, e updateProgress/initScores só reescrevem o DOM
     quando o valor muda (evita loop observer → render → observer). */
  var pendingInit = null;
  function scheduleInit() {
    if (pendingInit) return;
    pendingInit = window.setTimeout(function () {
      pendingInit = null;
      initAll();
    }, 50);
  }

  var observer = new MutationObserver(scheduleInit);
  document.addEventListener("DOMContentLoaded", function () {
    observer.observe(document.body, { childList: true, subtree: true });
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
