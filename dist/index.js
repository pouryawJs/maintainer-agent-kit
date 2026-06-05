#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createCli: () => createCli,
  version: () => version
});
module.exports = __toCommonJS(index_exports);
var import_commander = require("commander");

// src/core/config.ts
var import_fs_extra2 = require("fs-extra");
var import_yaml = require("yaml");
var import_zod2 = require("zod");

// src/schemas/config.schema.ts
var import_zod = require("zod");
var nonEmptyTrimmedString = import_zod.z.string().transform((value) => value.trim()).pipe(import_zod.z.string().min(1, "Must be a non-empty string."));
var nonEmptyStringArray = import_zod.z.array(nonEmptyTrimmedString).min(1, "Must include at least one value.");
var labelRuleSchema = import_zod.z.object({
  include: nonEmptyStringArray
}).strict();
var goodFirstIssueSchema = import_zod.z.object({
  enabled: import_zod.z.boolean().default(false),
  labels: import_zod.z.array(nonEmptyTrimmedString).default([]),
  include: import_zod.z.array(nonEmptyTrimmedString).default([])
}).strict().superRefine((value, context) => {
  if (!value.enabled) {
    return;
  }
  if (value.labels.length === 0) {
    context.addIssue({
      code: import_zod.z.ZodIssueCode.custom,
      path: ["labels"],
      message: "Must include at least one label when goodFirstIssue is enabled."
    });
  }
  if (value.include.length === 0) {
    context.addIssue({
      code: import_zod.z.ZodIssueCode.custom,
      path: ["include"],
      message: "Must include at least one keyword when goodFirstIssue is enabled."
    });
  }
});
var releaseNotesSchema = import_zod.z.object({
  title: nonEmptyTrimmedString.default("Release Notes"),
  groupByLabels: import_zod.z.record(nonEmptyTrimmedString).default({}),
  includePullRequestLinks: import_zod.z.boolean().default(true)
}).strict();
var configSchema = import_zod.z.object({
  labels: import_zod.z.record(labelRuleSchema).refine((labels) => Object.keys(labels).length > 0, "Must configure at least one label."),
  goodFirstIssue: goodFirstIssueSchema.optional(),
  releaseNotes: releaseNotesSchema.optional()
}).strict();

// src/utils/errors.ts
var MaintainerAgentError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "MaintainerAgentError";
  }
};
function toUserMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred.";
}
function formatZodError(error) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "config";
    return `- ${path}: ${issue.message}`;
  }).join("\n");
}

// src/utils/file.ts
var import_fs_extra = __toESM(require("fs-extra"));
async function pathExists(path) {
  return import_fs_extra.default.pathExists(path);
}
async function readTextFile(path) {
  return import_fs_extra.default.readFile(path, "utf8");
}
async function writeTextFile(path, content) {
  await import_fs_extra.default.outputFile(path, content, "utf8");
}

// src/core/config.ts
async function loadConfig(configPath) {
  if (!await pathExists(configPath)) {
    throw new MaintainerAgentError(`Config file not found: ${configPath}`);
  }
  let rawConfig;
  try {
    rawConfig = await (0, import_fs_extra2.readFile)(configPath, "utf8");
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read config file: ${configPath}`, { cause: error });
  }
  let parsedConfig;
  try {
    parsedConfig = (0, import_yaml.parse)(rawConfig);
  } catch (error) {
    if (error instanceof import_yaml.YAMLParseError) {
      throw new MaintainerAgentError(
        `Invalid YAML in config file: ${configPath}. ${error.message}`,
        { cause: error }
      );
    }
    throw new MaintainerAgentError(`Unable to parse config file: ${configPath}`, { cause: error });
  }
  try {
    return configSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof import_zod2.ZodError) {
      throw new MaintainerAgentError(
        `Invalid config file: ${configPath}.
${formatZodError(error)}`,
        { cause: error }
      );
    }
    throw error;
  }
}

// src/core/release-notes.ts
function generateReleaseNotes({
  pullRequests,
  config
}) {
  const settings = getReleaseNotesSettings(config);
  const sortedPullRequests = [...pullRequests].sort((left, right) => left.number - right.number);
  const lines = [`# ${settings.title}`, ""];
  if (sortedPullRequests.length === 0) {
    return `${lines.concat("No pull requests found.").join("\n")}
`;
  }
  const groupedPullRequests = groupPullRequests(sortedPullRequests, settings.groupByLabels);
  for (const [heading, groupPullRequests2] of groupedPullRequests) {
    if (groupPullRequests2.length === 0) {
      continue;
    }
    lines.push(`## ${heading}`);
    for (const pullRequest of groupPullRequests2) {
      lines.push(formatPullRequest(pullRequest, settings.includePullRequestLinks));
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}
`;
}
function getReleaseNotesSettings(config) {
  return {
    title: config.releaseNotes?.title ?? "Release Notes",
    groupByLabels: config.releaseNotes?.groupByLabels ?? {},
    includePullRequestLinks: config.releaseNotes?.includePullRequestLinks ?? true
  };
}
function groupPullRequests(pullRequests, groupByLabels) {
  const configuredGroups = Object.entries(groupByLabels).map(
    ([label, heading]) => [label, heading, []]
  );
  const otherPullRequests = [];
  for (const pullRequest of pullRequests) {
    const matchingGroup = configuredGroups.find(([label]) => pullRequest.labels.includes(label));
    if (matchingGroup) {
      matchingGroup[2].push(pullRequest);
    } else {
      otherPullRequests.push(pullRequest);
    }
  }
  return [
    ...configuredGroups.map(([, heading, groupedPullRequests]) => [
      heading,
      groupedPullRequests
    ]),
    ["Other Changes", otherPullRequests]
  ];
}
function formatPullRequest(pullRequest, includePullRequestLinks) {
  const reference = includePullRequestLinks && pullRequest.url ? `([#${pullRequest.number}](${pullRequest.url}))` : `(#${pullRequest.number})`;
  const author = pullRequest.author ? ` by @${pullRequest.author}` : "";
  return `- ${pullRequest.title} ${reference}${author}`;
}

// src/commands/release-notes.ts
function registerReleaseNotesCommand(program, logger) {
  program.command("release-notes").description("Generate release notes from local pull request data.").option("-c, --config <path>", "Path to maintainer-agent-kit config file.", ".maintainer-agent.yml").requiredOption("-p, --prs <path>", "Path to merged pull request JSON file.").option("-o, --out <path>", "Path to write release notes Markdown.").action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const pullRequests = await loadPullRequests(options.prs);
      const markdown = generateReleaseNotes({ pullRequests, config });
      if (options.out) {
        await writeTextFile(options.out, markdown);
        logger.success(`Release notes written to: ${options.out}`);
      } else {
        logger.info(markdown.trimEnd());
      }
    } catch (error) {
      logger.error(toUserMessage(error));
      process.exitCode = 1;
    }
  });
}
async function loadPullRequests(prsPath) {
  if (!await pathExists(prsPath)) {
    throw new MaintainerAgentError(`Pull request file not found: ${prsPath}`);
  }
  let rawPullRequests;
  try {
    rawPullRequests = await readTextFile(prsPath);
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read pull request file: ${prsPath}`, {
      cause: error
    });
  }
  let parsedPullRequests;
  try {
    parsedPullRequests = JSON.parse(rawPullRequests);
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in pull request file: ${prsPath}`, {
      cause: error
    });
  }
  if (!Array.isArray(parsedPullRequests)) {
    throw new MaintainerAgentError(`Pull request file must contain an array: ${prsPath}`);
  }
  return parsedPullRequests.map((pullRequest, index) => toPullRequestLike(pullRequest, index));
}
function toPullRequestLike(value, index) {
  if (!value || typeof value !== "object") {
    throw new MaintainerAgentError(`Invalid pull request object at index ${index}: expected object.`);
  }
  const candidate = value;
  if (typeof candidate.number !== "number") {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: number must be a number.`
    );
  }
  if (typeof candidate.title !== "string") {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: title must be a string.`
    );
  }
  if (!Array.isArray(candidate.labels) || candidate.labels.some((label) => typeof label !== "string")) {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: labels must be an array of strings.`
    );
  }
  return {
    number: candidate.number,
    title: candidate.title,
    url: typeof candidate.url === "string" ? candidate.url : void 0,
    labels: candidate.labels,
    mergedAt: typeof candidate.mergedAt === "string" ? candidate.mergedAt : void 0,
    author: typeof candidate.author === "string" ? candidate.author : void 0
  };
}

// src/commands/triage.ts
var import_fs_extra3 = require("fs-extra");

// src/core/matcher.ts
function normalizeText(input) {
  return (input ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
function findMatchedKeywords(text, keywords) {
  const normalizedText = normalizeText(text);
  const matchedKeywords = [];
  const seenKeywords = /* @__PURE__ */ new Set();
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword || seenKeywords.has(normalizedKeyword)) {
      continue;
    }
    seenKeywords.add(normalizedKeyword);
    if (normalizedText.includes(normalizedKeyword)) {
      matchedKeywords.push(normalizedKeyword);
    }
  }
  return matchedKeywords;
}
function matchLabels(issue, config) {
  const issueText = normalizeText(`${issue.title} ${issue.body ?? ""}`);
  const labelsToAdd = [];
  const matchedRules = [];
  const seenLabels = /* @__PURE__ */ new Set();
  for (const [label, rule] of Object.entries(config.labels)) {
    const matchedKeywords = findMatchedKeywords(issueText, rule.include);
    if (matchedKeywords.length === 0) {
      continue;
    }
    if (!seenLabels.has(label)) {
      labelsToAdd.push(label);
      seenLabels.add(label);
    }
    matchedRules.push({
      label,
      matchedKeywords
    });
  }
  if (config.goodFirstIssue?.enabled) {
    const matchedKeywords = findMatchedKeywords(issueText, config.goodFirstIssue.include);
    if (matchedKeywords.length > 0) {
      for (const label of config.goodFirstIssue.labels) {
        if (seenLabels.has(label)) {
          continue;
        }
        labelsToAdd.push(label);
        seenLabels.add(label);
      }
      matchedRules.push({
        label: "goodFirstIssue",
        matchedKeywords
      });
    }
  }
  return {
    labelsToAdd,
    matchedRules
  };
}

// src/core/triage.ts
async function triageIssue(_issue, _config) {
  return matchLabels(_issue, _config);
}

// src/commands/triage.ts
async function loadIssueFromEvent(eventPath) {
  if (!await pathExists(eventPath)) {
    throw new MaintainerAgentError(`Event file not found: ${eventPath}`);
  }
  let rawEvent;
  try {
    rawEvent = await (0, import_fs_extra3.readFile)(eventPath, "utf8");
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read event file: ${eventPath}`, { cause: error });
  }
  let parsedEvent;
  try {
    parsedEvent = JSON.parse(rawEvent);
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in event file: ${eventPath}`, { cause: error });
  }
  const issue = parsedEvent.issue;
  if (!issue || typeof issue.title !== "string") {
    throw new MaintainerAgentError(
      `Event file does not contain a supported issue payload: ${eventPath}`
    );
  }
  return {
    number: typeof issue.number === "number" ? issue.number : void 0,
    title: issue.title,
    body: typeof issue.body === "string" || issue.body === null ? issue.body : void 0,
    labels: normalizeEventLabels(issue.labels)
  };
}
function registerTriageCommand(program, logger) {
  program.command("triage").description("Run rule-based issue triage.").option("-c, --config <path>", "Path to maintainer-agent-kit config file.", ".maintainer-agent.yml").requiredOption("-e, --event <path>", "Path to a GitHub issue event JSON file.").action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const issue = await loadIssueFromEvent(options.event);
      const result = await triageIssue(issue, config);
      printTriageResult(logger, options.event, options.config, issue, result);
    } catch (error) {
      logger.error(toUserMessage(error));
      process.exitCode = 1;
    }
  });
}
function normalizeEventLabels(labels) {
  if (!Array.isArray(labels)) {
    return void 0;
  }
  const normalizedLabels = labels.map((label) => {
    if (typeof label === "string") {
      return label;
    }
    if (label && typeof label === "object" && "name" in label && typeof label.name === "string") {
      return label.name;
    }
    return void 0;
  }).filter((label) => Boolean(label));
  return normalizedLabels.length > 0 ? normalizedLabels : void 0;
}
function printTriageResult(logger, eventPath, configPath, issue, result) {
  logger.success("Triage dry run complete.");
  logger.info(`Event file: ${eventPath}`);
  logger.info(`Config file: ${configPath}`);
  logger.info(`Issue: ${issue.number ? `#${issue.number} ` : ""}${issue.title}`);
  logger.info(
    `Labels to add: ${result.labelsToAdd.length > 0 ? result.labelsToAdd.join(", ") : "none"}`
  );
  if (result.matchedRules.length === 0) {
    logger.info("Matched rules: none");
  } else {
    logger.info("Matched rules:");
    for (const rule of result.matchedRules) {
      logger.info(`- ${rule.label}: ${rule.matchedKeywords.join(", ")}`);
    }
  }
  logger.warn("Dry run only. No GitHub labels were applied.");
}

// src/commands/validate.ts
function registerValidateCommand(program, logger) {
  program.command("validate").description("Validate a maintainer-agent-kit configuration file.").option("-c, --config <path>", "Path to maintainer-agent-kit config file.", ".maintainer-agent.yml").action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const labelNames = Object.keys(config.labels);
      logger.success(`Config is valid: ${options.config}`);
      logger.info(`Labels configured: ${labelNames.join(", ")}`);
      logger.info(
        `Good first issue detection: ${config.goodFirstIssue?.enabled ? "enabled" : "disabled"}`
      );
      if (config.releaseNotes) {
        logger.info(`Release notes title: ${config.releaseNotes.title}`);
      }
    } catch (error) {
      logger.error(toUserMessage(error));
      process.exitCode = 1;
    }
  });
}

// src/utils/logger.ts
var import_chalk = __toESM(require("chalk"));
function createLogger() {
  return {
    banner(message) {
      console.log(import_chalk.default.bold.cyan(message));
    },
    info(message) {
      console.log(import_chalk.default.blue(message));
    },
    success(message) {
      console.log(import_chalk.default.green(message));
    },
    warn(message) {
      console.warn(import_chalk.default.yellow(message));
    },
    error(message) {
      console.error(import_chalk.default.red(message));
    }
  };
}

// src/index.ts
var version = "0.1.0";
function createCli() {
  const logger = createLogger();
  const program = new import_commander.Command();
  program.name("maintainer-agent-kit").alias("mak").description("Zero-backend maintainer automation toolkit.").version(version).hook("preAction", () => {
    logger.banner(`maintainer-agent-kit v${version}`);
  });
  registerValidateCommand(program, logger);
  registerTriageCommand(program, logger);
  registerReleaseNotesCommand(program, logger);
  return program;
}
async function main() {
  const cli = createCli();
  try {
    await cli.parseAsync(process.argv);
  } catch (error) {
    const logger = createLogger();
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    logger.error(message);
    process.exitCode = 1;
  }
}
if (require.main === module) {
  void main();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCli,
  version
});
//# sourceMappingURL=index.js.map