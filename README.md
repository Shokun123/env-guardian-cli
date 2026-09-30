# 🛡️ Env Guardian CLI

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg?style=flat-square)](#)
[![Binance Pay](https://img.shields.io/badge/Support-Binance%20Pay-F0B90B.svg?style=flat-square&logo=binance&logoColor=white)](https://pay.binance.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **Zero-dependency pre-commit secret leak shield, environment variable auditor, and AES-256-GCM encrypted environment synchronizer.**

Accidental exposure of `.env` files and unencrypted API keys is the #1 vulnerability on GitHub. **Env Guardian** audits `.env` parity against `.env.example`, sanitizes sensitive values, installs a local pre-commit blocker, and provides military-grade AES-256 encryption so teams can safely commit environment files to version control without paying \$25/seat for Doppler or 1Password Developer.

---

## ⚡ Quick Start

### 1. Audit `.env` Parity
Check for missing variables, undocumented keys, or empty production secrets:
```bash
npx env-guardian audit .env .env.example
```

### 2. Auto-Generate Sanitized `.env.example`
Scans your existing `.env` and exports a clean template with sanitized dummy placeholders:
```bash
npx env-guardian sanitize .env
```

### 3. Install Git Pre-Commit Blocker
Installs a zero-dependency Git hook that automatically blocks commits containing unencrypted `.env` files:
```bash
npx env-guardian install-hook
```

### 4. Encrypt `.env` with AES-256-GCM
Symmetrically encrypt your environment file with PBKDF2 key derivation and random IV:
```bash
npx env-guardian encrypt .env "MyTeamMasterPassphrase"
# Creates: .env.enc (Safe to commit to Git)
```

### 5. Decrypt in CI / Production
```bash
npx env-guardian decrypt .env.enc "MyTeamMasterPassphrase"
# Restores: .env
```

---

## 🛠️ CLI Reference

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `audit` | `[envFile] [exampleFile]` | Compares variables, flags missing or empty keys |
| `sanitize` | `[envFile]` | Generates sanitized `.env.example` placeholder file |
| `install-hook` | — | Configures `.git/hooks/pre-commit` to prevent secret leaks |
| `encrypt` | `<file> <passphrase>` | Encrypts payload to `<file>.enc` via AES-256-GCM |
| `decrypt` | `<file.enc> <passphrase>` | Decrypts `<file.enc>` back to plaintext |

---

## 💎 Enterprise Team License ($19 USDT)

Upgrade to the **Env Guardian Enterprise Bundle**:
1. **GitHub Actions Decryption Action:** Automated 1-step decryption for deployment pipelines.
2. **Multi-Environment Matrix:** Sync staging, production, and sandbox keys with role-based passphrases.
3. **Entropy & Secret Leak Scanner:** Regex heuristics detecting AWS, Stripe, GitHub, OpenAI, and Binance API secret formats before commit.

### How to Purchase:
Transfer **$19.00 USDT** directly via **Binance Pay**:
- **Binance Pay UID:** `1049392123`
- **Username:** `User-79a91`
- **Networks:** BEP20 / Polygon
- Reference note: `ENV-GUARDIAN-PRO`

Or purchase with instant digital delivery at [Shokun DevTools Hub](https://shokun123.github.io/shokun-devtools-hub/).

---

## 📄 License
MIT © [Shokun123](https://github.com/Shokun123).
