import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_HTML = 1_500_000;
const MAX_IMG = 3_000_000; // a resposta em base64 precisa caber nos 4,5 MB da Vercel
const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (compatible; MeuEspacoPessoal/1.0; +link-preview)';

export class PreviewError extends Error {}

/** Endereços que o servidor nunca deve acessar a pedido de um usuário (rede interna, localhost, nuvem). */
export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || a >= 224;
  }
  const v = ip.toLowerCase();
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || /^fe[89ab]/.test(v) || v.startsWith('ff');
}

async function checkedUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new PreviewError('Link inválido.'); }
  if (!/^https?:$/.test(url.protocol)) throw new PreviewError('Use um link http ou https.');
  if (url.username || url.password) throw new PreviewError('Link inválido.');
  if (url.port && url.port !== '80' && url.port !== '443') throw new PreviewError('Esse endereço não é permitido.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new PreviewError('Não encontrei esse site.');
  if (addrs.some((a) => isPrivateIp(a.address))) throw new PreviewError('Esse endereço não é permitido.');
  return url;
}

/** Baixa uma URL com limite de tamanho e de tempo, revalidando cada redirecionamento. */
async function download(raw, { accept, max }) {
  let target = raw;
  for (let hop = 0; hop < 5; hop++) {
    const url = await checkedUrl(target);
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': UA, Accept: accept } });
    } catch { throw new PreviewError('O site não respondeu.'); }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      target = new URL(res.headers.get('location'), url).href;
      continue;
    }
    if (!res.ok) throw new PreviewError(`O site recusou o acesso (${res.status}).`);
    const chunks = [];
    let size = 0;
    for await (const c of res.body) {
      size += c.length;
      if (size > max) { res.body.cancel?.().catch(() => {}); throw new PreviewError('Arquivo grande demais.'); }
      chunks.push(c);
    }
    return { buf: Buffer.concat(chunks), type: (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), url };
  }
  throw new PreviewError('Redirecionamentos demais.');
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Acha a imagem principal da página (og:image, twitter:image ou image_src). */
export function extractImageUrl(html, base) {
  const wanted = ['og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image', 'twitter:image:src'];
  const found = {};
  for (const tag of html.match(/<(meta|link)\s[^>]*>/gi) ?? []) {
    const attrs = {};
    for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (/^<meta/i.test(tag) && wanted.includes(key) && attrs.content && !found[key]) found[key] = attrs.content;
    if (/^<link/i.test(tag) && (attrs.rel || '').toLowerCase() === 'image_src' && attrs.href) found.image_src = attrs.href;
  }
  const pick = [...wanted, 'image_src'].map((k) => found[k]).find(Boolean);
  if (!pick) return null;
  try { return new URL(pick, base).href; } catch { return null; }
}

/** Devolve a foto do produto da página como data URL (o navegador depois a reduz). */
export async function pageImage(pageUrl) {
  const page = await download(pageUrl, { accept: 'text/html,application/xhtml+xml', max: MAX_HTML });
  const imgUrl = extractImageUrl(page.buf.toString('utf8'), page.url);
  if (!imgUrl) throw new PreviewError('Esse site não informa uma foto do produto. Escolha a foto manualmente.');
  const img = await download(imgUrl, { accept: 'image/*', max: MAX_IMG });
  if (!/^image\/(jpeg|png|webp|gif)$/.test(img.type)) throw new PreviewError('A foto do site está em um formato que não consigo usar.');
  return `data:${img.type};base64,${img.buf.toString('base64')}`;
}
