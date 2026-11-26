// Roda os mesmos testes da API com o armazenamento em Redis (simulado).
process.env.TEST_BACKEND = 'redis';
await import('./api.test.js');
