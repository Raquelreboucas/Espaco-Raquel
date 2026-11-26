/** Imitação mínima da API REST do Redis, só para os testes. */
import { createServer } from 'node:http';

export async function startFakeRedis(token = 'token-de-teste') {
  const data = new Map(); // chave -> { v, exp }
  const get = (k) => {
    const e = data.get(k);
    if (e && e.exp && e.exp <= Date.now()) data.delete(k);
    return data.get(k)?.v ?? null;
  };
  const bound = (s) => {
    const x = String(s);
    if (x === '-inf') return { n: -Infinity };
    if (x === '+inf') return { n: Infinity };
    return x.startsWith('(') ? { n: Number(x.slice(1)), open: true } : { n: Number(x) };
  };
  const inRange = (score, min, max) => {
    const a = bound(min), b = bound(max);
    return (a.open ? score > a.n : score >= a.n) && (b.open ? score < b.n : score <= b.n);
  };
  const commands = {
    PING: () => 'PONG',
    GET: (k) => get(k),
    MGET: (...ks) => ks.map(get),
    SET: (k, v, ...opts) => {
      if (opts.includes('NX') && get(k) != null) return null;
      const i = opts.indexOf('EX');
      data.set(k, { v: String(v), exp: i < 0 ? 0 : Date.now() + Number(opts[i + 1]) * 1000 });
      return 'OK';
    },
    DEL: (k) => (data.delete(k) ? 1 : 0),
    INCR: (k) => {
      const n = Number(get(k) ?? 0) + 1;
      data.set(k, { v: String(n), exp: 0 });
      return n;
    },
    EXPIRE: (k, s) => {
      const e = data.get(k);
      if (e) e.exp = Date.now() + Number(s) * 1000;
      return e ? 1 : 0;
    },
    ZADD: (k, score, member) => {
      const z = get(k) ?? new Map();
      z.set(member, Number(score));
      data.set(k, { v: z, exp: data.get(k)?.exp ?? 0 });
      return 1;
    },
    ZCOUNT: (k, min, max) => [...(get(k) ?? new Map()).values()].filter((s) => inRange(s, min, max)).length,
    ZREMRANGEBYSCORE: (k, min, max) => {
      const z = get(k) ?? new Map();
      let n = 0;
      for (const [m, s] of z) if (inRange(s, min, max)) { z.delete(m); n += 1; }
      return n;
    },
  };
  const run = ([name, ...args]) => ({ result: commands[name](...args) });
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.headers.authorization !== `Bearer ${token}`) return reply(401, { error: 'Unauthorized' });
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    reply(200, req.url === '/multi-exec' ? body.map(run) : run(body));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    token,
    keys: () => [...data.keys()],
    stop: () => { server.closeAllConnections(); server.close(); },
  };
}
