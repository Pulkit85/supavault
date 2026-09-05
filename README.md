<div align="center">

# 🛡️ SupaVault

**Zero-config standalone backup & restore engine for Supabase and PostgreSQL databases.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%20--%2016-blue.svg)](https://www.postgresql.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

*Take control of your database backups — no vendor lock-in, no complex infrastructure.*

[Prerequisites](#-prerequisites) •
[Supabase Connection Guide](#-supabase-connection-guide) •
[Backup](#-backup) •
[Restore & Migrate](#-restore--migrate) •
[Automate](#-automate-with-github-actions) •
[Troubleshooting](#-troubleshooting)

</div>

---

## 🌿 Branch Guide

| Branch | Status | Description |
|---|---|---|
| [`Release_1.0.0`](../../tree/Release_1.0.0) | ✅ **Latest — Recommended** | Stable release. Use this for running backups. |
| `main` | 🔒 Protected | Mirrors the latest release. Always in sync with `Release_1.0.0`. |
| `development` | 🚧 In progress | Active development. May be unstable. |

> **Always clone `Release_1.0.0`** for the most stable experience:
> ```bash
> git clone --branch Release_1.0.0 https://github.com/<your-username>/supavault.git
> ```

---

## 💡 Why SupaVault?

Supabase Free Tier does not include automated backups or Point-in-Time Recovery (PITR). SupaVault solves this with a lightweight CLI tool — back up your database to your local machine, migrate across providers, or automate with GitHub Actions for free.

---

## ✅ Prerequisites

You need **two things** installed before running SupaVault. Do not skip this section.

### 1. Node.js (version 18 or higher)

Check if already installed:

```bash
node --version
```

If it prints `v18.x.x` or higher — you are ready. If not, download the **LTS** version from [nodejs.org](https://nodejs.org/).

### 2. PostgreSQL Client Tools (`pg_dump`)

SupaVault uses `pg_dump` to create backups. You only need the **client tools** — not a full Postgres server.

**macOS:**

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# After install, run the "Next steps" commands Homebrew shows you, then:
brew install libpq && brew link --force libpq
```

**Ubuntu / Debian Linux:**

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

**Windows:**

Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) — select **"Command Line Tools"** only.

**Verify:**

```bash
pg_dump --version
# Should print: pg_dump (PostgreSQL) 16.x
```

---

## 🧭 Supabase Connection Guide

> **Read this before running any command.** Using the wrong host is the #1 reason backups fail.

### ⚠️ Direct Connection vs Pooler

Supabase gives you two types of hosts. **Only Direct Connection works with SupaVault.**

| Type | Host format | Works? |
|---|---|---|
| ✅ **Direct Connection** | `db.abcdefgh.supabase.co` | **Yes — use this** |
| ❌ Pooler | `aws-0-region.pooler.supabase.com` | No — `pg_dump` will fail |

Using the pooler URL gives this error:
```
FATAL: no tenant identifier provided (external_id or sni_hostname required)
```

### How to Find Your Direct Connection Host

1. Open your project on **[supabase.com](https://supabase.com)**
2. Go to **Project Settings → Database**
3. Under **"Connection parameters"**, select the **"Direct connection"** toggle
4. Copy the **Host** — it looks like: `db.abcdefghijkl.supabase.co`

### Your Connection Details

| Field | Example |
|---|---|
| **Host** | `db.abcdefgh.supabase.co` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | The password you set when creating the project |

> 🔑 **Special characters in password?** Wrap in double quotes: `--password "p@ss!word"`. In a URL, encode `@` as `%40`.

---

## 💾 Backup

### Which command to use?

| Situation | Command prefix |
|---|---|
| **Cloned the repo locally** | `node dist/index.js` |
| Installed globally via `npm install -g .` | `supavault` |

All examples below use `node dist/index.js` since SupaVault is run from source.

### Setup (one time)

```bash
git clone --branch Release_1.0.0 https://github.com/<your-username>/supavault.git
cd supavault
npm install
npm run build
```

---

### Option 1 — Public Schema Backup ✅ Recommended for Supabase

**Best for:** Backing up to another Supabase project or any PostgreSQL provider.

This backs up only your `public` schema — your own tables and data — and skips Supabase's internal system objects (PostgREST triggers, Storage internals). This avoids permission errors during restore and gives you a clean, portable backup.

```bash
PGPASSWORD="yourpassword" pg_dump \
  --host db.yourprojectref.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  --format=custom \
  --file ./backups/backup_public_$(date +%Y%m%d_%H%M%S).dump
```

**Restore this backup:**

```bash
PGPASSWORD="target-password" pg_restore \
  --host db.TARGET-PROJECT.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  ./backups/backup_public_20260905_201500.dump
```

> Do **not** use `--clean` when restoring to another Supabase project — it will try to drop internal Supabase triggers and fail with permission errors. Without `--clean` it safely inserts your data on top.

---

### Option 2 — Full Database Backup

**Best for:** Restoring to a non-Supabase PostgreSQL server (local Docker, Neon, Railway, AWS RDS) where you have full admin access.

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --port 5432 \
  --user postgres \
  --password "yourpassword" \
  --database postgres \
  --ssl require \
  --type full \
  --format custom \
  --out ./backups
```

**Using a connection URL instead of individual flags:**

```bash
node dist/index.js backup \
  --url "postgresql://postgres:yourpassword@db.yourprojectref.supabase.co:5432/postgres" \
  --out ./backups
```

> If your password contains `@`, encode it as `%40` inside the URL. Example: `p@ss` → `p%40ss`

**Output:**
```
./backups/supavault_postgres_full_20260905_201500.dump
```

---

### Option 3 — Schema-Only or Data-Only Backup

**Schema only** — backs up table structures, indexes, constraints, enums. No data rows:

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --password "yourpassword" \
  --type schema \
  --out ./backups
```

**Data only** — backs up all data rows. No table structure:

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --password "yourpassword" \
  --type data \
  --format plain \
  --out ./backups
```

| Type | Backs up | File | Use case |
|---|---|---|---|
| `full` | Schema + all data | `.dump` or `.sql` | Full backup, migration |
| `schema` | Table structures only | `.dump` or `.sql` | Recreate DB on new server |
| `data` | Data rows only | `.dump` or `.sql` | Data export, seeding |

---

### All Backup Parameters

| Flag | Short | Description | Default |
|---|---|---|---|
| `--url` | `-u` | Full PostgreSQL connection URI (alternative to individual flags) | — |
| `--host` | `-h` | Database host — Direct Connection only for Supabase | `localhost` |
| `--port` | `-p` | Database port | `5432` |
| `--database` | `-d` | Database name | `postgres` |
| `--user` | `-U` | Username | `postgres` |
| `--password` | `-W` | Password. Wrap in quotes if it contains special characters | `$SUPAVAULT_PASSWORD` |
| `--ssl` | `-s` | SSL mode: `require`, `prefer`, `disable` | `require` |
| `--type` | `-t` | Backup scope: `full`, `schema`, `data` | `full` |
| `--format` | `-f` | Output format: `custom` → `.dump` (compressed), `plain` → `.sql` (readable) | `custom` |
| `--out` | `-o` | Directory to save the backup file | `./backups` |
| `--filename` | `-n` | Custom output filename | Auto-generated with timestamp |

### Check Connectivity First

Before running a backup, verify your machine can reach the database:

```bash
node dist/index.js test \
  --host db.yourprojectref.supabase.co \
  --port 5432
```

### Using a `.env` File (Skip Typing Credentials Every Time)

```bash
cp examples/.env.example .env
```

Edit `.env`:

```env
SUPAVAULT_HOST=db.yourprojectref.supabase.co
SUPAVAULT_PORT=5432
SUPAVAULT_DATABASE=postgres
SUPAVAULT_USER=postgres
SUPAVAULT_PASSWORD=yourpassword
SUPAVAULT_SSL=require
SUPAVAULT_OUT_DIR=./backups
```

Now run without any flags:

```bash
node dist/index.js backup
```

> ⚠️ Never commit `.env` to Git. It is already in `.gitignore`.

---

## 🔄 Restore & Migrate

### Restore to Another Supabase Project

Use the **public schema backup** (Option 1) for cleanest results. Do **not** use `--clean`:

```bash
PGPASSWORD="target-password" pg_restore \
  --host db.TARGET-PROJECT.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  ./backups/backup_public_20260905_201500.dump
```

> **Why no `--clean`?** On Supabase, `--clean` tries to DROP internal system triggers (PostgREST, pg_net, pg_graphql) that are owned by Supabase's admin role — not your `postgres` user. This causes permission errors. Without `--clean`, your data is safely inserted without touching Supabase internals. Your data will still appear correctly.

---

### Restore to a Local PostgreSQL (Docker)

Great for testing, development, or inspecting your data safely:

```bash
# Step 1 — Start a local Postgres container
docker run -d \
  --name local-db \
  -e POSTGRES_PASSWORD=localpass \
  -p 5432:5432 \
  postgres:16

# Step 2 — Restore your backup
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --host localhost \
  --port 5432 \
  --database postgres \
  --user postgres \
  --password "localpass" \
  --ssl disable \
  --clean
```

> `--clean` is safe here because you have full admin access to your local container.

---

### Restore to Neon

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --host ep-your-endpoint.us-east-2.aws.neon.tech \
  --port 5432 \
  --database neondb \
  --user your-neon-user \
  --password "your-neon-password" \
  --ssl require \
  --clean
```

---

### Restore to AWS RDS

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --host your-db.region.rds.amazonaws.com \
  --port 5432 \
  --database postgres \
  --user postgres \
  --password "your-rds-password" \
  --ssl require \
  --clean
```

---

### Restore to Railway

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --host roundhouse.proxy.rlwy.net \
  --port 12345 \
  --database railway \
  --user postgres \
  --password "your-railway-password" \
  --ssl disable \
  --clean
```

> Get your Railway host, port, and credentials from the Railway dashboard → your Postgres service → **Connect** tab.

---

### Restore Using a Connection URL

You can use `--url` instead of individual flags for any provider:

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --url "postgresql://user:password@host:port/dbname"
```

---

### All Restore Parameters

| Flag | Short | Description | Default |
|---|---|---|---|
| `--file` | `-F` | **Required.** Path to backup file (`.dump` or `.sql`) | — |
| `--url` | `-u` | Full PostgreSQL connection URI (alternative to individual flags) | — |
| `--host` | `-h` | Target database host | `localhost` |
| `--port` | `-p` | Target database port | `5432` |
| `--database` | `-d` | Target database name | `postgres` |
| `--user` | `-U` | Target username | `postgres` |
| `--password` | `-W` | Target password | `$SUPAVAULT_PASSWORD` |
| `--ssl` | `-s` | SSL mode: `require`, `prefer`, `disable` | `require` |
| `--clean` | — | Drop existing objects before restoring. **Do not use on Supabase targets** | `false` |

### Restore: `.dump` vs `.sql`

| File type | Restore tool used | Notes |
|---|---|---|
| `.dump` (custom format) | `pg_restore` | Compressed, selective restore possible |
| `.sql` (plain format) | `psql` | Human-readable, restores everything in order |

---

### Selectively Restore One Table

Don't need everything — just restore a single table:

```bash
PGPASSWORD="password" pg_restore \
  --host db.target.supabase.co \
  --username postgres \
  --dbname postgres \
  --table=your_table_name \
  --no-owner \
  ./backups/your-backup.dump
```

---

### Inspect Backup Contents Without Restoring

See what's inside a `.dump` file before restoring anything:

```bash
pg_restore --list ./backups/your-backup.dump
```

---

## 🤖 Automate with GitHub Actions

Get a free daily backup stored as a GitHub artifact (retained 30 days).

### Step 1 — Add the workflow file

```bash
mkdir -p .github/workflows
cp examples/github-actions-daily.yml .github/workflows/backup.yml
git add .github/workflows/backup.yml
git commit -m "ci: add daily SupaVault backup"
git push
```

### Step 2 — Add secrets to your GitHub repo

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Value |
|---|---|
| `SUPAVAULT_HOST` | `db.yourprojectref.supabase.co` |
| `SUPAVAULT_PASSWORD` | Your database password |
| `SUPAVAULT_PORT` | `5432` |
| `SUPAVAULT_DATABASE` | `postgres` |
| `SUPAVAULT_USER` | `postgres` |

### Step 3 — Test it manually

Go to **Actions → "Scheduled Supabase Database Backup" → Run workflow**

The `.dump` file will appear as a downloadable artifact on the workflow run page.

---

## 🐳 Docker (No pg_dump Install Needed)

Use this if you do not want to install `pg_dump` on your machine:

```bash
# Build the image
docker build -f docker/Dockerfile -t supavault .

# Run backup
docker run --rm \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supavault backup --out /backups
```

Your backup file appears in `./backups/` on your host machine.

---

## 🔴 Troubleshooting

### `pg_dump: command not found`

```bash
# macOS
brew install libpq && brew link --force libpq

# If brew is not found, install Homebrew first:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Ubuntu/Debian
sudo apt-get install -y postgresql-client
```

---

### `FATAL: no tenant identifier provided`

You are using the **pooler URL**. Switch to the **Direct Connection** host.

```
❌  aws-0-region.pooler.supabase.com    ← pooler, does not work
✅  db.yourprojectref.supabase.co       ← direct connection, use this
```

Go to Supabase Dashboard → Project Settings → Database → toggle **"Direct connection"**.

---

### `must be owner of event trigger` errors during restore

This happens when you use `--clean` while restoring to a Supabase project. Supabase's internal triggers (`pgrst_drop_watch`, `issue_pg_net_access`, etc.) are owned by `supabase_admin`, not your `postgres` user.

**Fix:** Remove `--clean` when the restore target is a Supabase project. Your data will still restore correctly.

**Better fix:** Use the public schema backup (Option 1) which never includes these internal objects.

---

### `FATAL: password authentication failed`

Your password is wrong. Reset it at Supabase Dashboard → Project Settings → Database → **"Reset database password"**.

If your password has special characters:
- With flags: wrap in double quotes `--password "p@ss!word"`
- In a URL: encode `@` as `%40` → `p%40ss!word`

---

### `Connection timed out`

- Make sure you are using the **Direct Connection** host and port `5432`
- Some ISPs block port 5432. Try a different network or mobile hotspot

---

### `pg_dump: server version mismatch`

Your local `pg_dump` version is older than your Supabase Postgres version. Install a matching version:

```bash
# macOS
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### `npx supavault: command not found`

SupaVault is not yet published to npm. Clone and run from source:

```bash
git clone --branch Release_1.0.0 https://github.com/<your-username>/supavault.git
cd supavault
npm install && npm run build
node dist/index.js backup --host db.xyz.supabase.co --password "yourpassword"
```

---

## 📄 License

Open-source software licensed under the [MIT License](LICENSE). Built with ❤️ by [Fawru](https://fawru.com) & Pulkit Bisht.
