import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import ora from "ora";
import { executeCommand } from "../utils/exec";
import { formatBytes, getTimestampString } from "../utils/helpers";

export interface BackupOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: string;
  type: "full" | "schema" | "data";
  format: "custom" | "plain";
  out: string;
  filename?: string;
}

export async function backupCommand(opts: BackupOptions): Promise<string> {
  // Ensure output directory exists
  const targetDir = path.resolve(opts.out);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = opts.format === "custom" ? "dump" : "sql";
  const defaultName = `supavault_${opts.database}_${opts.type}_${getTimestampString()}.${ext}`;
  const finalFilename = opts.filename || defaultName;
  const targetFilePath = path.join(targetDir, finalFilename);

  console.log(chalk.bold.cyan("\n🚀 SupaVault Database Backup Engine"));
  console.log(chalk.gray("--------------------------------------------------"));
  console.log(`📡 Host:       ${chalk.white(opts.host)}:${chalk.white(opts.port)}`);
  console.log(`📁 Database:   ${chalk.white(opts.database)}`);
  console.log(`👤 User:       ${chalk.white(opts.user)}`);
  console.log(`🎯 Scope:      ${chalk.magenta(opts.type.toUpperCase())}`);
  console.log(`📦 Format:     ${chalk.yellow(opts.format === "custom" ? "Custom Compressed (.dump)" : "Plain SQL (.sql)")}`);
  console.log(`💾 Target:     ${chalk.green(targetFilePath)}`);
  console.log(chalk.gray("--------------------------------------------------\n"));

  const spinner = ora("Executing pg_dump stream...").start();

  const args = [
    `--host=${opts.host}`,
    `--port=${opts.port}`,
    `--username=${opts.user}`,
    `--dbname=${opts.database}`,
    `--format=${opts.format === "custom" ? "custom" : "plain"}`,
    "--no-owner",
    "--no-acl",
    `--file=${targetFilePath}`
  ];

  if (opts.type === "schema") {
    args.push("--schema-only");
  } else if (opts.type === "data") {
    args.push("--data-only");
  }

  const env: NodeJS.ProcessEnv = {
    PGPASSWORD: opts.password || "",
  };

  if (opts.ssl) {
    env.PGSSLMODE = opts.ssl;
  }

  try {
    await executeCommand("pg_dump", args, { env });
    spinner.succeed(chalk.bold.green("Backup generated successfully!"));

    if (fs.existsSync(targetFilePath)) {
      const stats = fs.statSync(targetFilePath);
      console.log(chalk.bold.white(`\n✅ Backup File Created:`));
      console.log(`   Location: ${chalk.green(targetFilePath)}`);
      console.log(`   Size:     ${chalk.yellow(formatBytes(stats.size))}`);
    }

    return targetFilePath;
  } catch (err: any) {
    spinner.fail(chalk.bold.red("Backup failed!"));
    console.error(chalk.red(`\nError details: ${err.message}\n`));
    throw err;
  }
}
