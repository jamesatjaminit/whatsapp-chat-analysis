import { open as fileOpen, readFile } from "node:fs/promises";
import { parseString as parseWhatsappString } from "whatsapp-chat-parser";
import chalk from "chalk";
import console from "console";
import { createInterface as createReadlineInterface } from "node:readline";
import { Writable as WriteableStream } from "node:stream";
import { Message } from "whatsapp-chat-parser/types/types";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { log } from "./utils";
import { ARGS_OPTIONS, USAGE_SECTIONS } from "./schema";

const options = commandLineArgs(ARGS_OPTIONS);

const showSpecificMessages = options.author;

let regexes: string[] = [];
if (!options.search) {
  console.log(commandLineUsage(USAGE_SECTIONS));
  process.exit(1);
} else if (typeof options.search == "string") {
  regexes = [options.search];
} else {
  // Is array
  regexes = options.search;
}

const search = regexes.join(", ");

async function main() {
  log("Opening aliases file", "VERBOSE", options.verbose, options.silent);
  let aliases: Record<string, unknown> = {};
  try {
    const aliasFile = await readFile(
      process.cwd() + "/" + options.aliases,
      "utf-8"
    );
    try {
      aliases = JSON.parse(aliasFile);
      log("Loaded aliases file", "VERBOSE", options.verbose, options.silent);
    } catch {
      log(
        "Failed to parse aliases file",
        "ERROR",
        options.verbose,
        options.silent
      );
      process.exit(1);
    }
  } catch {
    if (options.aliases != "aliases.json") {
      log(
        "Not using aliases file since file doesn't exist",
        "WARN",
        options.verbose,
        options.silent
      );
    } else {
      log(
        "Error opening aliases file. Not notifying since filename is default",
        "VERBOSE",
        options.verbose,
        options.silent
      );
    }
  }
  const instances: Record<
    string,
    { number: number; messages: string[] | null }
  > = {};
  const totalAuthors: string[] = [];
  if (!options.silent) console.time("Time Taken");
  log("Opening chat file", "VERBOSE", options.verbose, options.silent);
  const file = await fileOpen(process.cwd() + "/" + options.file);
  const fd = file.createReadStream({ encoding: "utf8" });
  const stream = new WriteableStream();
  const rl = createReadlineInterface(fd, stream);
  let failedLineCount = 0;
  log("Loaded chat file", "VERBOSE", options.verbose, options.silent);
  log("Reading lines", "VERBOSE", options.verbose, options.silent);
  rl.on("line", async (line) => {
    let message: Message;
    try {
      message = (await parseWhatsappString(line))[0];
      const messageFormatted = message.message
        .toLowerCase()
        .replace(/(^[\s\u200b]*|[\s\u200b]*$)/, "");
      // eslint-disable-next-line no-control-regex
      message.author = message.author.trim().replace(/[^\x00-\x7F]/g, "");
      if (aliases[message.author]) {
        message.author = String(aliases[message.author]);
      }
      if (!totalAuthors.includes(message.author))
        totalAuthors.push(message.author);
      for (const regex of regexes) {
        if (messageFormatted.match(regex)) {
          if (!instances[message.author])
            instances[message.author] = {
              number: 0,
              messages: showSpecificMessages ? [] : null,
            };
          instances[message.author] = {
            number: instances[message.author].number + 1,
            messages: showSpecificMessages
              ? // @ts-expect-error it fine
                [...instances[message.author].messages, messageFormatted]
              : null,
          };
          break;
        }
      }
    } catch (err) {
      failedLineCount += 1;
    }
  });
  rl.on("close", () => {
    log("Ended reading chat file", "VERBOSE", options.verbose, options.silent);
    log("Creating table", "VERBOSE", options.verbose, options.silent);
    const keys = Object.keys(instances);
    const finalArray = [];
    for (const key of keys) {
      finalArray.push({
        author: key,
        ...instances[key],
      });
    }
    finalArray.sort((a, b) => {
      return b.number - a.number;
    });
    const table = [];
    let total = 0;
    for (const person of finalArray) {
      table.push({
        Name: person.author,
        Messages: person.number,
      });
      total += person.number;
    }
    if (failedLineCount) {
      log(
        "Failed to parse " +
          failedLineCount +
          " lines. Likely due to a long message overflowing",
        "WARN",
        options.verbose,
        options.silent
      );
    }
    if (!options.silent)
      console.log(chalk.bold("Search: ") + chalk.blue(search));
    if (total) {
      if (showSpecificMessages) {
        console.log(chalk.bold("Author: ") + chalk.magenta(options.author));
        if (instances[options.author]) {
          console.log(instances[options.author].messages);
          if (!options.silent)
            console.log(
              chalk.bold("Matches: ") +
                chalk.green(instances[options.author].messages?.length)
            );
        } else if (totalAuthors.includes(options.author)) {
          log(
            "No author messages matched search term",
            "ERROR",
            options.verbose,
            options.silent
          );
          process.exit(1);
        } else {
          log("Author not found", "ERROR", options.verbose, options.silent);
          process.exit(1);
        }
      } else {
        console.table(table);
        if (!options.silent)
          console.log(chalk.bold("Total matches: ") + chalk.red(total));
      }
    } else {
      log("No matches found", "ERROR", options.verbose, options.silent);
    }
    if (!options.silent) console.timeEnd("Time Taken");
  });
}

main();
