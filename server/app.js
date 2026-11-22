import { readFile } from 'node:fs/promises';
import { extname, normalize, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, ValidationError } from './db.js';
import { pageImage, PreviewError } from './preview.js';
import { hashPassword, verifyPassword, DUMMY_HASH, newToken, hashToken, EMAIL_RE } from './auth.js';

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(here, '..', 'public');
const MAX_BODY = 25 * 1024 * 1024;
const SESSION_DAYS = 30;
const MAX_FAILS = 5;
const FAIL_WINDOW = 15 * 60;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
export const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
  "img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** getStore: função assíncrona que devolve o banco (aberto uma vez por processo). */
export function createHandler(getStore) {
  const send = (res, status, body, headers = {}) => {
    const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
    res.writeHead(status, {
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': CSP, 'X-Frame-Options': 'DENY',
      ...(isObj ? { 'Content-Type': 'application/json; charset=utf-8' } : {}), ...headers,
    });
    res.end(isObj ? JSON.stringify(body) : body);
  };

  const readBody = async (req) => {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415, 'Envie JSON.');
    if (req.body !== undefined && req.body !== null) { // a Vercel já lê e converte o corpo
      return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) throw new HttpError(413, 'Corpo grande demais.');
      chunks.push(c);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'JSON inválido.'); }
  };

  const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => {
    const i = c.indexOf('=');
    return i < 0 ? [] : [c.slice(0, i).trim(), c.slice(i + 1).trim()];
  }).filter((p) => p.length));

  const isSecure = (req) => req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  const cookie = (req, value, maxAge) =>
    `sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure(req) ? '; Secure' : ''}`;

  // Defesa contra CSRF além do SameSite: pedidos que alteram dados só valem se vierem do próprio site.
  const sameOrigin = (req) => {
    const o = req.headers.origin;
    if (!o) return true;
    try { return new URL(o).host === req.headers.host; } catch { return false; }
  };

  const currentUser = async (store, req) => {
    const t = cookies(req).sid;
    return t ? store.userBySession(hashToken(t)) : null;
  };
  const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, seed: !!u.first });

  async function startSession(store, req, res, user, status = 200) {
    const token = newToken();
    await store.createSession(hashToken(token), user.id, SESSION_DAYS * 86400);
    send(res, status, { user: publicUser(user) }, { 'Set-Cookie': cookie(req, token, SESSION_DAYS * 86400) });
  }

  async function api(req, res, path) {
    const store = await getStore();
    const method = req.method;
    if (method !== 'GET' && method !== 'HEAD' && !sameOrigin(req)) throw new HttpError(403, 'Origem não permitida.');

    if (method === 'GET' && path === '/api/health') return send(res, 200, { ok: true });

    /* ----- autenticação ----- */
    if (path === '/api/auth/register' && method === 'POST') {
      const b = await readBody(req);
      const email = String(b.email ?? '').trim().toLowerCase();
      const password = String(b.password ?? '');
      const name = String(b.name ?? '').trim().slice(0, 40);
      if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, 'Digite um e-mail válido.');
      if (password.length < 8) throw new HttpError(400, 'A senha precisa ter pelo menos 8 caracteres.');
      if (password.length > 128) throw new HttpError(400, 'A senha pode ter no máximo 128 caracteres.');
      const hasUsers = !!(await store.hasUsers());
      if (hasUsers && process.env.ALLOW_SIGNUP === 'false') throw new HttpError(403, 'Novos cadastros estão desativados.');
      if (await store.findUserByEmail(email)) throw new HttpError(409, 'Já existe uma conta com este e-mail.');
      let user;
      try { user = await store.createUser(email, name, await hashPassword(password)); }
      catch (e) { if (String(e?.message).includes('UNIQUE')) throw new HttpError(409, 'Já existe uma conta com este e-mail.'); throw e; }
      return startSession(store, req, res, user, 201);
    }
    if (path === '/api/auth/login' && method === 'POST') {
      const b = await readBody(req);
      const email = String(b.email ?? '').trim().toLowerCase();
      const password = String(b.password ?? '').slice(0, 128);
      if (await store.tooManyAttempts(email, MAX_FAILS, FAIL_WINDOW)) throw new HttpError(429, 'Muitas tentativas. Aguarde 15 minutos e tente de novo.');
      const user = await store.findUserByEmail(email);
      const ok = await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !ok) {
        await store.recordFailedAttempt(email, FAIL_WINDOW);
        throw new HttpError(401, 'E-mail ou senha incorretos.');
      }
      await store.clearAttempts(email);
      return startSession(store, req, res, user);
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      const t = cookies(req).sid;
      if (t) await store.deleteSession(hashToken(t));
      return send(res, 204, '', { 'Set-Cookie': cookie(req, '', 0) });
    }

    /* ----- a partir daqui só com login ----- */
    const user = await currentUser(store, req);
    if (path === '/api/auth/me' && method === 'GET') {
      if (!user) throw new HttpError(401, 'Não autenticado.');
      return send(res, 200, { user: publicUser(user) });
    }
    if (!user) throw new HttpError(401, 'Faça login para continuar.');

    if (method === 'GET' && path === '/api/state') return send(res, 200, { sections: await store.readAll(user.id) });
    if (method === 'GET' && path === '/api/export') {
      return send(res, 200, JSON.stringify(await store.exportAll(user.id), null, 2), {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="meu-espaco-backup.json"',
      });
    }
    if (method === 'POST' && path === '/api/link-image') {
      const b = await readBody(req);
      try { return send(res, 200, { image: await pageImage(String(b?.url ?? '')) }); }
      catch (e) { if (e instanceof PreviewError) throw new HttpError(422, e.message); throw e; }
    }
    const m = path.match(/^\/api\/state\/([a-z]+)$/);
    if (m && method === 'PUT') {
      if (!SECTIONS.includes(m[1])) throw new HttpError(404, 'Seção desconhecida.');
      await store.write(user.id, m[1], await readBody(req));
      return send(res, 204, '');
    }
    throw new HttpError(404, 'Rota não encontrada.');
  }

  async function serveStatic(req, res, path) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método não permitido');
    let rel;
    try { rel = path === '/' ? 'index.html' : decodeURIComponent(path).replace(/^[/\\]+/, ''); } catch { return send(res, 400, 'Requisição inválida'); }
    const file = resolve(PUBLIC, normalize(rel));
    if (!file.startsWith(PUBLIC + sep)) return send(res, 404, 'Não encontrado');
    try {
      const body = await readFile(file);
      send(res, 200, req.method === 'HEAD' ? '' : body, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    } catch {
      send(res, 404, 'Não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
  }

  return async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path.startsWith('/api/')) await api(req, res, path);
      else await serveStatic(req, res, path);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message });
      if (e instanceof ValidationError) return send(res, 400, { error: e.message });
      console.error(e);
      send(res, 500, { error: 'Erro interno.' });
    }
  };
}
