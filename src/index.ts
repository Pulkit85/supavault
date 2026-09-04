#!/usr/bin/env node

import { Command } from "commander";
import * as dotenv from "dotenv";
import chalk from "chalk";
import { backupCommand } from "./commands/backup";
import { restoreCommand } from "./commands/restore";
import { testConnectionCommand } from "./commands/test";
import { parseConnectionString } from "./utils/helpers";

dotenv.config();

const program = new Command();

program
  .name("supavault")
  .description("Zero-config standalone backup & restore engine for Supabase and PostgreSQL databases")
  .version("1.0.0");

// ----------------------------------------------------
// Command: backup
// ----------------------------------------------------
program
  .command("backup")
  .description("Create a backup dump of your PostgreSQL or Supabase database")
  .option("-u, --url <connectionString>", "Full PostgreSQL connection string (postgresql://user:pass@host:port/dbname)")
  .option("-h, --host <host>", "Database host", process.env.SUPAVAULT_HOST || "localhost")
  .option("-p, --port <port>", "Database port", process.env.SUPAVAULT_PORT || "5432")
  .option("-d, --database <dbname>", "Database name", process.env.SUPAVAULT_DATABASE || "postgres")
  .option("-U, --user <username>", "Database username", process.env.SUPAVAULT_USER || "postgres")
  .option("-W, --password <password>", "Database password", process.env.SUPAVAULT_PASSWORD)
  .option("-s, --ssl <sslmode>", "SSL Mode (require, prefer, disable)", process.env.SUPAVAULT_SSL || "require")
  .option("-t, --type <type>", "Backup type: full, schema, or data", "full")
  .option("-f, --format <format>", "Dump format: custom (.dump) or plain (.sql)", "custom")
  .option("-o, --out <directory>", "Output directory", process.env.SUPAVAULT_OUT_DIR || "./backups")
  .option("-n, --filename <filename>", "Custom output filename")
  .action(async (options) => {
    try {
      let host = options.host;
      let port = parseInt(options.port, 10);
      let database = options.database;
      let user = options.user;
      let password = options.password;
      let ssl = options.ssl;

      if (options.url) {
        const parsed = parseConnectionString(options.url);
        host = parsed.host;
        port = parsed.port;
        database = parsed.database;
        user = parsed.user;
        password = parsed.password || password;
        ssl = parsed.ssl || ssl;
      }

      await backupCommand({
        host,
        port,
        database,
        user,
        password,
        ssl,
        type: options.type,
        format: options.format,
        out: options.out,
        filename: options.filename,
      });
    } catch (err: any) {
      process.exit(1);
    }
  });

// ----------------------------------------------------
// Command: restore
// ----------------------------------------------------
program
  .command("restore")
  .description("Restore a database dump file to a PostgreSQL target")
  .requiredOption("-F, --file <path>", "Path to backup file (.dump or .sql)")
  .option("-u, --url <connectionString>", "Full PostgreSQL connection string (postgresql://user:pass@host:port/dbname)")
  .option("-h, --host <host>", "Target host", process.env.SUPAVAULT_HOST || "localhost")
  .option("-p, --port <port>", "Target port", process.env.SUPAVAULT_PORT || "5432")
  .option("-d, --database <dbname>", "Target database", process.env.SUPAVAULT_DATABASE || "postgres")
  .option("-U, --user <username>", "Target username", process.env.SUPAVAULT_USER || "postgres")
  .option("-W, --password <password>", "Target password", process.env.SUPAVAULT_PASSWORD)
  .option("-s, --ssl <sslmode>", "SSL Mode", process.env.SUPAVAULT_SSL || "require")
  .option("--clean", "Drop database objects before recreating them (pg_restore only)")
  .action(async (options) => {
    try {
      let host = options.host;
      let port = parseInt(options.port, 10);
      let database = options.database;
      let user = options.user;
      let password = options.password;
      let ssl = options.ssl;

      if (options.url) {
        const parsed = parseConnectionString(options.url);
        host = parsed.host;
        port = parsed.port;
        database = parsed.database;
        user = parsed.user;
        password = parsed.password || password;
        ssl = parsed.ssl || ssl;
      }

      await restoreCommand({
        host,
        port,
        database,
        user,
        password,
        ssl,
        file: options.file,
        clean: options.clean,
      });
    } catch (err: any) {
      process.exit(1);
    }
  });

// ----------------------------------------------------
// Command: test
// ----------------------------------------------------
program
  .command("test")
  .description("Test network connectivity to a PostgreSQL host")
  .option("-u, --url <connectionString>", "Full PostgreSQL connection string")
  .option("-h, --host <host>", "Host", process.env.SUPAVAULT_HOST || "localhost")
  .option("-p, --port <port>", "Port", process.env.SUPAVAULT_PORT || "5432")
  .option("-d, --database <dbname>", "Database name", process.env.SUPAVAULT_DATABASE || "postgres")
  .option("-U, --user <username>", "Username", process.env.SUPAVAULT_USER || "postgres")
  .action(async (options) => {
    let host = options.host;
    let port = parseInt(options.port, 10);
    let database = options.database;
    let user = options.user;

    if (options.url) {
      const parsed = parseConnectionString(options.url);
      host = parsed.host;
      port = parsed.port;
      database = parsed.database;
      user = parsed.user;
    }

    const success = await testConnectionCommand({ host, port, database, user });
    if (!success) {
      process.exit(1);
    }
  });

program.parse(process.argv);
