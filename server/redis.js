/**
 * Armazenamento em Redis pela API REST (Upstash, a mesma da integração "KV" da Vercel).
 * O banco pode ser compartilhado com outros projetos: tudo aqui começa com o prefixo "espaco:"
 * e nenhum comando lista, apaga ou altera chaves fora dele.
 *
 * Cada seção do usuário é um JSON. Para não repetir a validação, os dados passam antes por um
 * SQLite em memória (o mesmo código de db.js) e é o resultado já limpo que vai para o Redis.
 */
const PREFIX = 'espaco:';
const SCRATCH_USER = 1;

export async function openRedis({ url, token, sections, openScratch }) {
  const post = async (path, body) => {
    const r = await fetch(url.replace(/\/+$/, '') + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const out = await r.json().catch(() => null);
    if (!r.ok || !out) throw new Error(`Redis respondeu ${r.status}${out?.error ? ': ' + out.error : ''}`);
    return out;
  };
  const result = (o) => {
    if (o.error) throw new Error('Redis: ' + o.error);
    return o.result;
  };
  const cmd = async (...args) => result(await post('', args));
  const multi = async (cmds) => (await post('/multi-exec', cmds)).map(result);

  await cmd('PING');

  const key = (...parts) => PREFIX + parts.join(':');
  const now = () => Math.floor(Date.now() / 1000);
  const getJson = async (k) => JSON.parse((await cmd('GET', k)) ?? 'null');

  /** Banco descartável, usado só para validar e montar os dados no formato do front-end. */
  const withScratch = async (fn) => {
    const db = await openScratch();
    try {
      await db.createUser('x@x', '', 'x');
      return await fn(db);
    } finally {
      db.close();
    }
  };

  const readStored = async (u) => {
    const values = await cmd('MGET', ...sections.map((s) => key('data', u, s)));
    return Object.fromEntries(sections.map((s, i) => [s, values[i] == null ? null : JSON.parse(values[i])]));
  };

  return {
    /* ----- dados do usuário ----- */
    readAll: readStored,
    async write(u, section, data) {
      const clean = await withScratch(async (db) => {
        await db.write(SCRATCH_USER, section, data); // lança ValidationError se algo estiver errado
        return (await db.readAll(SCRATCH_USER))[section];
      });
      await cmd('SET', key('data', u, section), JSON.stringify(clean));
    },
    async exportAll(u) {
      const stored = await readStored(u);
      return withScratch(async (db) => {
        const empty = await db.exportAll(SCRATCH_USER);
        for (const s of sections) if (stored[s]) empty.data[s] = stored[s];
        return empty;
      });
    },

    /* ----- contas e sessões ----- */
    hasUsers: async () => (await cmd('GET', key('user_seq'))) != null,
    async createUser(email, name, passwordHash) {
      // SET NX reserva o e-mail: dois cadastros simultâneos não criam duas contas.
      if ((await cmd('SET', key('email', email), 'pendente', 'NX', 'EX', 60)) == null) throw new Error('UNIQUE: e-mail já cadastrado');
      const id = Number(await cmd('INCR', key('user_seq')));
      await multi([
        ['SET', key('user', id), JSON.stringify({ id, email, name, passwordHash })],
        ['SET', key('email', email), String(id)], // sem EX: a reserva passa a ser definitiva
      ]);
      return { id, email, name, first: id === 1 };
    },
    async findUserByEmail(email) {
      const id = Number(await cmd('GET', key('email', email)));
      return id ? getJson(key('user', id)) : null;
    },
    async createSession(tokenHash, userId, ttlSeconds) {
      await cmd('SET', key('session', tokenHash), String(userId), 'EX', ttlSeconds);
    },
    async userBySession(tokenHash) {
      const id = Number(await cmd('GET', key('session', tokenHash)));
      const u = id ? await getJson(key('user', id)) : null;
      return u && { id: u.id, email: u.email, name: u.name, first: u.id === 1 };
    },
    deleteSession: (tokenHash) => cmd('DEL', key('session', tokenHash)),
    async tooManyAttempts(email, max, windowSeconds) {
      return Number(await cmd('ZCOUNT', key('attempts', email), `(${now() - windowSeconds}`, '+inf')) >= max;
    },
    async recordFailedAttempt(email, windowSeconds) {
      const k = key('attempts', email), t = now();
      await multi([
        ['ZREMRANGEBYSCORE', k, '-inf', t - windowSeconds],
        ['ZADD', k, t, `${t}-${Math.random().toString(36).slice(2)}`],
        ['EXPIRE', k, windowSeconds],
      ]);
    },
    clearAttempts: (email) => cmd('DEL', key('attempts', email)),
    close() {},
  };
}
