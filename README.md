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

### 🚀 4 Ways to Run SupaVault

Choose the method that suits your workflow:

| Method | When to use | Command format |
|---|---|---|
| **1. Local Clone** (Recommended) | You want to inspect or build code | `node dist/index.js backup ...` |
| **2. NPX (Zero Install)** | Run instantly without cloning | `npx github:<your-username>/supavault#Release_1.0.0 backup ...` |
| **3. Global Install** | Run `supavault` from any terminal directory | `supavault backup ...` |
| **4. Docker Container** | Don't want to install Node or `pg_dump` | `docker run ... supavault backup ...` |

---

### Setup for Local Clone (Method 1)

```bash
git clone --branch Release_1.0.0 https://github.com/<your-username>/supavault.git
cd supavault
npm install
npm run build
```

> 💡 **Tip:** If you prefer running without cloning, use **Method 2 (NPX)**:
> ```bash
> npx github:<your-username>/supavault#Release_1.0.0 backup --host db.yourprojectref.supabase.co --password "yourpassword"
> ```

---

### Option 1 — Full Backup (All Tables & Data) ✅ Recommended

**Best for:** Backing up your complete Supabase database and migrating to another Supabase project or any other PostgreSQL provider.

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

**Output:**
```
./backups/supavault_postgres_full_20260905_201500.dump
```

---

### Option 2 — Backup Using a Connection URL

**Best for:** Quick one-liner backup without passing separate flags.

```bash
node dist/index.js backup \
  --url "postgresql://postgres:yourpassword@db.yourprojectref.supabase.co:5432/postgres" \
  --out ./backups
```

> 🔑 If your password contains `@`, encode it as `%40` in the URL (e.g. `p@ss` → `p%40ss`).

---

### Option 3 — Schema-Only or Data-Only Backup

**Schema only** — backs up table structures, indexes, constraints, and enums (no row data):

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --password "yourpassword" \
  --type schema \
  --out ./backups
```

**Data only** — backs up data rows only:

```bash
node dist/index.js backup \
  --host db.yourprojectref.supabase.co \
  --password "yourpassword" \
  --type data \
  --format plain \
  --out ./backups
```

| Type | Backs up | File format | Use case |
|---|---|---|---|
| `full` | Schema + all table data | `.dump` (compressed) | Full disaster recovery, project migration |
| `schema` | Tables, indexes, enums (no data) | `.dump` or `.sql` | Clone database structure to a new instance |
| `data` | Table rows only | `.dump` or `.sql` | Data-only backup or seeding |

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

To migrate your backup into a new or existing Supabase project, run the restore command **without the `--clean` flag**:

```bash
node dist/index.js restore \
  --file ./backups/supavault_postgres_full_20260905_201500.dump \
  --host db.TARGET-PROJECT.supabase.co \
  --port 5432 \
  --database postgres \
  --user postgres \
  --password "target-project-password"
```

> 💡 **Why omit `--clean` on Supabase?**
> Supabase projects have pre-installed internal triggers (`pgrst_drop_watch`, `issue_pg_net_access`, etc.) owned by the internal `supabase_admin` system user. If you pass `--clean`, Postgres tries to `DROP` those internal triggers and logs permission warnings. Omitting `--clean` safely restores all of your application tables and data without touching internal system triggers.


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

This happens when you pass `--clean` while restoring to a Supabase project. Supabase's internal triggers (`pgrst_drop_watch`, `issue_pg_net_access`, etc.) are owned by `supabase_admin`, not your `postgres` user.

**Fix:** Do not include `--clean` when restoring to a Supabase project. All your tables and data will restore safely without throwing permission warnings. Use `--clean` only on databases where you have full root/superuser access (e.g., local Docker Postgres).

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

### `Error: Cannot find module '.../dist/index.js'`

This happens if you haven't compiled the TypeScript code yet. Run:

```bash
npm run build
```

Then retry `node dist/index.js backup ...`.

---

### `command not found: node`

Node.js is not installed on your machine or not in your PATH. 

Download and install the **LTS** version from [nodejs.org](https://nodejs.org/), then restart your terminal and verify:

```bash
node --version
```

---

## 📄 License

Open-source software licensed under the [MIT License](LICENSE). Built with ❤️ by [Fawru](https://fawru.com) & Pulkit Bisht.
