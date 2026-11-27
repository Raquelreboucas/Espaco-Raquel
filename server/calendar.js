/**
 * Google Agenda, somente leitura, pelo "endereço secreto no formato iCal" de cada agenda.
 * O endereço dá acesso de leitura à agenda: fica só no servidor e nunca é devolvido ao navegador.
 * Por segurança, o servidor só busca endereços desse formato em calendar.google.com.
 */
import ICAL from 'ical.js';

export class CalendarError extends Error {}

const MAX_BYTES = 8 * 1024 * 1024;
const CACHE_MS = 2 * 60 * 1000;
const MAX_STEPS = 20000;      // repetições percorridas por evento
const MAX_EVENTS = 500;       // eventos devolvidos por consulta
const DAY = 86400000;
const cache = new Map();      // endereço -> { at, text }

export function checkCalendarUrl(raw) {
  let u;
  try { u = new URL(String(raw ?? '').trim()); } catch { u = null; }
  if (!u || u.protocol !== 'https:' || u.hostname !== 'calendar.google.com' || u.port || u.username || u.password
    || !/^\/calendar\/ical\/[^/]+\/(private-[\w-]+|public)\/(basic|full)\.ics$/.test(u.pathname)) {
    throw new CalendarError('Cole o "Endereço secreto no formato iCal" da sua agenda. Ele começa com https://calendar.google.com/calendar/ical/ e termina em .ics.');
  }
  return u.origin + u.pathname;
}

export async function fetchIcs(url, { fresh = false } = {}) {
  const hit = cache.get(url);
  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.text;
  let r;
  try { r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(9000) }); }
  catch { throw new CalendarError('Não consegui falar com o Google Agenda. Tente de novo em instantes.'); }
  if (!r.ok) throw new CalendarError('O Google recusou o endereço. Copie de novo o endereço secreto (ele muda se for redefinido).');
  const text = await r.text();
  if (text.length > MAX_BYTES) throw new CalendarError('Essa agenda é grande demais para ser lida.');
  if (!text.includes('BEGIN:VCALENDAR')) throw new CalendarError('O endereço não devolveu uma agenda.');
  if (cache.size > 50) cache.clear();
  cache.set(url, { at: Date.now(), text });
  return text;
}

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (t) => `${t.year}-${pad(t.month)}-${pad(t.day)}`;
const addDays = (key, n) => new Date(Date.parse(key + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);

/** Eventos entre "from" e "to" (AAAA-MM-DD, inclusive), um item por dia, nos horários do fuso informado. */
export function eventsBetween(text, from, to, timeZone) {
  let root;
  try { root = new ICAL.Component(ICAL.parse(text)); } catch { throw new CalendarError('Não consegui ler o conteúdo da agenda.'); }
  for (const z of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(z);

  const local = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const inZone = (t) => {
    const p = Object.fromEntries(local.formatToParts(t.toJSDate()).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  };

  const out = [];
  const add = (item, start, end) => {
    if (String(item.component.getFirstPropertyValue('status')).toUpperCase() === 'CANCELLED') return;
    const title = String(item.summary || '(sem título)').slice(0, 200);
    const where = String(item.location || '').slice(0, 200);
    let first, last, s = '', e = '';
    if (start.isDate) {                         // dia inteiro: o fim não entra
      first = dayKey(start);
      last = end ? addDays(dayKey(end), -1) : first;
    } else {
      const a = inZone(start), b = end ? inZone(end) : a;
      first = a.date; s = a.time;
      last = b.date; e = b.time;
      if (last > first && e === '00:00') { last = addDays(last, -1); e = '24:00'; }
    }
    if (last < first) last = first;
    for (let d = first > from ? first : from; d <= last && d <= to && out.length < MAX_EVENTS; d = addDays(d, 1)) {
      out.push({ date: d, start: d === first ? s : '', end: d === last ? e : '', title, where });
    }
  };

  const all = root.getAllSubcomponents('vevent').map((v) => new ICAL.Event(v));
  const masters = new Map(all.filter((e) => !e.isRecurrenceException()).map((e) => [e.uid, e]));
  const exceptions = all.filter((e) => e.isRecurrenceException());
  for (const ex of exceptions) masters.get(ex.uid)?.relateException(ex);

  const limit = addDays(to, 2);                 // folga para diferenças de fuso
  const seen = new Set();                       // ocorrências alteradas já incluídas pela série
  for (const event of all) {
    if (event.isRecurrenceException()) continue;
    if (!event.startDate) continue;
    if (!event.isRecurring()) { add(event, event.startDate, event.endDate); continue; }
    const it = event.iterator();
    for (let i = 0, next; i < MAX_STEPS && (next = it.next()); i += 1) {
      if (dayKey(next) > limit) break;
      const occ = event.getOccurrenceDetails(next);
      if (occ.item !== event) seen.add(occ.item.component);
      add(occ.item, occ.startDate, occ.endDate);
    }
  }
  // ocorrências remarcadas de uma data fora do período para dentro dele (ou sem série no arquivo)
  for (const ex of exceptions) {
    if (!seen.has(ex.component) && ex.startDate && (!masters.has(ex.uid) || dayKey(ex.recurrenceId) > limit)) add(ex, ex.startDate, ex.endDate);
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}
