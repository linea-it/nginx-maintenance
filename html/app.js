(function () {
  var defaults = {
    titulo: "We will be back soon",
    mensagem: "We apologize for the inconvenience, but we are currently performing maintenance on our platform. If you need assistance, please feel free to {contato}. We'll be back online shortly. Thank you for your patience!",
    contatoRotulo: "contact us",
    contatoUrl: "mailto:helpdesk@linea.org.br",
    periodo: { rotulo: "Maintenance window", inicio: "", fim: "", texto: "" },
    retorno: { rotulo: "Expected return", quando: "", texto: "" },
    assinatura: "— LIneA IT Team",
    instituicao: "Associação Laboratório\nInterinstitucional de\ne-Astronomia LIneA",
    logo: "/images/linea-logo.png",
    redes: [
      { rotulo: "LinkedIn", url: "https://www.linkedin.com/company/linea-astronomia/", icone: "/images/linkedin-logo.png" },
      { rotulo: "X", url: "https://x.com/linea_org", icone: "/images/twitter-logo.png" },
      { rotulo: "Instagram", url: "https://www.instagram.com/linea_org/", icone: "/images/instagram-logo.png" },
      { rotulo: "YouTube", url: "https://www.youtube.com/@linea_org", icone: "/images/youtube-logo.png" },
      { rotulo: "Facebook", url: "https://www.facebook.com/linea.org/", icone: "/images/facebook-logo.png" }
    ],
    rodape: [
      { rotulo: "status.linea.org.br", url: "https://status.linea.org.br/" },
      { rotulo: "www.linea.org.br", url: "https://www.linea.org.br/" }
    ]
  };

  function safeUrl(url) {
    if (typeof url !== "string") return "";
    var value = url.trim();
    if (/^(https?:|mailto:)/i.test(value)) return value;
    return "";
  }

  function safeAsset(path) {
    if (typeof path !== "string") return "";
    var value = path.trim();
    if (value.indexOf("..") !== -1) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.charAt(0) !== "/") value = "/" + value;
    return value;
  }

  function formatWhen(value) {
    if (typeof value !== "string") return "";
    var raw = value.trim();
    if (!raw) return "";
    var lang = document.documentElement.lang || "en";
    var dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (dateOnly) {
      var day = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
      return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(day);
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
      var when = new Date(raw);
      if (!isNaN(when.getTime())) {
        return new Intl.DateTimeFormat(lang, {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo"
        }).format(when);
      }
    }
    return raw;
  }

  function periodoTexto(periodo) {
    if (!periodo) return "";
    if (typeof periodo.texto === "string" && periodo.texto.trim()) return periodo.texto.trim();
    var inicio = formatWhen(periodo.inicio);
    var fim = formatWhen(periodo.fim);
    if (inicio && fim) return inicio + " – " + fim;
    return inicio || fim;
  }

  function retornoTexto(retorno) {
    if (!retorno) return "";
    if (typeof retorno.texto === "string" && retorno.texto.trim()) return retorno.texto.trim();
    return formatWhen(retorno.quando);
  }

  function setLine(id, label, value) {
    var line = document.getElementById(id);
    if (!line) return false;
    var text = (value || "").trim();
    line.hidden = !text;
    line.textContent = "";
    if (!text) return false;
    if (label) {
      var rotulo = document.createElement("span");
      rotulo.className = "rotulo";
      rotulo.textContent = label;
      line.appendChild(rotulo);
      line.appendChild(document.createTextNode(" " + text));
    } else {
      line.textContent = text;
    }
    return true;
  }

  function fillMessage(data) {
    var box = document.getElementById("mensagem");
    if (!box) return;
    var parts = String(data.mensagem || "").split("{contato}");
    box.textContent = "";
    box.appendChild(document.createTextNode(parts[0]));
    if (parts.length < 2) return;
    var link = document.createElement("a");
    link.id = "contato";
    link.href = safeUrl(data.contatoUrl) || "mailto:helpdesk@linea.org.br";
    link.textContent = data.contatoRotulo || "";
    box.appendChild(link);
    box.appendChild(document.createTextNode(parts.slice(1).join("{contato}")));
  }

  function fillLinks(id, items, withIcon) {
    var nav = document.getElementById(id);
    if (!nav || !Array.isArray(items)) return;
    nav.textContent = "";
    nav.hidden = items.length === 0;
    items.forEach(function (item) {
      if (!item) return;
      var href = safeUrl(item.url);
      if (!href) return;
      var anchor = document.createElement("a");
      anchor.href = href;
      if (/^https?:/i.test(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      if (withIcon) {
        var src = safeAsset(item.icone);
        if (!src) return;
        var img = document.createElement("img");
        img.src = src;
        img.alt = item.rotulo || "";
        anchor.appendChild(img);
      } else {
        anchor.textContent = item.rotulo || href;
      }
      nav.appendChild(anchor);
    });
  }

  function apply(data) {
    var titulo = document.getElementById("titulo");
    if (titulo) titulo.textContent = data.titulo || "";
    document.title = (data.titulo || "Maintenance") + " — LIneA";
    fillMessage(data);
    var temPeriodo = setLine("periodo-linha", (data.periodo && data.periodo.rotulo) || "", periodoTexto(data.periodo));
    var temRetorno = setLine("retorno-linha", (data.retorno && data.retorno.rotulo) || "", retornoTexto(data.retorno));
    var janela = document.getElementById("janela");
    if (janela) janela.hidden = !(temPeriodo || temRetorno);
    var assinatura = document.getElementById("assinatura");
    if (assinatura) assinatura.textContent = data.assinatura || "";
    var instituicao = document.getElementById("instituicao");
    if (instituicao) instituicao.textContent = data.instituicao || "";
    var logo = document.getElementById("logo");
    var src = safeAsset(data.logo);
    if (logo && src) logo.src = src;
    if (Array.isArray(data.redes)) fillLinks("redes", data.redes, true);
    if (Array.isArray(data.rodape)) fillLinks("rodape", data.rodape, false);
  }

  fetch("/content.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("content");
      return response.json();
    })
    .then(function (data) {
      var merged = Object.assign({}, defaults, data);
      if (data.periodo) merged.periodo = Object.assign({}, defaults.periodo, data.periodo);
      if (data.retorno) merged.retorno = Object.assign({}, defaults.retorno, data.retorno);
      apply(merged);
    })
    .catch(function () {});
})();
