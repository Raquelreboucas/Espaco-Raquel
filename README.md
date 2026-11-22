# Meu Espaço Pessoal

Wishlists, objetivos, planner semanal e estudos para concurso. Tem login com e-mail e senha, e cada conta só vê os próprios dados.

## Rodar no seu computador

Requer Node 22.5 ou mais novo.

```
npm install
npm start
```

Abra http://localhost:3000 e clique em "Criar conta". Os dados ficam em `data/meu-espaco.db` (SQLite).

A **primeira conta criada** recebe a lista de eletrodomésticos da categoria Casa. As outras começam vazias.

`npm test` roda os testes da API e do login.

## Publicar na Vercel

A Vercel não guarda arquivos entre execuções, então o arquivo SQLite local não serve lá. Em produção o app usa o [Turso](https://turso.tech) (SQLite na nuvem, plano gratuito). O código é o mesmo.

1. Crie um banco no Turso e pegue a URL (`libsql://...`) e o token:
   ```
   turso db create espaco
   turso db show espaco --url
   turso db tokens create espaco
   ```
2. Na Vercel, importe este repositório do GitHub. Não precisa configurar build.
3. Em Settings → Environment Variables, adicione:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | a URL `libsql://...` |
   | `DATABASE_AUTH_TOKEN` | o token do Turso |
   | `ALLOW_SIGNUP` | `false` (depois de criar a sua conta) |

4. Faça o deploy, abra o endereço e crie a sua conta. Depois coloque `ALLOW_SIGNUP=false` e faça um novo deploy, para que ninguém mais consiga se cadastrar.

Limite da Vercel: cada gravação envia uma seção inteira, e o corpo do pedido pode ter até 4,5 MB. Muitas fotos grandes numa mesma wishlist podem passar disso.

## Como funciona

```
public/   index.html, styles.css, app.js (o front-end)
server/   app.js (rotas, login), auth.js (senhas), db.js (banco), schema.sql (tabelas)
api/      index.js (entrada da Vercel)
```

- Senhas são guardadas com scrypt (nunca em texto puro). A sessão é um cookie `HttpOnly` e `SameSite=Lax`, com validade de 30 dias, e `Secure` em produção.
- Depois de 5 senhas erradas para o mesmo e-mail, o login fica bloqueado por 15 minutos.
- Pedidos que alteram dados só são aceitos se vierem do próprio site.
- O menu lateral tem "Sair" e "Baixar backup (.json)". No celular, os dois ficam no fim da tela Início.

| Rota | O que faz |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout` | cadastro, entrada e saída |
| `GET /api/auth/me` | quem está logado |
| `GET /api/state` | as 4 seções do usuário (`null` se ainda não gravada) |
| `PUT /api/state/:section` | substitui uma seção (`wishlist`, `goals`, `planner`, `study`) numa transação |
| `GET /api/export` | backup completo em JSON |

## Limites

- Não há recuperação de senha por e-mail.
- Duas abas abertas ao mesmo tempo se sobrescrevem: vale a última gravação.
- O bloqueio por tentativas é por e-mail, não por endereço de IP.
