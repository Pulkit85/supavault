<div align="center">

# 🛡️ SupaVault

**Zero-config standalone backup & restore engine for Supabase and PostgreSQL databases.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%20--%2016-blue.svg)](https://www.postgresql.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

*Take control of your database backups without forced enterprise upgrades, vendor lock-in, or complex infrastructure.*

[Quick Start](#-quick-start) •
[CLI Commands](#-cli-commands) •
[Supabase Guide](#-supabase-free-tier-guide) •
[Restore & Migration](#-restore--migration) •
[Automate with GitHub Actions](#-automated-daily-backups-via-github-actions)

</div>

---

## 💡 Why SupaVault?

Supabase Free Tier does not include automated daily backups or Point-in-Time Recovery (PITR). If you want to:
- 🔒 **Back up your production data** to your local machine or private cloud storage.
- 🔁 **Migrate across environments** (e.g. Supabase Free $\to$ Self-hosted $\to$ Neon $\to$ AWS RDS).
- 🧪 **Clone staging/dev environments** quickly with real schemas or data.
- ⚡ **Automate backups for free** using standard GitHub Actions runners.

**SupaVault** solves this with a lightweight CLI tool and zero cloud dependencies.

---

## 🚀 Quick Start

### Option 1: Run instantly with NPX (No install needed)

```bash
npx supavault backup \
  --host db.yourproject.supabase.co \
  --password "your-db-password" \
  --out ./backups
```

Or pass a standard PostgreSQL connection URI:

```bash
npx supavault backup --url "postgresql://postgres:your-password@db.yourproject.supabase.co:5432/postgres"
```

### Option 2: Install globally

```bash
npm install -g supavault

# Verify installation
supavault --help
```

### Option 3: Run via Docker (Zero local prerequisites)

```bash
docker run --rm \
  -v $(pwd)/backups:/backups \
  -e SUPAVAULT_PASSWORD="your-db-password" \
  supavault backup \
    --host db.yourproject.supabase.co \
    --out /backups
```

---

## 🛠️ CLI Commands

### 1. `backup` — Create a database dump

```bash
supavault backup [options]
```

| Option | Shorthand | Description | Default |
|---|---|---|---|
| `--url` | `-u` | Full PostgreSQL connection URI | - |
| `--host` | `-h` | Database host | `localhost` |
| `--port` | `-p` | Database port | `5432` |
| `--database` | `-d` | Target database name | `postgres` |
| `--user` | `-U` | Target username | `postgres` |
| `--password` | `-W` | Database password | `$SUPAVAULT_PASSWORD` |
| `--ssl` | `-s` | SSL connection mode (`require`, `prefer`, `disable`) | `require` |
| `--type` | `-t` | Backup scope (`full`, `schema`, `data`) | `full` |
| `--format` | `-f` | Output format (`custom` $\to$ `.dump`, `plain` $\to$ `.sql`) | `custom` |
| `--out` | `-o` | Output directory destination | `./backups` |
| `--filename` | `-n` | Custom output filename | Auto-generated timestamp |

#### Examples:

```bash
# Full compressed custom archive (.dump)
supavault backup -h db.xyz.supabase.co -W "secret" -t full

# Schema only (tables, indexes, constraints, enums)
supavault backup -h db.xyz.supabase.co -W "secret" -t schema

# Data only as readable plain SQL (.sql)
supavault backup -h db.xyz.supabase.co -W "secret" -t data -f plain
```

---

### 2. `restore` — Restore / Migrate to any PostgreSQL Target

Restore your backup to a local Docker container, another Supabase project, Neon, or RDS:

```bash
supavault restore \
  --file ./backups/supavault_postgres_full_20260902_203000.dump \
  --host localhost \
  --port 5432 \
  --database my_restored_db \
  --user postgres \
  --clean
```

---

### 3. `test` — Verify Network Connectivity

Test whether your machine can reach the target database port and credentials:

```bash
supavault test --host db.xyz.supabase.co --port 5432
```

---

## 🧭 Supabase Free Tier Guide

### Where to find your credentials in Supabase:
1. Go to your **Supabase Dashboard** $\to$ **Project Settings** $\to$ **Database**.
2. Under **Connection Parameters**:
   - **Host:** `db.[YOUR-PROJECT-REF].supabase.co`
   - **Port:** `5432` *(Note: Direct connection port 5432 is recommended for backups. If your ISP blocks IPv6 direct connections, use the Session Mode pooler port `5432`)*
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** The password you set when creating your project.

---

## 🤖 Automated Daily Backups via GitHub Actions

You can schedule automated daily backups using GitHub Actions with free storage retention:

1. Copy [`examples/github-actions-daily.yml`](examples/github-actions-daily.yml) to your repository under `.github/workflows/backup.yml`.
2. Add your database secrets to **Repository Settings** $\to$ **Secrets and variables** $\to$ **Actions**:
   - `SUPAVAULT_HOST`
   - `SUPAVAULT_PASSWORD`
3. Every day at 02:00 UTC, GitHub will automatically dump your database and store the compressed file as a downloadable workflow artifact.

---

## ⚙️ Environment Variables

You can configure SupaVault using a `.env` file or export them in your shell:

```bash
SUPAVAULT_HOST="db.xxxxxxxxxxxx.supabase.co"
SUPAVAULT_PORT="5432"
SUPAVAULT_DATABASE="postgres"
SUPAVAULT_USER="postgres"
SUPAVAULT_PASSWORD="your_password"
SUPAVAULT_SSL="require"
SUPAVAULT_OUT_DIR="./backups"
```

---

## 🐳 Running with Docker Compose

1. Copy `examples/.env.example` to `.env` and fill in your connection details.
2. Run:
```bash
docker compose -f docker/docker-compose.yml run supavault
```
Your backup file will appear in the `./backups` directory on your host machine.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE). Built with ❤️ by [Fawru](https://fawru.com) & Pulkit Bisht.
