# Meu Espaço Pessoal

Vision board, wishlists, objetivos, planner semanal e estudos para concurso. Tem login com e-mail e senha, e cada conta só vê os próprios dados.

## Rodar no seu computador

Requer Node 22.5 ou mais novo.

```
npm install
npm start
```

Abra http://localhost:3000 e clique em "Criar conta". Os dados ficam em `data/meu-espaco.db` (SQLite).

A **primeira conta criada** recebe a lista de eletrodomésticos da categoria Casa. As outras começam vazias. A página Concurso já vem com três concursos (TJSP, Receita Federal e INSS), cada um com data, meta semanal, matérias e registro de estudo próprios.

`npm test` roda os testes da API e do login.

## Publicar na Vercel

A Vercel não guarda arquivos entre execuções, então o arquivo SQLite local não serve lá. Em produção o app usa um banco externo: **Redis** ou **Turso**. Na Vercel, importe este repositório do GitHub (não precisa configurar build) e escolha uma das opções.

### Opção 1: Redis (pode ser um banco já usado por outros projetos)

1. Em Storage, abra o banco Redis (Upstash) e clique em **Connect Project**.
2. Escolha o projeto e mantenha o prefixo `KV`. A Vercel cria `KV_REST_API_URL` e `KV_REST_API_TOKEN`.

Todas as chaves do app começam com `espaco:`. O prefixo organiza, mas não protege: quem tem o token do banco lê tudo. Deixe a opção **Eviction** desligada, para o banco não apagar dados quando encher.

### Opção 2: Turso (SQLite na nuvem)

1. Crie um banco no [Turso](https://turso.tech) e pegue a URL (`libsql://...`) e o token.
2. Em Settings → Environment Variables, adicione `DATABASE_URL` e `DATABASE_AUTH_TOKEN`.

Se `DATABASE_URL` existir, ela tem prioridade sobre o Redis. Trocar de banco não copia os dados.

### Depois de conectar

1. Faça um novo deploy e abra `/api/health`: a resposta `{"ok":true}` indica que o banco conectou.
2. Crie a sua conta.
3. Adicione `ALLOW_SIGNUP=false` e faça outro deploy, para que ninguém mais consiga se cadastrar.

Limite da Vercel: cada gravação envia uma seção inteira, e o corpo do pedido pode ter até 4,5 MB. Muitas fotos grandes podem passar disso, e o plano do banco também tem limites próprios de tamanho.

## Como funciona

```
public/   index.html, styles.css, app.js (o front-end)
server/   app.js (rotas, login), auth.js (senhas), db.js (banco SQLite/Turso), redis.js (banco Redis), schema.sql (tabelas)
api/      index.js (entrada da Vercel)
```

- Senhas são guardadas com scrypt (nunca em texto puro). A sessão é um cookie `HttpOnly` e `SameSite=Lax`, com validade de 30 dias, e `Secure` em produção.
- Depois de 5 senhas erradas para o mesmo e-mail, o login fica bloqueado por 15 minutos.
- Pedidos que alteram dados só são aceitos se vierem do próprio site.
- O menu lateral tem "Sair" e "Baixar backup (.json)". No celular, os dois ficam no fim da tela Início.
- A tela Início é o vision board: fotos, frases e notas que podem ser reordenadas arrastando. O quadro aceita até cerca de 4 MB.

| Rota | O que faz |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout` | cadastro, entrada e saída |
| `GET /api/auth/me` | quem está logado |
| `GET /api/state` | as seções do usuário (`null` se ainda não gravada) |
| `PUT /api/state/:section` | substitui uma seção (`wishlist`, `goals`, `planner`, `study`, `tjsp`, `board`) numa transação |
| `GET /api/export` | backup completo em JSON |

## Limites

- Não há recuperação de senha por e-mail.
- Duas abas abertas ao mesmo tempo se sobrescrevem: vale a última gravação.
- O bloqueio por tentativas é por e-mail, não por endereço de IP.
