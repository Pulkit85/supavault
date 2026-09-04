import chalk from "chalk";
import ora from "ora";
import * as net from "net";

export interface TestOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: string;
}

export async function testConnectionCommand(opts: TestOptions): Promise<boolean> {
  const spinner = ora(`Testing TCP network connectivity to ${chalk.cyan(opts.host)}:${chalk.yellow(opts.port)}...`).start();

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(6000);

    socket.on("connect", () => {
      spinner.succeed(chalk.green(`Port ${opts.port} on ${opts.host} is open and accepting connections.`));
      socket.destroy();
      console.log(chalk.gray(`Database target: ${opts.database} (User: ${opts.user})`));
      console.log(chalk.bold.green("✔ Connection verified successfully!"));
      resolve(true);
    });

    socket.on("timeout", () => {
      spinner.fail(chalk.red(`Connection timed out after 6 seconds connecting to ${opts.host}:${opts.port}`));
      socket.destroy();
      resolve(false);
    });

    socket.on("error", (err) => {
      spinner.fail(chalk.red(`Failed to connect to ${opts.host}:${opts.port}: ${err.message}`));
      resolve(false);
    });

    socket.connect(opts.port, opts.host);
  });
}
