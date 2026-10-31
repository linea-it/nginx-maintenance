(function () {
  var defaults = {
    titulo: "We will be back soon",
    mensagem: "We apologize for the inconvenience, but we are currently performing maintenance on our platform. If you need assistance, please feel free to {contato}. We'll be back online shortly. Thank you for your patience!",
    contatoRotulo: "contact us",
    contatoUrl: "mailto:helpdesk@linea.org.br",
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
      apply(Object.assign({}, defaults, data));
    })
    .catch(function () {});
})();
