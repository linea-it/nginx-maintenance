(function () {
  var defaults = {
    organizacao: "LIneA",
    servico: "",
    logo: "",
    faixa: "Trabalho de campo no ambiente do LIneA em andamento",
    titulo: "Estamos offline",
    mensagem: "Nossa infraestrutura está passando por atualizações essenciais para garantir a melhor performance nas suas pesquisas astronômicas.",
    previsaoRotulo: "Previsão de retorno",
    previsao: "",
    previsaoTexto: "Hoje",
    mostrarDestaques: true,
    mostrarJogo: true,
    servicosTitulo: "Ainda disponível",
    servicosTexto: "Se este serviço está em manutenção, a Science Platform pode continuar no ar.",
    servicos: [
      { rotulo: "Science Platform", url: "https://scienceplatform.linea.org.br" }
    ],
    links: [
      { rotulo: "Instagram", url: "https://www.instagram.com/linea_org/" },
      { rotulo: "YouTube", url: "https://www.youtube.com/@linea_org" },
      { rotulo: "X", url: "https://x.com/linea_org" },
      { rotulo: "Facebook", url: "https://www.facebook.com/linea.org/" },
      { rotulo: "LinkedIn", url: "https://www.linkedin.com/company/linea-astronomia/" },
      { rotulo: "Bluesky", url: "https://bsky.app/profile/linea-org.bsky.social" },
      { rotulo: "GitHub", url: "https://github.com/linea-it" },
      { rotulo: "Suporte", url: "mailto:suporte@linea.org.br" }
    ]
  };

  var timer = 0;
  var destaqueItems = [];
  var destaqueIndex = 0;
  var gameReady = false;

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function safeUrl(value) {
    var url = text(value);
    if (/^https:\/\/[^\s]+$/i.test(url) || /^http:\/\/[^\s]+$/i.test(url) || /^mailto:[^\s]+$/i.test(url)) {
      return url;
    }
    return "";
  }

  function safeAsset(value) {
    var url = text(value);
    if (/^https:\/\/[^\s]+$/i.test(url) || /^http:\/\/[^\s]+$/i.test(url)) return url;
    if (/^[A-Za-z0-9._/-]+$/.test(url) && url.indexOf("..") === -1) {
      return url.charAt(0) === "/" ? url : "/" + url;
    }
    return "";
  }

  function parseDate(value) {
    var raw = text(value);
    if (!raw) return null;
    var date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    var formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function joinPt(parts) {
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1];
  }

  function describeRemaining(target) {
    var minutes = Math.round((target.getTime() - Date.now()) / 60000);
    if (minutes <= 0) return "O horário previsto já passou.";
    if (minutes < 2) return "Menos de um minuto.";
    var days = Math.floor(minutes / 1440);
    var hours = Math.floor((minutes - days * 1440) / 60);
    var mins = minutes % 60;
    var parts = [];
    if (days) parts.push(days + (days === 1 ? " dia" : " dias"));
    if (hours) parts.push(hours + (hours === 1 ? " hora" : " horas"));
    if (mins && days === 0) parts.push(mins + (mins === 1 ? " minuto" : " minutos"));
    if (!parts.length) return "Menos de um minuto.";
    var verb = parts.length === 1 && parts[0].indexOf("1 ") === 0 ? "Falta " : "Faltam ";
    return verb + joinPt(parts) + ".";
  }

  function renderMessage(el, message) {
    el.replaceChildren();
    text(message).split(/\n{2,}/).forEach(function (block) {
      var lines = block.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var paragraph = document.createElement("p");
      lines.forEach(function (line, index) {
        if (index) paragraph.appendChild(document.createElement("br"));
        paragraph.appendChild(document.createTextNode(line));
      });
      el.appendChild(paragraph);
    });
  }

  function renderLinks(data) {
    var nav = document.getElementById("links");
    nav.replaceChildren();
    var links = Array.isArray(data.links) ? data.links : [];
    links.forEach(function (link) {
      if (!link || typeof link !== "object") return;
      var url = safeUrl(link.url);
      var label = text(link.rotulo);
      if (!url || !label) return;
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = label;
      if (/^https?:/i.test(url)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      nav.appendChild(anchor);
    });
    nav.hidden = nav.childElementCount === 0;
  }

  function watch(date, output) {
    if (timer) clearInterval(timer);
    function tick() {
      output.textContent = describeRemaining(date);
      if (date.getTime() <= Date.now()) clearInterval(timer);
    }
    tick();
    timer = setInterval(tick, 15000);
  }

  function plain(value) {
    var raw = String(value || "").replace(/<[^>]*>/g, " ");
    raw = raw.replace(/&#(\d+);/g, function (_, digits) {
      var code = Number(digits);
      return code > 0 && code < 1114112 ? String.fromCodePoint(code) : "";
    });
    raw = raw.replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      var code = parseInt(hex, 16);
      return code > 0 && code < 1114112 ? String.fromCodePoint(code) : "";
    });
    return raw
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&hellip;/gi, "…")
      .replace(/\s+/g, " ")
      .replace(/\s*(\[\s*…\s*\]|\[…\]|\.\.\.)\s*$/g, "")
      .trim();
  }

  function clip(value) {
    var clean = plain(value);
    if (clean.length <= 280) return clean;
    return clean.slice(0, 277).replace(/\s+\S*$/, "").trim() + "…";
  }

  function formatDay(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value));
    if (!match) return "";
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function renderServicos(data) {
    var section = document.getElementById("servicos");
    var list = Array.isArray(data.servicos) ? data.servicos : defaults.servicos;
    var box = document.getElementById("servicos-links");
    box.replaceChildren();
    list.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var url = safeUrl(item.url);
      var label = text(item.rotulo);
      if (!url || !label) return;
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = label;
      if (/^https?:/i.test(url)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      box.appendChild(anchor);
    });
    document.getElementById("servicos-titulo").textContent = text(data.servicosTitulo) || defaults.servicosTitulo;
    var hint = document.getElementById("servicos-texto");
    var hintText = typeof data.servicosTexto === "string" ? data.servicosTexto.trim() : defaults.servicosTexto;
    hint.textContent = hintText;
    hint.hidden = !hintText;
    section.hidden = box.childElementCount === 0;
  }

  function postsToItems(posts) {
    if (!Array.isArray(posts)) return [];
    return posts.map(function (post) {
      if (!post || !post.title || !post.slug) return null;
      var slug = text(post.slug);
      var titulo = plain(post.title.rendered || post.title);
      if (!titulo || !/^[a-z0-9-]+$/.test(slug)) return null;
      return {
        titulo: titulo,
        texto: clip(post.excerpt && post.excerpt.rendered),
        data: text(post.date),
        url: "https://www.linea.org.br/noticia/" + slug,
        rotulo: "Ler no site",
        kicker: "Notícias do LIneA",
        botao: "Outra notícia"
      };
    }).filter(Boolean);
  }

  function syncEspera() {
    var destaqueHidden = document.getElementById("destaque").hidden;
    var conviteHidden = document.getElementById("convite-jogo").hidden;
    document.getElementById("espera").hidden = destaqueHidden && conviteHidden;
  }

  function showDestaque(index) {
    var item = destaqueItems[index];
    if (!item) return;
    document.getElementById("destaque-titulo").textContent = item.titulo;
    var body = document.getElementById("destaque-texto");
    body.textContent = item.texto || "";
    body.hidden = !item.texto;
    var when = document.getElementById("destaque-data");
    var day = formatDay(item.data);
    when.textContent = day;
    when.hidden = !day;
    if (item.kicker) document.getElementById("destaque-kicker").textContent = item.kicker;
    if (item.botao) document.getElementById("outro-destaque").textContent = item.botao;
    var link = document.getElementById("destaque-link");
    var url = safeUrl(item.url);
    var label = text(item.rotulo);
    link.hidden = !url || !label;
    if (!link.hidden) {
      link.href = url;
      link.textContent = label;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    var image = document.getElementById("destaque-imagem");
    var src = safeAsset(item.imagem);
    image.hidden = !src;
    image.alt = src ? item.titulo : "";
    if (src) image.src = src;
    else image.removeAttribute("src");
  }

  function showLocalDestaques(data) {
    var section = document.getElementById("destaque");
    var source = Array.isArray(data) ? data : (data && data.itens);
    var kicker = !Array.isArray(data) && data ? text(data.kicker) : "";
    destaqueItems = (source || []).filter(function (item) {
      return item && text(item.titulo) && text(item.texto);
    }).map(function (item) {
      return {
        titulo: text(item.titulo),
        texto: text(item.texto),
        data: "",
        url: item.url,
        rotulo: item.rotulo,
        imagem: item.imagem,
        kicker: kicker || "Rubin Observatory",
        botao: "Outra nota"
      };
    });
    if (!destaqueItems.length) {
      section.hidden = true;
      syncEspera();
      return;
    }
    destaqueIndex = Math.floor(Math.random() * destaqueItems.length);
    showDestaque(destaqueIndex);
    section.hidden = false;
    document.getElementById("outro-destaque").hidden = destaqueItems.length < 2;
    syncEspera();
  }

  function showNews(items) {
    var section = document.getElementById("destaque");
    destaqueItems = items;
    destaqueIndex = 0;
    showDestaque(0);
    section.hidden = false;
    document.getElementById("outro-destaque").hidden = items.length < 2;
    syncEspera();
  }

  function loadDestaques(enabled) {
    var section = document.getElementById("destaque");
    if (!enabled) {
      section.hidden = true;
      syncEspera();
      return;
    }
    fetch("/linha-noticias", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("noticias");
        return response.json();
      })
      .then(function (posts) {
        var items = postsToItems(posts);
        if (!items.length) throw new Error("noticias");
        showNews(items);
      })
      .catch(function () {
        fetch("/destaques.json", { cache: "no-store" })
          .then(function (response) {
            if (!response.ok) throw new Error("destaques");
            return response.json();
          })
          .then(showLocalDestaques)
          .catch(function () {
            section.hidden = true;
            syncEspera();
          });
      });
  }

  function closeGame() {
    gameReady = false;
    document.getElementById("jogo").hidden = true;
    var button = document.getElementById("abrir-jogo");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "Jogar caça aos exoplanetas";
  }

  function setupGame() {
    var grid = document.getElementById("grid");
    var message = document.getElementById("jogo-msg");
    var targets = new Set();
    var found = 0;
    grid.replaceChildren();
    while (targets.size < 3) targets.add(Math.floor(Math.random() * 25));
    message.textContent = "Três planetas estão escondidos na grade.";

    for (var index = 0; index < 25; index += 1) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.setAttribute("aria-label", "Setor " + (index + 1));
      button.addEventListener("click", function (event) {
        var cell = event.currentTarget;
        var sector = Number(cell.dataset.index);
        if (cell.disabled) return;
        cell.disabled = true;
        if (targets.has(sector)) {
          cell.dataset.state = "hit";
          cell.setAttribute("aria-label", "Planeta encontrado no setor " + (sector + 1));
          found += 1;
          message.textContent = found === 3
            ? "Os três planetas foram encontrados."
            : found + " de 3 planetas encontrados.";
        } else {
          cell.dataset.state = "miss";
          cell.setAttribute("aria-label", "Setor " + (sector + 1) + " vazio");
        }
      });
      button.dataset.index = String(index);
      grid.appendChild(button);
    }
  }

  function apply(data) {
    var organizacao = text(data.organizacao);
    var servico = text(data.servico);
    var titulo = text(data.titulo) || defaults.titulo;
    var faixa = text(data.faixa);

    document.getElementById("organizacao").textContent = organizacao;
    document.getElementById("marca").hidden = !organizacao;
    document.getElementById("servico").textContent = servico;
    document.getElementById("servico").hidden = !servico;
    document.getElementById("faixa-texto").textContent = faixa;
    document.getElementById("faixa").hidden = !faixa;
    document.getElementById("titulo").textContent = titulo;
    document.title = organizacao ? titulo + " — " + organizacao : titulo;

    var logo = document.getElementById("logo");
    var logoUrl = safeAsset(data.logo);
    logo.hidden = !logoUrl;
    logo.alt = organizacao || "Logo";
    if (logoUrl) logo.src = logoUrl;
    else logo.removeAttribute("src");

    var message = document.getElementById("mensagem");
    renderMessage(message, data.mensagem);
    message.hidden = message.childElementCount === 0;

    var eta = document.getElementById("previsao");
    var when = parseDate(data.previsao);
    var pretty = text(data.previsaoTexto) || (when ? formatDate(when) : "");
    eta.hidden = !pretty && !when;
    document.getElementById("previsao-rotulo").textContent = text(data.previsaoRotulo) || defaults.previsaoRotulo;
    document.getElementById("previsao-texto").textContent = pretty;
    document.getElementById("previsao-texto").hidden = !pretty;
    var count = document.getElementById("contagem");
    if (when) {
      count.hidden = false;
      watch(when, count);
    } else {
      if (timer) clearInterval(timer);
      count.hidden = true;
      count.textContent = "";
    }

    renderLinks(data);
    renderServicos(data);

    document.getElementById("convite-jogo").hidden = data.mostrarJogo === false;
    closeGame();
    loadDestaques(data.mostrarDestaques !== false);
    syncEspera();
  }

  function setupTheme() {
    var button = document.getElementById("tema");
    function label() {
      var dark = document.documentElement.getAttribute("data-theme") !== "light";
      button.textContent = dark ? "Tema claro" : "Tema escuro";
    }
    button.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("maint-theme", next);
      } catch (error) {
        /* a página segue no tema escolhido só até recarregar */
      }
      label();
    });
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (event) {
        var stored = null;
        try {
          stored = localStorage.getItem("maint-theme");
        } catch (error) {
          stored = "keep";
        }
        if (stored) return;
        document.documentElement.setAttribute("data-theme", event.matches ? "light" : "dark");
        label();
      });
    }
    label();
  }

  document.getElementById("logo").addEventListener("error", function () {
    this.hidden = true;
  });
  document.getElementById("destaque-imagem").addEventListener("error", function () {
    this.hidden = true;
    this.removeAttribute("src");
  });
  document.getElementById("reiniciar").addEventListener("click", setupGame);
  document.getElementById("outro-destaque").addEventListener("click", function () {
    if (destaqueItems.length < 2) return;
    destaqueIndex = (destaqueIndex + 1) % destaqueItems.length;
    showDestaque(destaqueIndex);
  });
  document.getElementById("abrir-jogo").addEventListener("click", function () {
    var game = document.getElementById("jogo");
    var open = game.hidden;
    game.hidden = !open;
    this.setAttribute("aria-expanded", open ? "true" : "false");
    this.textContent = open ? "Fechar o jogo" : "Jogar caça aos exoplanetas";
    if (open && !gameReady) {
      setupGame();
      gameReady = true;
    }
  });
  setupTheme();

  fetch("/content.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("content");
      return response.json();
    })
    .then(function (data) {
      apply(Object.assign({}, defaults, data && typeof data === "object" && !Array.isArray(data) ? data : {}));
    })
    .catch(function () {
      apply(defaults);
    });
})();
