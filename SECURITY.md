# Security Policy

## Supported Versions

Only the latest stable release receives security fixes. Older versions are not actively maintained.

| Version / Branch | Supported |
|---|---|
| `Release_1.0.0` (latest) | ✅ Yes |
| `development` | ⚠️ No — unstable, not for production use |
| Older branches | ❌ No |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub Issues.**

If you discover a security vulnerability in SupaVault, please report it privately so we can fix it before it is publicly disclosed.

### How to Report

Send a detailed report to:

📧 **support@fawru.com**

Include the following in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- The potential impact (what an attacker could do)
- Your suggested fix (optional but appreciated)

### What Happens Next

| Timeline | Action |
|---|---|
| **Within 48 hours** | We will acknowledge receipt of your report |
| **Within 7 days** | We will confirm whether the issue is valid and assess severity |
| **Within 30 days** | We aim to release a fix for confirmed vulnerabilities |
| **After fix is released** | We will publicly credit you in the release notes (unless you prefer to stay anonymous) |

We follow **responsible disclosure** — we ask that you give us reasonable time to fix the issue before making it public.

---

## Scope

### In Scope

The following are considered valid security issues:

- **Credential exposure** — any path where database passwords or connection strings could be leaked or logged unintentionally
- **Command injection** — unsafe handling of user-supplied input passed to `pg_dump`, `pg_restore`, or `psql`
- **Path traversal** — writing backup files outside the intended output directory
- **Insecure defaults** — default configurations that expose users to unnecessary risk
- **Dependency vulnerabilities** — high/critical CVEs in npm dependencies used by SupaVault

### Out of Scope

The following are **not** considered security vulnerabilities for this project:

- Issues in your own Supabase project configuration or credentials
- Vulnerabilities in PostgreSQL itself or Supabase's infrastructure
- Self-XSS or issues that require physical access to the user's machine
- Rate limiting or DoS on the user's own database (you control the target)
- Missing security headers (this is a CLI tool, not a web server)

---

## Security Best Practices for Users

When using SupaVault, follow these practices to keep your credentials safe:

### ✅ Use a `.env` file, never hardcode credentials

```bash
# Good — store in .env (gitignored)
SUPAVAULT_PASSWORD=yourpassword

# Bad — hardcoded in a script you might commit
node dist/index.js backup --password "yourpassword"
```

### ✅ Never commit your `.env` file

The `.gitignore` in this repo already excludes `.env`. Double-check before pushing:

```bash
git status   # Make sure .env is not listed as a tracked file
```

### ✅ Use a dedicated read-only database user for backups

Instead of using your main `postgres` superuser, create a read-only user for `pg_dump`:

```sql
CREATE USER supavault_backup WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE postgres TO supavault_backup;
GRANT USAGE ON SCHEMA public TO supavault_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supavault_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO supavault_backup;
```

### ✅ Store backup files securely

Backup `.dump` files contain your full database data. Keep them:

- In a private, access-controlled location
- Encrypted at rest if stored on shared drives or cloud storage
- Deleted after they are no longer needed

### ✅ Rotate your database password if exposed

If you accidentally commit or share your database password, immediately:

1. Go to **Supabase Dashboard → Project Settings → Database**
2. Click **"Reset database password"**
3. Update your `.env` file with the new password

---

## Acknowledgements

We appreciate the security research community and responsible disclosure. Researchers who report valid, confirmed vulnerabilities will be acknowledged in release notes with their permission.

---

*This policy is maintained by the [Fawru](https://fawru.com) team.*
