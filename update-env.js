const fs = require('fs');
let code = fs.readFileSync('apps/api/src/__tests__/admin-permissions.unit.test.js', 'utf8');

const envCode = `process.env.NODE_ENV = 'test';
process.env.REDIS_CACHE_URL = 'redis://localhost:6379/0';
process.env.REDIS_PUBSUB_URL = 'redis://localhost:6379/1';
process.env.REDIS_QUEUE_URL = 'redis://localhost:6379/2';
`;

code = code.replace("const test = require('node:test');", "const test = require('node:test');\n" + envCode);

fs.writeFileSync('apps/api/src/__tests__/admin-permissions.unit.test.js', code);
