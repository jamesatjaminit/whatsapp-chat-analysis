import type commandLineUsage from "command-line-usage";

export const ARGS_OPTIONS: commandLineUsage.OptionDefinition[] = [
  {
    name: "search",
    description: "Search or regex to look for",
    alias: "s",
    multiple: true,
    type: String,
    typeLabel: "{underline string/regex}",
    defaultOption: true,
  },
  {
    name: "author",
    description:
      "Specific author name to look for messages by (case sensitive)",
    alias: "a",
    type: String,
  },
  {
    name: "file",
    description: "Location of _chat.txt file",
    type: String,
    defaultValue: "_chat.txt",
  },
  {
    name: "aliases",
    description: "Location of aliases.json file",
    type: String,
    defaultValue: "aliases.json",
  },
  {
    name: "verbose",
    alias: "v",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "silent",
    type: Boolean,
    defaultValue: false,
  },
];

export const USAGE_SECTIONS: commandLineUsage.Section[] = [
  {
    header: "Whatsapp Chat Analysis",
    content:
      "A tool to calculate the frequency of messages sent in a whatsapp chat",
  },
  {
    header: "Options",
    optionList: ARGS_OPTIONS,
  },
];
