# Nginx Maintenance Page com Let's Encrypt

1) Criar estrutura de diretórios com usuário do APP 
   (se rodar docker-compose o dono será root)

2) Editar o init-letsencrypt.sh adicionando o hostname correto

3) Criar arquivos docker-compose.yml e app.conf

## Criar arquivo app.conf e colocar em ./data/nginx/app.conf

server {
    listen 80;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    server_name <HOSTNAME>;    

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name <hostname>;

    ssl_certificate /etc/letsencrypt/live/<HOSTNAME>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<HOSTNAME>/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://<HOSTNAME>; #for demo purposes
    }
}


## Criar arquivo docker-compose.yml

version: '3'
services:
  nginx:
    image: nginx:1.15-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx/conf.d:/etc/nginx/conf.d
      - ./data/nginx/log:/var/log/nginx
      - ./data/nginx/html:/usr/share/nginx/html
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    #command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"
  certbot:
    image: certbot/certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    #entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"


4) chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh

4) Depois de gerar os certificados, descomentar as linhas abaixo do docker-compose.yml

  #command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"
  #entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"




