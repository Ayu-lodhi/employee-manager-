const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'unit_test_access_secret_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'unit_test_refresh_secret_32_characters_long';

const tokens = require('../modules/auth/auth.tokens');

test('Phase 2 - Startup fails without required environment variables', () => {
  const serverScript = path.resolve(__dirname, '../server.js');

  const requiredVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
  for (const missingVar of requiredVars) {
    const env = {
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/dummy_db',
      REDIS_CACHE_URL: 'redis://localhost:6379/0',
      REDIS_PUBSUB_URL: 'redis://localhost:6380/1',
      REDIS_QUEUE_URL: 'redis://localhost:6381/2',
      JWT_ACCESS_SECRET: 'valid_access_secret_min_16_chars',
      JWT_REFRESH_SECRET: 'valid_refresh_secret_min_16_chars',
    };
    env[missingVar] = ''; // empty string fails Joi validation

    const res = spawnSync(process.execPath, [serverScript], {
      env,
      encoding: 'utf8',
      timeout: 8000,
    });

    assert.equal(res.status, 1, `Server must fail startup when ${missingVar} is missing`);
    const output = (res.stdout || '') + (res.stderr || '');
    assert.match(output, /FATAL CONFIG ERROR: Startup environment validation failed/);
    assert.match(output, new RegExp(missingVar));
  }
});

test('Phase 2 - Access token cannot be verified with refresh secret and vice versa', () => {
  const dummyUser = { _id: '507f1f77bcf86cd799439011', password: 'hashedpassword' };

  // Access token signed with JWT_ACCESS_SECRET
  const accessToken = tokens.sign(dummyUser, 'access', '15m');
  assert.throws(
    () => tokens.verify(accessToken, 'refresh'),
    /invalid signature|Invalid token purpose/,
    'Access token must not verify as a refresh token'
  );

  // Refresh token signed with JWT_REFRESH_SECRET
  const refreshToken = tokens.sign(dummyUser, 'refresh', '7d');
  assert.throws(
    () => tokens.verify(refreshToken, 'access'),
    /invalid signature|Invalid token purpose/,
    'Refresh token must not verify as an access token'
  );
});

test('Phase 2 - Token signed with old hardcoded fallback placeholder is rejected', () => {
  const oldPlaceholderSecret = 'OLD_FALLBACK_PLACEHOLDER_NOT_REAL_KEY_32CHARS';
  const legacyToken = jwt.sign(
    { sub: '507f1f77bcf86cd799439011', purpose: 'access' },
    oldPlaceholderSecret,
    { algorithm: 'HS256', expiresIn: '15m' }
  );

  assert.throws(
    () => tokens.verify(legacyToken, 'access'),
    /invalid signature/,
    'Tokens signed with old fallback secrets must be rejected'
  );
});

test('Phase 2 - Static scan of apps/ source confirms NO hardcoded credentials or fallback secrets', () => {
  const appsDir = path.resolve(__dirname, '../../..');

  function scanDir(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '__tests__' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }
        files.push(...scanDir(fullPath));
      } else if (
        /\.(jsx?|tsx?|mjs|cjs)$/.test(entry.name) &&
        !/\.test\./.test(entry.name) &&
        !/\.spec\./.test(entry.name)
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const scannedFiles = scanDir(appsDir);
  assert.ok(scannedFiles.length > 0, 'Must find production source files to scan');

  // Regex patterns that must NEVER match production code:
  // 1. mongodb:// or mongodb+srv:// with embedded credentials user:password@
  const embeddedCredentialsRegex = /mongodb(?:\+srv)?:\/\/[^/\s:@]+:[^/\s:@]+@/i;
  // 2. Known fallback patterns for secrets
  const fallbackSecretRegex = /process\.env\.JWT_SECRET\s*\|\|\s*['"][^'"]+['"]/;

  const violations = [];
  for (const file of scannedFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (embeddedCredentialsRegex.test(content)) {
      violations.push(`${path.relative(appsDir, file)} contains embedded database credentials`);
    }
    if (fallbackSecretRegex.test(content)) {
      violations.push(`${path.relative(appsDir, file)} contains hardcoded JWT fallback`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Found hardcoded secrets or credentials in production files:\n${violations.join('\n')}`
  );
});
