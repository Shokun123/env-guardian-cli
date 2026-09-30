import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv, auditEnv, sanitizeEnv, encryptEnv, decryptEnv, generatePreCommitHook } from '../src/guardian.js';

test('Env Guardian CLI - Security & Audit Suite', async (t) => {
  await t.test('parseEnv parses key-values and handles quotes & comments', () => {
    const raw = `
# System Config
PORT=8080
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
DEBUG=true
`;
    const parsed = parseEnv(raw);
    assert.equal(parsed.PORT, '8080');
    assert.equal(parsed.DATABASE_URL, 'postgresql://user:pass@localhost:5432/db');
    assert.equal(parsed.DEBUG, 'true');
  });

  await t.test('auditEnv flags missing variables and empty critical keys', () => {
    const env = `
PORT=3000
API_KEY=
`;
    const example = `
PORT=3000
API_KEY=your_key
DATABASE_URL=postgres://...
`;
    const audit = auditEnv(env, example);
    assert.equal(audit.isValid, false);
    assert.ok(audit.missingInEnv.includes('DATABASE_URL'));
    assert.ok(audit.emptyCritical.includes('API_KEY'));
  });

  await t.test('sanitizeEnv generates placeholder template', () => {
    const raw = `
PORT=8080
JWT_SECRET=super_secret_production_key_99
`;
    const sanitized = sanitizeEnv(raw);
    assert.ok(sanitized.includes('PORT=3000'));
    assert.ok(sanitized.includes('JWT_SECRET=your_jwt_secret_here'));
    assert.ok(!sanitized.includes('super_secret_production_key_99'));
  });

  await t.test('encryptEnv and decryptEnv round-trip with AES-256-GCM', () => {
    const original = 'BINANCE_PAY_UID=1049392123\nAPI_SECRET=d89a7fbc';
    const password = 'SuperSecureMasterPassword2026!';

    const encrypted = encryptEnv(original, password);
    assert.ok(encrypted.includes('"tag"'));
    assert.ok(!encrypted.includes('1049392123'));

    const decrypted = decryptEnv(encrypted, password);
    assert.equal(decrypted, original);
  });

  await t.test('generatePreCommitHook produces valid bash script', () => {
    const hook = generatePreCommitHook();
    assert.ok(hook.includes('#!/bin/sh'));
    assert.ok(hook.includes('[BLOCKED BY ENV-GUARDIAN]'));
  });
});
