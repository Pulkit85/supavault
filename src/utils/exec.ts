import { spawn } from "child_process";
import chalk from "chalk";

export interface ExecOptions {
  env?: NodeJS.ProcessEnv;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export function executeCommand(cmd: string, args: string[], options: ExecOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderrBuffer = "";

    child.stdout.on("data", (chunk) => {
      if (options.onStdout) {
        options.onStdout(chunk.toString());
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      if (options.onStderr) {
        options.onStderr(text);
      }
    });

    child.on("error", (err: any) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `Required PostgreSQL tool '${cmd}' was not found in your PATH.\n` +
            `👉 On macOS: brew install libpq && brew link --force libpq\n` +
            `👉 On Ubuntu/Debian: sudo apt-get install -y postgresql-client\n` +
            `👉 Or run via Docker: See README.md Docker section for instructions`
          )
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const cleanErr = stderrBuffer.trim() || `Process '${cmd}' exited with code ${code}`;
        reject(new Error(cleanErr));
      }
    });
  });
}
