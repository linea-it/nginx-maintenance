# Página de manutenção

Nginx estático para exibir enquanto um serviço web está em manutenção. Sobe um container no mesmo servidor das aplicações e o proxy delas encaminha as requisições para a porta publicada (padrão **7777**). Dá para ter uma instância por aplicação.

A página responde **503** de propósito: o navegador mostra o aviso, e monitores entendem que o serviço está indisponível. `/healthz` responde 200 só para o healthcheck do container.

O visual segue o aviso usado em [canvas.linea.org.br](https://canvas.linea.org.br/): fundo branco, título, texto, assinatura, marca do LIneA, ícones e dois links.

## Editar o texto

O conteúdo fica em [`html/content.json`](html/content.json). Salve o arquivo e atualize o navegador. Não é preciso reiniciar o container.

| Campo | Função |
| --- | --- |
| `titulo` | Título principal |
| `mensagem` | Parágrafo. `{contato}` vira o link de contato |
| `contatoRotulo` | Texto desse link, por exemplo `contact us` |
| `contatoUrl` | `mailto:` ou `http(s)` |
| `periodo.rotulo` | Rótulo da janela, por exemplo `Maintenance window` |
| `periodo.inicio` | Início. `AAAA-MM-DD` ou `2026-11-03T09:00:00-03:00`. Vazio omite |
| `periodo.fim` | Fim, no mesmo formato. Vazio omite |
| `periodo.texto` | Frase livre. Se preenchida, substitui início e fim |
| `retorno.rotulo` | Rótulo da previsão, por exemplo `Expected return` |
| `retorno.quando` | Data esperada, no mesmo formato das datas do período |
| `retorno.texto` | Frase livre, por exemplo `Today, 6 pm`. Se preenchida, substitui `quando` |
| `assinatura` | Linha à direita, por exemplo `— LIneA IT Team` |
| `instituicao` | Texto ao lado da marca. Uma quebra de linha no JSON vira outra linha na página |
| `logo` | Arquivo em `html/images/` ou URL `http(s)` |
| `redes` | Lista de `{ "rotulo", "url", "icone" }`. Vazio esconde os ícones |
| `rodape` | Lista de `{ "rotulo", "url" }`. Vazio esconde os links de baixo |

Exemplo de uma instância só para o catálogo:

```json
{
  "titulo": "Catalog unavailable",
  "mensagem": "The catalog is under maintenance. If you need assistance, please feel free to {contato}.",
  "contatoRotulo": "contact us",
  "contatoUrl": "mailto:helpdesk@linea.org.br",
  "periodo": {
    "inicio": "2026-11-03T09:00:00-03:00",
    "fim": "2026-11-03T18:00:00-03:00"
  },
  "retorno": {
    "texto": "Today, 6 pm"
  },
  "assinatura": "— LIneA IT Team"
}
```

O JSON precisa ser válido (sem vírgula sobrando). Se o JSON estiver inválido, a página continua com o texto que já está no HTML.

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
