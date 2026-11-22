import { createClient } from '@libsql/client';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SECTIONS = ['wishlist', 'goals', 'planner', 'study'];

export class ValidationError extends Error {}

/* ---------- sanitização ---------- */
const TONES = ['mint', 'peach', 'pink', 'yellow', 'neutral'];
const PRIOS = ['alta', 'media', 'baixa'];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max = 500) => String(v ?? '').slice(0, max);
const bool = (v) => (v ? 1 : 0);
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v));
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);
const arr = (v, what) => {
  if (!Array.isArray(v)) throw new ValidationError(`Formato inválido: "${what}" deve ser uma lista.`);
  return v;
};
const id = (v, what) => {
  const s = str(v, 64);
  if (!s) throw new ValidationError(`Item sem id em "${what}".`);
  return s;
};
const img = (v) => (typeof v === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(v) ? v : '');
const link = (v) => (/^https?:\/\//i.test(String(v ?? '')) ? str(v, 2000) : '');

/**
 * Local: DATABASE_URL=file:data/meu-espaco.db (padrão).
 * Produção (Vercel): DATABASE_URL=libsql://...turso.io + DATABASE_AUTH_TOKEN.
 */
export async function openDb({ url, authToken } = {}) {
  url = url || process.env.DATABASE_URL || 'file:' + join(here, '..', 'data', 'meu-espaco.db');
  authToken = authToken || process.env.DATABASE_AUTH_TOKEN || undefined;
  if (url.startsWith('file:') && !url.includes(':memory:')) mkdirSync(dirname(url.slice(5)), { recursive: true });
  const client = createClient({ url, authToken });
  await client.executeMultiple('PRAGMA foreign_keys = ON;');
  await migrateOldStudy(client);
  await client.executeMultiple(readFileSync(join(here, 'schema.sql'), 'utf8'));
  return makeStore(client);
}

/** Bancos criados antes dos três concursos: move matérias e registros para o concurso TJSP. */
async function migrateOldStudy(client) {
  const cols = (await client.execute("SELECT name FROM pragma_table_info('study_subjects')")).rows.map((r) => r.name);
  if (!cols.length || cols.includes('exam_id')) return; // banco novo ou já migrado
  await client.executeMultiple(`
    DROP INDEX IF EXISTS idx_study_log_date;
    ALTER TABLE study_topics RENAME TO old_study_topics;
    ALTER TABLE study_subjects RENAME TO old_study_subjects;
    ALTER TABLE study_log RENAME TO old_study_log;
    ALTER TABLE study_settings RENAME TO old_study_settings;`);
  await client.executeMultiple(readFileSync(join(here, 'schema.sql'), 'utf8'));
  await client.batch([
    `INSERT INTO study_exams(user_id, id, name, exam_date, weekly_hours, position)
       SELECT user_id, 'tjsp', 'TJSP', exam_date, weekly_hours, 0 FROM old_study_settings`,
    `INSERT INTO study_exams(user_id, id, name, position) SELECT user_id, 'receita', 'Receita Federal', 1 FROM old_study_settings`,
    `INSERT INTO study_exams(user_id, id, name, position) SELECT user_id, 'inss', 'INSS', 2 FROM old_study_settings`,
    `INSERT INTO study_subjects(user_id, id, exam_id, name, position) SELECT user_id, id, 'tjsp', name, position FROM old_study_subjects`,
    `INSERT INTO study_topics(user_id, id, subject_id, text, done, position) SELECT user_id, id, subject_id, text, done, position FROM old_study_topics`,
    `INSERT INTO study_log(user_id, id, exam_id, date, subject, minutes, position) SELECT user_id, id, 'tjsp', date, subject, minutes, position FROM old_study_log`,
    'DROP TABLE old_study_topics', 'DROP TABLE old_study_subjects', 'DROP TABLE old_study_log', 'DROP TABLE old_study_settings',
  ], 'write');
}

function makeStore(client) {
  const st = (sql, args = []) => ({ sql, args });
  const rows = async (sql, args = []) => (await client.execute({ sql, args })).rows;
  const one = async (sql, args = []) => (await rows(sql, args))[0] ?? null;

  /* ---------- leitura (monta o mesmo formato que o front-end usa) ---------- */
  const readers = {
    async wishlist(u) {
      const [cats, items, seeds] = await Promise.all([
        rows('SELECT id, name, tone, note FROM wishlist_categories WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT seed FROM wishlist_seeds WHERE user_id = ? ORDER BY rowid', [u]),
      ]);
      return {
        cats: cats.map((c) => ({ id: c.id, name: c.name, tone: c.tone, note: c.note })),
        items: items.map((r) => ({
          id: r.id, cat: r.category_id, name: r.name, brand: r.brand, room: r.room, price: r.price,
          link: r.link, img: r.img, prio: r.priority, note: r.note, done: !!r.done,
        })),
        seeds: seeds.map((r) => r.seed),
      };
    },
    async goals(u) {
      const [areas, goals, steps] = await Promise.all([
        rows('SELECT id, name, tone FROM goal_areas WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM goals WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM goal_steps WHERE user_id = ? ORDER BY position', [u]),
      ]);
      return {
        areas: areas.map((a) => ({ id: a.id, name: a.name, tone: a.tone })),
        items: goals.map((g) => ({
          id: g.id, area: g.area_id, title: g.title, due: g.due, done: !!g.done,
          steps: steps.filter((s) => s.goal_id === g.id).map((s) => ({ id: s.id, t: s.text, d: !!s.done })),
        })),
      };
    },
    async planner(u) {
      const [tasks, focus] = await Promise.all([
        rows('SELECT * FROM planner_tasks WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT week_start, text FROM planner_focus WHERE user_id = ?', [u]),
      ]);
      return {
        tasks: tasks.map((t) => ({ id: t.id, date: t.date, text: t.text, done: !!t.done })),
        focus: Object.fromEntries(focus.map((f) => [f.week_start, f.text])),
      };
    },
    async study(u) {
      const [exams, subjects, topics, log] = await Promise.all([
        rows('SELECT * FROM study_exams WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM study_subjects WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM study_topics WHERE user_id = ? ORDER BY position', [u]),
        rows('SELECT * FROM study_log WHERE user_id = ? ORDER BY position', [u]),
      ]);
      return {
        exams: exams.map((e) => ({
          id: e.id, name: e.name, date: e.exam_date, weeklyHours: e.weekly_hours,
          subjects: subjects.filter((x) => x.exam_id === e.id).map((x) => ({
            id: x.id, name: x.name,
            topics: topics.filter((t) => t.subject_id === x.id).map((t) => ({ id: t.id, t: t.text, d: !!t.done })),
          })),
          log: log.filter((l) => l.exam_id === e.id).map((l) => ({ id: l.id, date: l.date, subject: l.subject, min: l.minutes })),
        })),
      };
    },
  };

  /* ---------- escrita: cada função devolve a lista de comandos (apagar tudo + inserir) ---------- */
  const builders = {
    wishlist(u, d) {
      const cats = arr(d?.cats, 'cats'), items = arr(d?.items, 'items'), seeds = arr(d?.seeds ?? [], 'seeds');
      const out = [
        st('DELETE FROM wishlist_items WHERE user_id = ?', [u]),
        st('DELETE FROM wishlist_categories WHERE user_id = ?', [u]),
        st('DELETE FROM wishlist_seeds WHERE user_id = ?', [u]),
      ];
      const catIds = new Set();
      cats.forEach((c, i) => {
        const cid = id(c.id, 'cats');
        catIds.add(cid);
        out.push(st('INSERT INTO wishlist_categories(user_id, id, name, tone, note, position) VALUES (?,?,?,?,?,?)',
          [u, cid, str(c.name, 40) || 'Sem nome', oneOf(c.tone, TONES, 'mint'), str(c.note, 300), i]));
      });
      items.forEach((it, i) => {
        if (!catIds.has(it.cat)) throw new ValidationError(`O desejo "${str(it.name, 40)}" aponta para uma categoria inexistente.`);
        out.push(st(`INSERT INTO wishlist_items(user_id, id, category_id, name, brand, room, price, link, img, priority, note, done, position)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [u, id(it.id, 'items'), it.cat, str(it.name, 120) || 'Sem nome', str(it.brand, 140), str(it.room, 60), num(it.price),
          link(it.link), img(it.img), oneOf(it.prio, PRIOS, 'media'), str(it.note, 400), bool(it.done), i]));
      });
      for (const s of new Set(seeds.map((x) => str(x, 80)))) out.push(st('INSERT INTO wishlist_seeds(user_id, seed) VALUES (?,?)', [u, s]));
      return out;
    },
    goals(u, d) {
      const areas = arr(d?.areas, 'areas'), items = arr(d?.items, 'items');
      const out = [
        st('DELETE FROM goal_steps WHERE user_id = ?', [u]),
        st('DELETE FROM goals WHERE user_id = ?', [u]),
        st('DELETE FROM goal_areas WHERE user_id = ?', [u]),
      ];
      const areaIds = new Set();
      areas.forEach((a, i) => {
        const aid = id(a.id, 'areas');
        areaIds.add(aid);
        out.push(st('INSERT INTO goal_areas(user_id, id, name, tone, position) VALUES (?,?,?,?,?)',
          [u, aid, str(a.name, 60) || 'Sem nome', oneOf(a.tone, TONES, 'mint'), i]));
      });
      items.forEach((g, i) => {
        if (!areaIds.has(g.area)) throw new ValidationError(`O objetivo "${str(g.title, 40)}" aponta para uma área inexistente.`);
        const gid = id(g.id, 'items');
        out.push(st('INSERT INTO goals(user_id, id, area_id, title, due, done, position) VALUES (?,?,?,?,?,?,?)',
          [u, gid, g.area, str(g.title, 140) || 'Sem título', /^\d{4}-\d{2}$/.test(g.due) ? g.due : '', bool(g.done), i]));
        arr(g.steps ?? [], 'steps').forEach((s, j) =>
          out.push(st('INSERT INTO goal_steps(user_id, id, goal_id, text, done, position) VALUES (?,?,?,?,?,?)',
            [u, id(s.id, 'steps'), gid, str(s.t, 140), bool(s.d), j])));
      });
      return out;
    },
    planner(u, d) {
      const tasks = arr(d?.tasks, 'tasks');
      if (!d.focus || typeof d.focus !== 'object') throw new ValidationError('Formato inválido: "focus".');
      const out = [st('DELETE FROM planner_tasks WHERE user_id = ?', [u]), st('DELETE FROM planner_focus WHERE user_id = ?', [u])];
      tasks.forEach((t, i) => {
        if (!ISO_DAY.test(t.date)) throw new ValidationError('Tarefa com data inválida.');
        out.push(st('INSERT INTO planner_tasks(user_id, id, date, text, done, position) VALUES (?,?,?,?,?,?)',
          [u, id(t.id, 'tasks'), t.date, str(t.text, 140), bool(t.done), i]));
      });
      for (const [k, v] of Object.entries(d.focus)) {
        if (ISO_DAY.test(k) && String(v).trim()) out.push(st('INSERT INTO planner_focus(user_id, week_start, text) VALUES (?,?,?)', [u, k, str(v, 200)]));
      }
      return out;
    },
    study(u, d) {
      const exams = arr(d?.exams, 'exams');
      const out = [
        st('DELETE FROM study_topics WHERE user_id = ?', [u]),
        st('DELETE FROM study_subjects WHERE user_id = ?', [u]),
        st('DELETE FROM study_log WHERE user_id = ?', [u]),
        st('DELETE FROM study_exams WHERE user_id = ?', [u]),
      ];
      exams.forEach((e, i) => {
        const eid = id(e.id, 'exams');
        out.push(st('INSERT INTO study_exams(user_id, id, name, exam_date, weekly_hours, position) VALUES (?,?,?,?,?,?)',
          [u, eid, str(e.name, 80) || 'Sem nome', ISO_DAY.test(e.date) ? e.date : '', Math.min(100, num(e.weeklyHours) ?? 10), i]));
        arr(e.subjects ?? [], 'subjects').forEach((x, j) => {
          const sid = id(x.id, 'subjects');
          out.push(st('INSERT INTO study_subjects(user_id, id, exam_id, name, position) VALUES (?,?,?,?,?)', [u, sid, eid, str(x.name, 60) || 'Sem nome', j]));
          arr(x.topics ?? [], 'topics').forEach((t, k) =>
            out.push(st('INSERT INTO study_topics(user_id, id, subject_id, text, done, position) VALUES (?,?,?,?,?,?)',
              [u, id(t.id, 'topics'), sid, str(t.t, 140), bool(t.d), k])));
        });
        arr(e.log ?? [], 'log').forEach((l, j) => {
          const min = Math.round(Number(l.min));
          if (!(min > 0 && min <= 1440) || !ISO_DAY.test(l.date)) throw new ValidationError('Registro de estudo inválido.');
          out.push(st('INSERT INTO study_log(user_id, id, exam_id, date, subject, minutes, position) VALUES (?,?,?,?,?,?,?)',
            [u, id(l.id, 'log'), eid, l.date, str(l.subject, 60), min, j]));
        });
      });
      return out;
    },
  };

  const now = () => Math.floor(Date.now() / 1000);

  return {
    /* ----- dados do usuário ----- */
    /** Cada seção, ou null se ainda nunca foi gravada por este usuário. */
    async readAll(u) {
      const done = new Set((await rows('SELECT key FROM meta WHERE user_id = ?', [u])).map((r) => r.key));
      const entries = await Promise.all(SECTIONS.map(async (s) => [s, done.has('init:' + s) ? await readers[s](u) : null]));
      return Object.fromEntries(entries);
    },
    async write(u, section, data) {
      if (!builders[section]) throw new ValidationError('Seção desconhecida.');
      if (!data || typeof data !== 'object') throw new ValidationError('Corpo inválido.');
      const cmds = builders[section](u, data);
      cmds.push(st('INSERT OR IGNORE INTO meta(user_id, key) VALUES (?,?)', [u, 'init:' + section]));
      await client.batch(cmds, 'write'); // uma transação: ou grava tudo ou nada
    },
    async exportAll(u) {
      const entries = await Promise.all(SECTIONS.map(async (s) => [s, await readers[s](u)]));
      return { app: 'meu-espaco-pessoal', exportedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
    },

    /* ----- contas e sessões ----- */
    hasUsers: async () => !!(await one('SELECT 1 AS x FROM users LIMIT 1')),
    async createUser(email, name, passwordHash) {
      const first = !(await one('SELECT 1 AS x FROM users LIMIT 1'));
      const r = await client.execute({ sql: 'INSERT INTO users(email, name, password_hash) VALUES (?,?,?)', args: [email, name, passwordHash] });
      return { id: Number(r.lastInsertRowid), email, name, first };
    },
    async findUserByEmail(email) {
      const r = await one('SELECT id, email, name, password_hash FROM users WHERE email = ?', [email]);
      return r && { id: Number(r.id), email: r.email, name: r.name, passwordHash: r.password_hash };
    },
    async createSession(tokenHash, userId, ttlSeconds) {
      await client.batch([
        st('DELETE FROM sessions WHERE expires_at < ?', [now()]),
        st('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?,?,?)', [tokenHash, userId, now() + ttlSeconds]),
      ], 'write');
    },
    async userBySession(tokenHash) {
      const r = await one(
        `SELECT u.id, u.email, u.name, (u.id = (SELECT MIN(id) FROM users)) AS first
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?`, [tokenHash, now()]);
      return r && { id: Number(r.id), email: r.email, name: r.name, first: !!r.first };
    },
    deleteSession: (tokenHash) => client.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [tokenHash] }),
    async tooManyAttempts(email, max, windowSeconds) {
      const r = await one('SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND at > ?', [email, now() - windowSeconds]);
      return Number(r.n) >= max;
    },
    async recordFailedAttempt(email, windowSeconds) {
      await client.batch([
        st('DELETE FROM login_attempts WHERE at < ?', [now() - windowSeconds]),
        st('INSERT INTO login_attempts(email, at) VALUES (?,?)', [email, now()]),
      ], 'write');
    },
    clearAttempts: (email) => client.execute({ sql: 'DELETE FROM login_attempts WHERE email = ?', args: [email] }),
    close: () => client.close(),
  };
}
