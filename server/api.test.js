import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from './db.js';
import { createHandler } from './app.js';
import { startFakeRedis } from './fake-redis.js';

const start = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'espaco-'));
  let fake;
  if (process.env.TEST_BACKEND === 'redis') {
    fake = await startFakeRedis();
    delete process.env.DATABASE_URL;
    process.env.KV_REST_API_URL = fake.url;
    process.env.KV_REST_API_TOKEN = fake.token;
  }
  const store = await openDb(fake ? {} : { url: 'file:' + join(dir, 'test.db').replaceAll('\\', '/') });
  const server = createServer(createHandler(async () => store));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, stop: () => {
    server.closeAllConnections(); server.close(); store.close();
    if (fake) {
      assert.deepEqual(fake.keys().filter((k) => !k.startsWith('espaco:')), []); // banco compartilhado: só o prefixo do app
      fake.stop();
    }
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* Windows pode manter o arquivo preso */ }
  } };
};

/** Cliente minúsculo que guarda o cookie de sessão. */
const client = (base) => {
  let sid = '';
  const call = async (method, path, body, headers = {}) => {
    const r = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(sid ? { Cookie: sid } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = r.headers.get('set-cookie');
    if (set) sid = set.startsWith('sid=;') ? '' : set.split(';')[0];
    const text = await r.text();
    return { status: r.status, headers: r.headers, json: text && r.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text };
  };
  return { call, get: (p) => call('GET', p), put: (p, b) => call('PUT', p, b), post: (p, b) => call('POST', p, b) };
};
const signup = (c, email = 'raquel@exemplo.com', password = 'senha-forte-123') => c.post('/api/auth/register', { email, password, name: 'Raquel' });

test('serve o front-end e bloqueia tudo sem login', async () => {
  const { base, stop } = await start();
  const c = client(base);
  const html = await c.get('/');
  assert.equal(html.status, 200);
  assert.match(html.json, /Meu <em>espaço/);
  assert.match(html.headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(html.headers.get('x-robots-tag'), /noindex/); // fora dos buscadores
  assert.match(html.json, /<meta name="robots" content="noindex/);
  assert.equal((await c.get('/..%2fserver%2fdb.js')).status, 404);
  for (const p of ['/api/state', '/api/export', '/api/auth/me']) assert.equal((await c.get(p)).status, 401, p);
  assert.equal((await c.put('/api/state/planner', { tasks: [], focus: {} })).status, 401);
  stop();
});

test('cadastro, sessão, logout e login', async () => {
  const { base, stop } = await start();
  const c = client(base);
  const r = await signup(c, '  Raquel@Exemplo.com ');
  assert.equal(r.status, 201);
  assert.equal(r.json.user.email, 'raquel@exemplo.com');
  assert.equal(r.json.user.seed, true); // primeira conta
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  assert.match(r.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal((await c.get('/api/auth/me')).json.user.name, 'Raquel');

  assert.equal((await c.post('/api/auth/logout')).status, 204);
  assert.equal((await c.get('/api/auth/me')).status, 401);

  assert.equal((await c.post('/api/auth/login', { email: 'raquel@exemplo.com', password: 'errada-errada' })).status, 401);
  assert.equal((await c.post('/api/auth/login', { email: 'raquel@exemplo.com', password: 'senha-forte-123' })).status, 200);
  assert.equal((await c.get('/api/auth/me')).status, 200);
  stop();
});

test('valida e-mail e senha no cadastro; recusa e-mail repetido', async () => {
  const { base, stop } = await start();
  const c = client(base);
  assert.equal((await signup(c, 'sem-arroba')).status, 400);
  assert.equal((await signup(c, 'a@b.com', 'curta')).status, 400);
  assert.equal((await signup(client(base))).status, 201);
  assert.equal((await signup(client(base), 'RAQUEL@exemplo.com')).status, 409);
  stop();
});

test('bloqueia depois de 5 senhas erradas', async () => {
  const { base, stop } = await start();
  await signup(client(base));
  const c = client(base);
  for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/auth/login', { email: 'raquel@exemplo.com', password: 'errada-' + i })).status, 401);
  assert.equal((await c.post('/api/auth/login', { email: 'raquel@exemplo.com', password: 'senha-forte-123' })).status, 429);
  stop();
});

test('grava e relê todas as seções; cada usuário só vê os próprios dados', async () => {
  const { base, stop } = await start();
  const a = client(base), b = client(base);
  await signup(a);
  const second = await signup(b, 'outra@exemplo.com');
  assert.equal(second.json.user.seed, false);

  const nulls = { wishlist: null, goals: null, planner: null, study: null, tjsp: null, inss: null, rfb: null, board: null };
  assert.deepEqual((await a.get('/api/state')).json.sections, nulls);

  const data = {
    wishlist: {
      cats: [{ id: 'c1', name: 'Casa', tone: 'mint', note: 'n', box: true }, { id: 'c2', name: 'Moda', tone: 'pink', note: '', box: false }],
      items: [
        { id: 'i1', cat: 'c1', name: 'Geladeira', brand: 'X', room: 'Cozinha', price: 10.5, link: 'https://a.com', img: '', prio: 'alta', note: '', done: true, box: false },
        { id: 'i2', cat: 'c1', name: 'Fogão', brand: '', room: '', price: null, link: '', img: '', prio: 'media', note: '', done: false, box: true },
      ],
      seeds: ['s1'],
      deposits: [{ id: 'd1', cat: 'c1', date: '2026-11-22', amount: 250.5, note: '13º' }],
    },
    goals: {
      areas: [{ id: 'a1', name: 'Estudos', tone: 'pink', img: 'data:image/jpeg;base64,AAAA' }],
      items: [{ id: 'g1', area: 'a1', title: 'Curso', desc: 'Detalhes\ndo curso', due: '2027-03', done: false, steps: [{ id: 's1', t: 'um', d: true }, { id: 's2', t: 'dois', d: false }] }],
    },
    planner: { tasks: [{ id: 't1', date: '2026-11-22', text: 'x', done: false }], focus: { '2026-11-16': 'foco' } },
    study: {
      exams: [
        { id: 'tjsp', name: 'TJSP', date: '2027-01-10', weeklyHours: 12,
          subjects: [{ id: 'm1', name: 'Port', topics: [{ id: 'p1', t: 'crase', d: true }] }],
          log: [{ id: 'l1', date: '2026-11-22', subject: 'Port', min: 60 }] },
        { id: 'inss', name: 'INSS', date: '', weeklyHours: 8, subjects: [], log: [] },
      ],
    },
    tjsp: {
      topicos: { 'pen-0': '2026-11-20', 'pt-3': '2026-11-21' },
      revisados: { 'pen-0': '2026-11-22' },
      registros: [{ id: 'q1', m: 'pen', d: '2026-11-22', f: 20, a: 15, t: 0, n: 'Vunesp 2023' }, { id: 'q2', m: 'pt', d: '2026-11-22', f: 10, a: 4 }],
      meta: 75,
    },
    inss: {
      topicos: { 'prev-0': '2026-11-20' }, revisados: {},
      registros: [{ id: 'q1', m: 'prev', d: '2026-11-22', f: 10, a: 8, t: 3 }], meta: 70,
    },
    rfb: {
      topicos: { 'legtrib-2': '2026-11-21' }, revisados: { 'legtrib-2': '2026-11-22' },
      registros: [{ id: 'q1', m: 'port', d: '2026-11-22', f: 5, a: 5 }], meta: 85, sim: { port: 12, trib: 0 }, simDisc: 17.5,
    },
    board: {
      items: [
        { id: 'b1', type: 'quote', img: '', text: 'frase', caption: '', tone: 'pink' },
        { id: 'b2', type: 'image', img: 'data:image/jpeg;base64,AAAA', text: '', caption: 'legenda', tone: 'mint' },
      ],
    },
  };
  for (const [s, body] of Object.entries(data)) assert.equal((await a.put('/api/state/' + s, body)).status, 204);
  assert.deepEqual((await a.get('/api/state')).json.sections, data);

  // a outra conta usa os mesmos ids sem conflito e não enxerga nada da primeira
  assert.deepEqual((await b.get('/api/state')).json.sections, nulls);
  assert.equal((await b.put('/api/state/planner', { tasks: [{ id: 't1', date: '2026-11-23', text: 'dela', done: false }], focus: {} })).status, 204);
  assert.equal((await a.get('/api/state')).json.sections.planner.tasks[0].text, 'x');

  data.goals.items = []; // regravar substitui: remoções persistem
  await a.put('/api/state/goals', data.goals);
  assert.deepEqual((await a.get('/api/state')).json.sections.goals.items, []);
  assert.equal((await a.get('/api/export')).json.data.study.exams[0].name, 'TJSP');
  stop();
});

test('rejeita dados inválidos sem alterar o que já estava salvo', async () => {
  const { base, stop } = await start();
  const c = client(base);
  await signup(c);
  const dep = (amount, cat = 'c1') => c.put('/api/state/wishlist', { cats: [{ id: 'c1', name: 'Casa', tone: 'mint' }], items: [], seeds: [], deposits: [{ id: 'd', cat, date: '2026-11-22', amount }] });
  assert.equal((await dep(-5)).status, 400);
  assert.equal((await dep(10, 'x')).status, 400);
  await c.put('/api/state/wishlist', { cats: [{ id: 'c1', name: 'Casa', tone: 'mint' }], items: [], seeds: [] });
  assert.equal((await c.put('/api/state/wishlist', { cats: [], items: [{ id: 'x', cat: 'nao-existe', name: 'a' }], seeds: [] })).status, 400);
  assert.equal((await c.put('/api/state/planner', { tasks: 'x', focus: {} })).status, 400);
  assert.equal((await c.put('/api/state/nada', {})).status, 404);
  assert.equal((await c.put('/api/state/board', { items: [{ id: 'b', type: 'video' }] })).status, 400);
  assert.equal((await c.put('/api/state/board', { items: [{ id: 'b', type: 'image', img: 'https://x.com/a.png' }] })).status, 400);
  assert.equal((await c.get('/api/state')).json.sections.wishlist.cats.length, 1);
  stop();
});

test('recusa pedidos que alteram dados vindos de outro site', async () => {
  const { base, stop } = await start();
  const c = client(base);
  await signup(c);
  const r = await c.call('PUT', '/api/state/planner', { tasks: [], focus: {} }, { Origin: 'https://site-malicioso.com' });
  assert.equal(r.status, 403);
  stop();
});

test('migra um banco antigo (um concurso só) para o concurso TJSP', async () => {
  const { createClient } = await import('@libsql/client');
  const dir = mkdtempSync(join(tmpdir(), 'espaco-old-'));
  const url = 'file:' + join(dir, 'old.db').split(String.fromCharCode(92)).join('/');
  const raw = createClient({ url });
  await raw.executeMultiple(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    INSERT INTO users(email, password_hash) VALUES ('a@b.com', 'x');
    CREATE TABLE study_settings (user_id INTEGER PRIMARY KEY, exam_name TEXT NOT NULL DEFAULT '', exam_date TEXT NOT NULL DEFAULT '', weekly_hours REAL NOT NULL DEFAULT 10);
    CREATE TABLE study_subjects (user_id INTEGER NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY (user_id, id));
    CREATE TABLE study_topics (user_id INTEGER NOT NULL, id TEXT NOT NULL, subject_id TEXT NOT NULL, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL, PRIMARY KEY (user_id, id));
    CREATE TABLE study_log (user_id INTEGER NOT NULL, id TEXT NOT NULL, date TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', minutes INTEGER NOT NULL, position INTEGER NOT NULL, PRIMARY KEY (user_id, id));
    CREATE INDEX idx_study_log_date ON study_log(user_id, date);
    CREATE TABLE meta (user_id INTEGER NOT NULL, key TEXT NOT NULL, PRIMARY KEY (user_id, key));
    INSERT INTO meta VALUES (1, 'init:study');
    INSERT INTO study_settings VALUES (1, 'Escrevente', '2027-02-01', 15);
    INSERT INTO study_subjects VALUES (1, 'm1', 'Português', 0);
    INSERT INTO study_topics VALUES (1, 'p1', 'm1', 'crase', 1, 0);
    INSERT INTO study_log VALUES (1, 'l1', '2026-11-20', 'Português', 45, 0);`);
  raw.close();
  const store = await openDb({ url });
  const { study } = await store.readAll(1);
  assert.deepEqual(study.exams.map((e) => e.name), ['TJSP', 'Receita Federal', 'INSS']);
  assert.equal(study.exams[0].date, '2027-02-01');
  assert.equal(study.exams[0].weeklyHours, 15);
  assert.deepEqual(study.exams[0].subjects[0].topics, [{ id: 'p1', t: 'crase', d: true }]);
  assert.equal(study.exams[0].log[0].min, 45);
  assert.equal(study.exams[1].subjects.length, 0);
  store.close();
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ }
});

test('busca de foto do link: extrai a imagem e bloqueia endereços internos', async () => {
  const { extractImageUrl, isPrivateIp } = await import('./preview.js');
  const html = '<head><meta property="og:image" content="/img/geladeira.jpg?a=1&amp;b=2"><meta name="twitter:image" content="https://x.com/t.png"></head>';
  assert.equal(extractImageUrl(html, 'https://loja.com/p/1'), 'https://loja.com/img/geladeira.jpg?a=1&b=2');
  assert.equal(extractImageUrl('<meta content="https://x.com/t.png" name="twitter:image">', 'https://loja.com/'), 'https://x.com/t.png');
  assert.equal(extractImageUrl('<title>sem foto</title>', 'https://loja.com/'), null);
  for (const ip of ['127.0.0.1', '10.0.0.5', '192.168.1.1', '172.16.0.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:127.0.0.1']) assert.equal(isPrivateIp(ip), true, ip);
  for (const ip of ['8.8.8.8', '151.101.1.69', '2606:4700::1111']) assert.equal(isPrivateIp(ip), false, ip);

  const { base, stop } = await start();
  const c = client(base);
  assert.equal((await c.post('/api/link-image', { url: 'https://loja.com' })).status, 401);
  await signup(c);
  for (const url of ['http://127.0.0.1/', 'http://localhost:3000/api/state', 'http://169.254.169.254/latest/meta-data', 'file:///etc/passwd', 'ftp://x.com/a', 'nao-e-url']) {
    assert.equal((await c.post('/api/link-image', { url })).status, 422, url);
  }
  stop();
});
