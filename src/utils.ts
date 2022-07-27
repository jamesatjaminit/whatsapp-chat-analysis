import chalk from "chalk";

export type LogType = "VERBOSE" | "INFO" | "WARN" | "ERROR";
const colours: Record<LogType, chalk.Chalk> = {
  VERBOSE: chalk.dim,
  INFO: chalk.green,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};
export async function log(
  message: string,
  type: LogType,
  verbose: boolean,
  silent: boolean
) {
  if (type == "VERBOSE" && !verbose) return;
  if (silent) return;
  console.log(`${colours[type].bold(type)}${chalk.dim(":")} ${message}`);
}
