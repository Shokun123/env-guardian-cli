import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function parseEnv(content) {
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

export function auditEnv(envContent, exampleContent) {
  const env = parseEnv(envContent);
  const example = parseEnv(exampleContent);

  const missingInEnv = Object.keys(example).filter(k => !(k in env));
  const missingInExample = Object.keys(env).filter(k => !(k in example));
  const emptyCritical = Object.entries(env)
    .filter(([k, v]) => !v && /SECRET|KEY|PASSWORD|TOKEN|AUTH/i.test(k))
    .map(([k]) => k);

  const isValid = missingInEnv.length === 0 && emptyCritical.length === 0;

  return {
    isValid,
    totalEnvKeys: Object.keys(env).length,
    totalExampleKeys: Object.keys(example).length,
    missingInEnv,
    missingInExample,
    emptyCritical
  };
}

export function sanitizeEnv(envContent) {
  const lines = envContent.split('\n');
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(line);
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      output.push(line);
      continue;
    }
    const key = line.slice(0, eqIdx).trim();
    let placeholder = 'your_' + key.toLowerCase() + '_here';
    if (/PORT/i.test(key)) placeholder = '3000';
    if (/URL|HOST/i.test(key)) placeholder = 'http://localhost:3000';
    if (/NODE_ENV/i.test(key)) placeholder = 'development';

    output.push(`${key}=${placeholder}`);
  }

  return output.join('\n');
}

export function encryptEnv(content, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(content, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    version: '1.0',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex')
  }, null, 2);
}

export function decryptEnv(payloadString, passphrase) {
  const parsed = JSON.parse(payloadString);
  const salt = Buffer.from(parsed.salt, 'hex');
  const iv = Buffer.from(parsed.iv, 'hex');
  const tag = Buffer.from(parsed.tag, 'hex');
  const encrypted = Buffer.from(parsed.data, 'hex');

  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf-8');
}

export function generatePreCommitHook() {
  return `#!/bin/sh
# Env Guardian - Pre-commit secret leak prevention hook
if git diff --cached --name-only | grep -E "(^|/)\\.env(\\.[a-zA-Z0-9_-]+)?$" | grep -v "\\.env\\.example" | grep -v "\\.env\\.enc"; then
  echo "\\x1b[0;31m[BLOCKED BY ENV-GUARDIAN]\\x1b[0m Attempting to commit an unencrypted .env file!"
  echo "Please remove it from staging or encrypt it using: npx env-guardian encrypt .env <password>"
  exit 1
fi
exit 0
`;
}
