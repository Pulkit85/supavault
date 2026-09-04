import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import ora from "ora";
import { executeCommand } from "../utils/exec";

export interface RestoreOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: string;
  file: string;
  clean?: boolean;
}

export async function restoreCommand(opts: RestoreOptions): Promise<void> {
  const filePath = path.resolve(opts.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found at path: ${filePath}`);
  }

  const isCustomDump = filePath.endsWith(".dump") || filePath.endsWith(".tar");

  console.log(chalk.bold.cyan("\n🔄 SupaVault Database Restore Engine"));
  console.log(chalk.gray("--------------------------------------------------"));
  console.log(`📡 Target Host: ${chalk.white(opts.host)}:${chalk.white(opts.port)}`);
  console.log(`📁 Database:    ${chalk.white(opts.database)}`);
  console.log(`👤 User:        ${chalk.white(opts.user)}`);
  console.log(`📂 Source File: ${chalk.green(filePath)}`);
  console.log(chalk.gray("--------------------------------------------------\n"));

  const spinner = ora("Restoring database from backup file...").start();

  const env: NodeJS.ProcessEnv = {
    PGPASSWORD: opts.password || "",
  };
  if (opts.ssl) {
    env.PGSSLMODE = opts.ssl;
  }

  try {
    if (isCustomDump) {
      // Use pg_restore for .dump / custom archive files
      const args = [
        `--host=${opts.host}`,
        `--port=${opts.port}`,
        `--username=${opts.user}`,
        `--dbname=${opts.database}`,
        "--no-owner",
        "--no-acl",
      ];
      if (opts.clean) {
        args.push("--clean");
        args.push("--if-exists");
      }
      args.push(filePath);

      await executeCommand("pg_restore", args, { env });
    } else {
      // Use psql for plain .sql files
      const args = [
        `--host=${opts.host}`,
        `--port=${opts.port}`,
        `--username=${opts.user}`,
        `--dbname=${opts.database}`,
        `--file=${filePath}`,
      ];
      await executeCommand("psql", args, { env });
    }

    spinner.succeed(chalk.bold.green("Database restore completed successfully!"));
    console.log(chalk.bold.white("\n✔ All tables and data have been restored to the target database."));
  } catch (err: any) {
    spinner.fail(chalk.bold.red("Restore encountered an issue!"));
    console.error(chalk.red(`\nDetails: ${err.message}\n`));
    throw err;
  }
}
