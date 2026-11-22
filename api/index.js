// Ponto de entrada da Vercel: toda rota /api/* cai aqui (ver vercel.json).
import { openDb } from '../server/db.js';
import { createHandler } from '../server/app.js';

let store; // reaproveitado entre chamadas enquanto a função estiver "quente"
const getStore = () => (store ??= openDb().catch((e) => { store = undefined; throw e; }));

export default createHandler(getStore);
