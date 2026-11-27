import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createHandler } from './app.js';
import { checkCalendarUrl, eventsBetween } from './calendar.js';

const ev = (...lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'];
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:teste',
  'BEGIN:VTIMEZONE', 'TZID:America/Sao_Paulo', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:-0300', 'TZOFFSETTO:-0300', 'END:STANDARD', 'END:VTIMEZONE',
  // toda segunda desde outubro, com uma data excluída e outra remarcada
  ...ev('UID:serie', 'DTSTART;TZID=America/Sao_Paulo:20261005T090000', 'DTEND;TZID=America/Sao_Paulo:20261005T100000', 'RRULE:FREQ=WEEKLY;BYDAY=MO', 'EXDATE;TZID=America/Sao_Paulo:20261130T090000', 'SUMMARY:Reunião semanal'),
  ...ev('UID:serie', 'RECURRENCE-ID;TZID=America/Sao_Paulo:20261123T090000', 'DTSTART;TZID=America/Sao_Paulo:20261124T150000', 'DTEND;TZID=America/Sao_Paulo:20261124T160000', 'SUMMARY:Reunião remarcada'),
  ...ev('UID:utc', 'DTSTART:20261126T013000Z', 'DTEND:20261126T023000Z', 'SUMMARY:Em UTC', 'LOCATION:Online'),
  ...ev('UID:dias', 'DTSTART;VALUE=DATE:20261127', 'DTEND;VALUE=DATE:20261129', 'SUMMARY:Viagem'),
  ...ev('UID:cancelado', 'DTSTART:20261125T120000Z', 'DTEND:20261125T130000Z', 'STATUS:CANCELLED', 'SUMMARY:Cancelado'),
  'END:VCALENDAR',
].join('\r\n');

const short = (list) => list.map((e) => [e.date, e.start, e.end, e.title]);

test('agenda: repetições, remarcações, fuso e dias inteiros', () => {
  assert.deepEqual(short(eventsBetween(ICS, '2026-11-23', '2026-11-29', 'America/Sao_Paulo')), [
    ['2026-11-24', '15:00', '16:00', 'Reunião remarcada'],
    ['2026-11-25', '22:30', '23:30', 'Em UTC'],
    ['2026-11-27', '', '', 'Viagem'],
    ['2026-11-28', '', '', 'Viagem'],
  ]);
  assert.deepEqual(short(eventsBetween(ICS, '2026-11-16', '2026-11-22', 'America/Sao_Paulo')), [['2026-11-16', '09:00', '10:00', 'Reunião semanal']]);
  assert.deepEqual(eventsBetween(ICS, '2026-11-30', '2026-12-06', 'America/Sao_Paulo'), []); // data excluída da série
  assert.equal(eventsBetween(ICS, '2026-11-26', '2026-11-26', 'Europe/Lisbon')[0].start, '01:30');
});

test('agenda: só aceita o endereço iCal do Google', () => {
  const ok = 'https://calendar.google.com/calendar/ical/pessoa%40gmail.com/private-0123abc/basic.ics';
  assert.equal(checkCalendarUrl(`  ${ok}  `), ok);
  for (const bad of ['', 'http://calendar.google.com/calendar/ical/a/private-1/basic.ics', 'https://evil.com/calendar/ical/a/private-1/basic.ics',
    'https://calendar.google.com.evil.com/calendar/ical/a/private-1/basic.ics', 'https://calendar.google.com/calendar/embed?src=a', 'https://127.0.0.1/basic.ics']) {
    assert.throws(() => checkCalendarUrl(bad), /endereço/i, bad);
  }
});

test('agenda: conectar, ler e desconectar, sem devolver o endereço', async () => {
  const store = await openDb({ url: ':memory:' });
  const server = createServer(createHandler(async () => store, { loadIcs: async () => ICS }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
    cookie = r.headers.get('set-cookie')?.split(';')[0] ?? cookie;
    const text = await r.text();
    return { status: r.status, text, json: text ? JSON.parse(text) : null };
  };
  const week = '/api/calendar?from=2026-11-23&to=2026-11-29&tz=America/Sao_Paulo';
  assert.equal((await call('GET', week)).status, 401);
  await call('POST', '/api/auth/register', { email: 'a@exemplo.com', password: 'senha-forte-123' });
  assert.deepEqual((await call('GET', week)).json, { connected: false, events: [] });
  assert.equal((await call('PUT', '/api/calendar', { url: 'https://evil.com/x.ics' })).status, 422);
  const url = 'https://calendar.google.com/calendar/ical/a/private-segredo123/basic.ics';
  assert.equal((await call('PUT', '/api/calendar', { url })).status, 204);
  const got = await call('GET', week);
  assert.equal(got.json.connected, true);
  assert.equal(got.json.events.length, 4);
  assert.equal((await call('GET', '/api/calendar?from=2026-01-01&to=2026-12-31')).status, 400);
  for (const p of [week, '/api/state', '/api/export']) assert.doesNotMatch((await call('GET', p)).text, /private-segredo123/, p);
  assert.equal((await call('DELETE', '/api/calendar')).status, 204);
  assert.equal((await call('GET', week)).json.connected, false);
  server.closeAllConnections(); server.close(); store.close();
});
