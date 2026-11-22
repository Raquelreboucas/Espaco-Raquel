import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createHandler } from './app.js';

const port = Number(process.env.PORT) || 3000;
const store = await openDb();
const server = createServer(createHandler(async () => store));
// Localmente só aceita conexões da própria máquina.
server.listen(port, '127.0.0.1', () => console.log(`Meu Espaço Pessoal: http://localhost:${port}`));

const stop = () => { store.close(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
