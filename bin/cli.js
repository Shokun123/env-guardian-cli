#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { auditEnv, sanitizeEnv, encryptEnv, decryptEnv, generatePreCommitHook } from '../src/guardian.js';

const [command, ...args] = process.argv.slice(2);

function showHelp() {
  console.log(`
🛡️ Env Guardian CLI — Zero-Dependency Secret Shield & .env Auditor

Usage:
  npx env-guardian <command> [options]

Commands:
  audit [envFile] [exampleFile]   Audit .env against .env.example for missing or empty keys
  sanitize [envFile]              Create sanitized .env.example template from existing .env
  encrypt <envFile> <password>    Encrypt .env file using AES-256-GCM to .env.enc
  decrypt <encFile> <password>    Decrypt .env.enc back to plain .env
  install-hook                    Install automatic pre-commit hook to block secret leaks
  help                            Show this help menu
  `);
  process.exit(0);
}

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
}

if (command === 'audit') {
  const envPath = path.resolve(process.cwd(), args[0] || '.env');
  const examplePath = path.resolve(process.cwd(), args[1] || '.env.example');

  if (!fs.existsSync(envPath)) {
    console.error(`Error: ${envPath} not found.`);
    process.exit(1);
  }
  if (!fs.existsSync(examplePath)) {
    console.error(`Error: ${examplePath} not found.`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  const audit = auditEnv(envContent, exampleContent);

  console.log(`🛡️ Env Guardian Audit:`);
  console.log(`  Total Active Keys:  ${audit.totalEnvKeys}`);
  console.log(`  Total Example Keys: ${audit.totalExampleKeys}`);

  if (audit.missingInEnv.length > 0) {
    console.warn(`  ⚠️ Missing in ${path.basename(envPath)}:`, audit.missingInEnv.join(', '));
  }
  if (audit.missingInExample.length > 0) {
    console.info(`  ℹ️ Not documented in ${path.basename(examplePath)}:`, audit.missingInExample.join(', '));
  }
  if (audit.emptyCritical.length > 0) {
    console.error(`  🚨 Empty Critical Secrets:`, audit.emptyCritical.join(', '));
  }

  if (audit.isValid) {
    console.log(`\n✓ All required environment variables are valid and verified.`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (command === 'sanitize') {
  const envPath = path.resolve(process.cwd(), args[0] || '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`Error: ${envPath} not found.`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const sanitized = sanitizeEnv(content);
  const outPath = path.resolve(process.cwd(), '.env.example');
  fs.writeFileSync(outPath, sanitized, 'utf-8');
  console.log(`✓ Sanitized .env.example created successfully at: ${outPath}`);
}

if (command === 'encrypt') {
  const envPath = path.resolve(process.cwd(), args[0] || '.env');
  const pass = args[1];
  if (!pass) {
    console.error('Error: Master passphrase is required. (e.g. npx env-guardian encrypt .env mypassword)');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const enc = encryptEnv(content, pass);
  const outPath = envPath + '.enc';
  fs.writeFileSync(outPath, enc, 'utf-8');
  console.log(`✓ AES-256-GCM Encrypted file generated: ${outPath}`);
}

if (command === 'decrypt') {
  const encPath = path.resolve(process.cwd(), args[0] || '.env.enc');
  const pass = args[1];
  if (!pass) {
    console.error('Error: Master passphrase is required. (e.g. npx env-guardian decrypt .env.enc mypassword)');
    process.exit(1);
  }
  const payload = fs.readFileSync(encPath, 'utf-8');
  try {
    const dec = decryptEnv(payload, pass);
    const outPath = encPath.replace(/\.enc$/i, '');
    fs.writeFileSync(outPath, dec, 'utf-8');
    console.log(`✓ Successfully decrypted to: ${outPath}`);
  } catch (err) {
    console.error(`Decryption failed: Incorrect passphrase or corrupted payload.`);
    process.exit(1);
  }
}

if (command === 'install-hook') {
  const gitDir = path.resolve(process.cwd(), '.git');
  if (!fs.existsSync(gitDir)) {
    console.error('Error: Not inside a Git repository root.');
    process.exit(1);
  }
  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });
  const hookFile = path.join(hooksDir, 'pre-commit');
  fs.writeFileSync(hookFile, generatePreCommitHook(), { mode: 0o755 });
  console.log(`✓ Pre-commit secret shield installed at: ${hookFile}`);
}
