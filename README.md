# Página de manutenção

Nginx estático para exibir enquanto um serviço web está em manutenção. Sobe um container no mesmo servidor das aplicações e o proxy delas encaminha as requisições para a porta publicada (padrão **7777**). Dá para ter uma instância por aplicação.

A página responde **503** de propósito: o navegador mostra o aviso, e monitores entendem que o serviço está indisponível. `/healthz` responde 200 só para o healthcheck do container.

## Editar o texto

O conteúdo fica em [`html/content.json`](html/content.json). Salve o arquivo e atualize o navegador. Não é preciso reiniciar o container.

| Campo | Função |
| --- | --- |
| `organizacao` | Nome no alto da página |
| `servico` | Nome da aplicação. Vazio omite a linha |
| `logo` | Arquivo em `html/` ou URL `http(s)`. Vazio usa só o nome |
| `faixa` | Tarja de status. Vazio omite a tarja |
| `titulo` | Título principal |
| `mensagem` | Texto. Uma linha em branco começa outro parágrafo |
| `previsaoRotulo` | Rótulo da previsão |
| `previsaoTexto` | Previsão em texto livre, por exemplo `Hoje, 18h` |
| `previsao` | Data ISO 8601, por exemplo `2026-11-01T18:00:00-03:00`. Liga a contagem. Vazio omite a contagem |
| `mostrarDestaques` | `false` esconde as notícias |
| `mostrarJogo` | `false` esconde o botão do jogo |
| `servicosTitulo` | Título do atalho para outros serviços |
| `servicosTexto` | Texto desse atalho. Vazio omite a frase |
| `servicos` | Lista de `{ "rotulo", "url" }`. Vazio esconde o bloco. Na instância da própria Science Platform, deixe vazio |
| `links` | Lista de `{ "rotulo", "url" }` com `http`, `https` ou `mailto` |

Enquanto [www.linea.org.br](https://www.linea.org.br) responde, a página mostra as notícias recentes de lá, com link para a matéria. As redes do rodapé são as mesmas do site. Se o site não responder, entram as notas de [`html/destaques.json`](html/destaques.json). O jogo só abre em "Jogar caça aos exoplanetas".

Exemplo de uma instância só para o catálogo:

```json
{
  "organizacao": "LIneA",
  "servico": "Catálogo",
  "faixa": "Manutenção programada",
  "titulo": "Catálogo indisponível",
  "mensagem": "O catálogo volta ao final desta janela.",
  "previsaoRotulo": "Previsão de retorno",
  "previsao": "2026-11-01T18:00:00-03:00",
  "previsaoTexto": "1º de novembro, 18h",
  "mostrarJogo": false,
  "links": [
    { "rotulo": "Suporte", "url": "mailto:suporte@linea.org.br" }
  ]
}
```

O JSON precisa ser válido (sem vírgula sobrando). Se o JSON estiver inválido, a página continua com o texto padrão que já está no HTML.

## Subir

Na pasta deste repositório, no servidor:

```sh
cp env-example .env
docker compose up -d
```

Os volumes são relativos a esta pasta. A configuração do nginx fica em `conf.d/` e entra no container como diretório. A pilha pode ficar em qualquer lugar, inclusive `/srv/nginx-maintenance`.

Se uma tentativa anterior criou `/srv/nginx-maintenance/default.conf` como pasta, apague essa pasta e suba de novo com este compose. O Docker faz isso quando o caminho montado ainda não existe e o destino dentro do container é um arquivo.

- Página: `http://127.0.0.1:7777/` (HTTP 503, com o HTML)
- Container no ar: `http://127.0.0.1:7777/healthz` (HTTP 200)

`restart: unless-stopped` sobe de novo após um reboot. `docker compose stop` não religa sozinho. Para encerrar a manutenção: `docker compose down`.

## Uma instância por aplicação

Outra porta, outro nome e, se o texto for diferente, outro JSON montado por cima de `html/content.json`:

```sh
HTTP_PORT=7778 CONTAINER_NAME=maintenance-catalogo docker compose -p catalogo up -d
```

Para o texto próprio, descomente o volume no `docker-compose.yml` ou crie um `docker-compose.override.yml` ao lado:

```yaml
services:
  web:
    volumes:
      - ./conteudo/catalogo.json:/usr/share/nginx/html/content.json:ro
```

## Proxy externo

Encaminhe o host da aplicação para `HOST:7777`. Este container só escuta HTTP; o TLS continua no proxy da borda.

Se a borda for nginx, o corpo do 503 só chega ao visitante com `proxy_intercept_errors off;` (é o padrão). Não guarde essa resposta em cache.
