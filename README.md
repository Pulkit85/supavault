<div align="center">

# 🛡️ SupaVault

**Zero-config standalone backup & restore engine for Supabase and PostgreSQL databases.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%20--%2016-blue.svg)](https://www.postgresql.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

*Take control of your database backups without forced enterprise upgrades, vendor lock-in, or complex infrastructure.*

[Prerequisites](#-prerequisites) •
[Quick Start](#-quick-start) •
[Supabase Connection Guide](#-supabase-connection-guide-important) •
[CLI Commands](#-cli-commands) •
[Restore & Migration](#-restore--migration) •
[Automate with GitHub Actions](#-automated-daily-backups-via-github-actions) •
[Troubleshooting](#-troubleshooting)

</div>

---

## 💡 Why SupaVault?

Supabase Free Tier does not include automated daily backups or Point-in-Time Recovery (PITR). If you want to:

- 🔒 **Back up your production data** to your local machine or private cloud storage
- 🔁 **Migrate across environments** — Supabase → Self-hosted → Neon → AWS RDS
- 🧪 **Clone staging/dev environments** quickly with real schemas or data
- ⚡ **Automate backups for free** using standard GitHub Actions runners

**SupaVault** solves this with a lightweight CLI tool and zero cloud dependencies.

---

## ✅ Prerequisites

You need **two things** installed before running SupaVault. Do not skip this section.

---

### 1. Node.js (version 18 or higher)

Check if already installed:

```bash
node --version
```

If it prints `v18.x.x` or higher — you are ready. If not, download the **LTS** version from [nodejs.org](https://nodejs.org/) and install it.

---

### 2. PostgreSQL Client Tools (`pg_dump`)

SupaVault uses `pg_dump` to create the backup. You only need the **client tools** — not a full Postgres server.

**macOS:**

```bash
# Step 1 — Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Step 2 — After install, run the two commands Homebrew shows you under "Next steps"
# They look like this (copy from your terminal output, not from here):
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"

# Step 3 — Install pg_dump
brew install libpq && brew link --force libpq
```

**Ubuntu / Debian Linux:**

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

**Windows:**

Download the PostgreSQL installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/), select **"Command Line Tools"** only during setup.

**Verify it works:**

```bash
pg_dump --version
# Should print: pg_dump (PostgreSQL) 16.x
```

> If `pg_dump` is not installed, every backup command will fail with `pg_dump: command not found`. Install it first before proceeding.

---

## 🧭 Supabase Connection Guide (Important)

> **Read this before running any command.** Using the wrong host is the #1 reason backups fail.

### ⚠️ Direct Connection vs Pooler — What to Use

Supabase gives you two types of database URLs. **Only Direct Connection works with SupaVault.**

| Type | Host looks like | Works with SupaVault? |
|---|---|---|
| ✅ **Direct Connection** | `db.abcdefgh.supabase.co` | **Yes — use this** |
| ❌ Pooler | `aws-0-ap-southeast-1.pooler.supabase.com` | No — `pg_dump` will fail |

The pooler is a proxy for app queries. `pg_dump` requires a direct connection to the actual Postgres server. Using the pooler URL will give you this error:

```
FATAL: no tenant identifier provided (external_id or sni_hostname required)
```

### How to Find Your Direct Connection Host

1. Go to **[supabase.com](https://supabase.com)** and open your project
2. Click **Project Settings** (gear icon in the left sidebar)
3. Click the **Database** tab
4. Under **"Connection parameters"**, make sure the toggle shows **"Direct connection"**
5. Your host will look like: `db.abcdefghijkl.supabase.co`

### Your Connection Details

| Field | Where to find | Example |
|---|---|---|
| **Host** | Connection parameters → Direct connection | `db.abcdefgh.supabase.co` |
| **Port** | Connection parameters | `5432` |
| **Database** | Connection parameters | `postgres` |
| **User** | Connection parameters | `postgres` |
| **Password** | The password you set when creating the project | `yourpassword` |

> 🔑 **Password tip:** If your password contains special characters like `@`, `!`, `#` — wrap it in double quotes when using flags (`--password "p@ss!word"`). If using a URL format, encode `@` as `%40`.

---

## 🚀 Quick Start

### Which command style should I use?

| Situation | Command to use |
|---|---|
| Package published on npm (future) | `npx supavault backup ...` |
| **Cloned the repo locally (now)** | `node dist/index.js backup ...` |
| Installed globally with `npm install -g .` | `supavault backup ...` |

Since SupaVault is currently run from the cloned source, **all examples below use `node dist/index.js`**.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/<your-username>/supavault.git
cd supavault
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Build the project

```bash
npm run build
```

### Step 4 — Run your first backup

**Using individual flags:**

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --port 5432 \
  --user postgres \
  --password "yourpassword" \
  --database postgres \
  --ssl require \
  --out ./backups
```

**Using a connection URL (single string):**

```bash
node dist/index.js backup --url "postgresql://postgres:yourpassword@db.yourprojectref.supabase.co:5432/postgres"
```

> If your password has `@` in it, replace each `@` with `%40` inside the URL. Example: `p@ss` → `p%40ss`

### Step 5 — Check your backup file

```bash
ls -lh ./backups/
```

You will see a file like:
```
supavault_postgres_full_20260904_201500.dump   (e.g. 2.4 MB)
```

---

### Optional — Install globally so you can run from anywhere

```bash
npm install -g .

# Now works from any folder on your machine
supavault backup --host db.yourprojectref.supabase.co --password "yourpassword"
```

---

## 🛠️ CLI Commands

### `backup` — Create a database dump

```bash
node dist/index.js backup [options]
```

| Flag | Short | Description | Default |
|---|---|---|---|
| `--url` | `-u` | Full PostgreSQL connection URI | — |
| `--host` | `-h` | Database host (Direct Connection only) | `localhost` |
| `--port` | `-p` | Database port | `5432` |
| `--database` | `-d` | Database name | `postgres` |
| `--user` | `-U` | Username | `postgres` |
| `--password` | `-W` | Password (wrap in quotes if it has special chars) | `$SUPAVAULT_PASSWORD` |
| `--ssl` | `-s` | SSL mode: `require`, `prefer`, `disable` | `require` |
| `--type` | `-t` | Backup scope: `full`, `schema`, `data` | `full` |
| `--format` | `-f` | Output: `custom` (.dump) or `plain` (.sql) | `custom` |
| `--out` | `-o` | Output directory | `./backups` |
| `--filename` | `-n` | Custom filename | Auto-generated |

#### Backup type options

| Type | What it backs up | Use case |
|---|---|---|
| `full` | Schema + all data | Full backup, disaster recovery, migration |
| `schema` | Table structures only (no data) | Recreate DB on a new server |
| `data` | Data rows only (no schema) | Data export, seeding |

#### Output format options

| Format | File extension | Restore tool | Notes |
|---|---|---|---|
| `custom` | `.dump` | `pg_restore` | Compressed, recommended |
| `plain` | `.sql` | `psql` | Human-readable SQL text |

#### Examples

```bash
# Full backup
node dist/index.js backup -h db.xyz.supabase.co -W "secret" -t full

# Schema only
node dist/index.js backup -h db.xyz.supabase.co -W "secret" -t schema

# Data only as plain SQL
node dist/index.js backup -h db.xyz.supabase.co -W "secret" -t data -f plain

# Via connection URL
node dist/index.js backup --url "postgresql://postgres:secret@db.xyz.supabase.co:5432/postgres"
```

---

### `restore` — Restore a backup to a database

```bash
node dist/index.js restore --file <path> [options]
```

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260904_201500.dump \
  --host localhost \
  --port 5432 \
  --database postgres \
  --user postgres \
  --password "yourpassword" \
  --ssl disable \
  --clean
```

> `--clean` drops existing database objects before restoring. Use it when restoring to a database that already has tables.

---

### `test` — Check connection before backing up

Verifies your machine can reach the database. Run this first if you are unsure about your credentials:

```bash
node dist/index.js test --host db.xyz.supabase.co --port 5432
```

---

## 🔄 Restore & Migration

### Restore to a local PostgreSQL (Docker)

```bash
# Start a local Postgres container
docker run -d \
  --name local-postgres \
  -e POSTGRES_PASSWORD=localpassword \
  -p 5432:5432 \
  postgres:16

# Restore your Supabase backup into it
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260904_201500.dump \
  --host localhost \
  --port 5432 \
  --database postgres \
  --user postgres \
  --password localpassword \
  --ssl disable \
  --clean
```

### Migrate Supabase Project → Another Supabase Project

```bash
# Step 1: Backup the source project
node dist/index.js backup \
  --host db.SOURCE-REF.supabase.co \
  --password "source-password" \
  --out ./backups

# Step 2: Restore to the target project
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260904_201500.dump \
  --host db.TARGET-REF.supabase.co \
  --password "target-password" \
  --clean
```

---

## 🤖 Automated Daily Backups via GitHub Actions

### Step 1 — Copy workflow file

```bash
mkdir -p .github/workflows
cp examples/github-actions-daily.yml .github/workflows/backup.yml
git add .github/workflows/backup.yml
git commit -m "ci: add daily SupaVault backup"
git push
```

### Step 2 — Add secrets to your GitHub repo

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|---|---|
| `SUPAVAULT_HOST` | `db.yourprojectref.supabase.co` (Direct Connection only) |
| `SUPAVAULT_PASSWORD` | Your Supabase database password |
| `SUPAVAULT_PORT` | `5432` |
| `SUPAVAULT_DATABASE` | `postgres` |
| `SUPAVAULT_USER` | `postgres` |

### Step 3 — Trigger manually to test

Go to **Actions** tab → **"Scheduled Supabase Database Backup"** → **"Run workflow"**

The `.dump` file will appear as a downloadable artifact on the workflow page, kept for 30 days.

---

## ⚙️ Using a `.env` File

Instead of typing credentials every time, create a `.env` file:

```bash
cp examples/.env.example .env
```

Edit `.env` with your details:

```env
SUPAVAULT_HOST=db.yourprojectref.supabase.co
SUPAVAULT_PORT=5432
SUPAVAULT_DATABASE=postgres
SUPAVAULT_USER=postgres
SUPAVAULT_PASSWORD=yourpassword
SUPAVAULT_SSL=require
SUPAVAULT_OUT_DIR=./backups
```

Then run without any flags — values are picked up automatically:

```bash
node dist/index.js backup
```

> ⚠️ Never commit your `.env` file to Git. It is already listed in `.gitignore`.

---

## 🐳 Running with Docker (No pg_dump install needed)

Use this if you don't want to install `pg_dump` on your machine:

```bash
# Build the image
docker build -f docker/Dockerfile -t supavault .

# Run backup (mounts ./backups as output)
docker run --rm \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supavault backup --out /backups
```

Your backup file appears in `./backups/` on your host machine.

---

## 🔴 Troubleshooting

### `pg_dump: command not found`

PostgreSQL client tools are not installed. Install them:

```bash
# macOS
brew install libpq && brew link --force libpq

# Ubuntu/Debian
sudo apt-get install -y postgresql-client
```

If `brew` is not found on macOS, install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

### `FATAL: no tenant identifier provided`

You are using the **Pooler URL** instead of the **Direct Connection URL**.

```
# ❌ Wrong — pooler URL
aws-0-ap-southeast-1.pooler.supabase.com

# ✅ Correct — direct connection URL
db.yourprojectref.supabase.co
```

Go to Supabase Dashboard → Project Settings → Database → switch to **"Direct connection"** to get the correct host.

---

### `FATAL: password authentication failed`

Your password is wrong. Find it in **Supabase Dashboard** → **Project Settings** → **Database**. You can reset it there if needed.

If your password has special characters like `@` or `!`:
- Always wrap in double quotes: `--password "p@ss!word"`
- In a URL: encode `@` as `%40` → `p%40ss!word`

---

### `Connection timed out`

- Check you are using **port 5432** and the **Direct Connection host**
- Some ISPs block outbound port 5432. Try on a different network or mobile hotspot

---

### `pg_dump: server version mismatch`

Your local `pg_dump` is older than your Supabase Postgres version. Install a matching version:

```bash
# macOS — install PostgreSQL 16 client
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### `npx supavault: command not found`

SupaVault is not yet published to npm. Use `node dist/index.js` instead:

```bash
# Clone the repo first
git clone https://github.com/<your-username>/supavault.git
cd supavault
npm install
npm run build

# Then run
node dist/index.js backup --host db.xyz.supabase.co --password "yourpassword"
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE). Built with ❤️ by [Fawru](https://fawru.com) & Pulkit Bisht.
