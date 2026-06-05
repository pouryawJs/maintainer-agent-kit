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

// src/action.ts
var action_exports = {};
__export(action_exports, {
  runAction: () => runAction
});
module.exports = __toCommonJS(action_exports);
var core = __toESM(require("@actions/core"));
var github2 = __toESM(require("@actions/github"));

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
}).strict().superRefine((value, context2) => {
  if (!value.enabled) {
    return;
  }
  if (value.labels.length === 0) {
    context2.addIssue({
      code: import_zod.z.ZodIssueCode.custom,
      path: ["labels"],
      message: "Must include at least one label when goodFirstIssue is enabled."
    });
  }
  if (value.include.length === 0) {
    context2.addIssue({
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

// src/github/context.ts
function getIssueContext({
  githubContext,
  payload,
  issueNumber
}) {
  const owner = githubContext.repo?.owner;
  const repo = githubContext.repo?.repo;
  const resolvedIssueNumber = issueNumber ?? getPayloadIssueNumber(payload);
  if (!owner || !repo) {
    throw new MaintainerAgentError("Unable to determine GitHub repository owner and name.");
  }
  if (typeof resolvedIssueNumber !== "number") {
    throw new MaintainerAgentError("Unable to determine GitHub issue number.");
  }
  return {
    owner,
    repo,
    issueNumber: resolvedIssueNumber
  };
}
function getPayloadIssueNumber(payload) {
  if (!payload || typeof payload !== "object") {
    return void 0;
  }
  const issue = payload.issue;
  return typeof issue?.number === "number" ? issue.number : void 0;
}

// src/github/event.ts
async function readGitHubEventPayload(eventPath) {
  if (!await pathExists(eventPath)) {
    throw new MaintainerAgentError(`GitHub event file not found: ${eventPath}`);
  }
  let rawPayload;
  try {
    rawPayload = await readTextFile(eventPath);
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read GitHub event file: ${eventPath}`, {
      cause: error
    });
  }
  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in GitHub event file: ${eventPath}`, {
      cause: error
    });
  }
}
function getIssueFromEventPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const issue = payload.issue;
  if (!issue || typeof issue.number !== "number" || typeof issue.title !== "string") {
    return null;
  }
  return {
    number: issue.number,
    title: issue.title,
    body: typeof issue.body === "string" || issue.body === null ? issue.body : void 0,
    labels: normalizeIssueLabels(issue.labels)
  };
}
function normalizeIssueLabels(labels) {
  if (!Array.isArray(labels)) {
    return void 0;
  }
  const labelNames = labels.map((label) => {
    if (typeof label === "string") {
      return label;
    }
    if (label && typeof label === "object" && "name" in label && typeof label.name === "string") {
      return label.name;
    }
    return void 0;
  }).filter((label) => Boolean(label));
  return labelNames.length > 0 ? labelNames : void 0;
}

// src/github/labels.ts
var github = __toESM(require("@actions/github"));
async function addLabelsToIssue({
  token,
  owner,
  repo,
  issueNumber,
  labels
}) {
  if (labels.length === 0) {
    return;
  }
  const octokit = github.getOctokit(token);
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels
  });
}

// src/action.ts
async function runAction(deps = {}) {
  const getInput2 = deps.getInput ?? core.getInput;
  const setFailed2 = deps.setFailed ?? core.setFailed;
  const info2 = deps.info ?? core.info;
  const labelApplier = deps.addLabelsToIssue ?? addLabelsToIssue;
  const githubContext = deps.githubContext ?? github2.context;
  const env = deps.env ?? process.env;
  try {
    info2("maintainer-agent-kit v0.1.0");
    const inputs = getActionInputs(getInput2);
    if (inputs.mode !== "triage") {
      throw new MaintainerAgentError(
        `Unsupported mode: ${inputs.mode}. MVP supports only triage.`
      );
    }
    const eventPath = env.GITHUB_EVENT_PATH;
    if (!eventPath) {
      throw new MaintainerAgentError("GITHUB_EVENT_PATH is required.");
    }
    const config = await loadConfig(inputs.configPath);
    const payload = await readGitHubEventPayload(eventPath);
    const issue = getIssueFromEventPayload(payload);
    if (!issue) {
      info2("No supported issue payload found. Nothing to triage.");
      return;
    }
    const result = await triageIssue(issue, config);
    printTriageSummary(info2, issue.number, issue.title, result);
    if (result.labelsToAdd.length === 0) {
      info2("No labels are needed.");
      return;
    }
    if (inputs.dryRun) {
      info2("Dry run enabled. No GitHub labels were applied.");
      return;
    }
    const token = env.GITHUB_TOKEN;
    if (!token) {
      throw new MaintainerAgentError("GITHUB_TOKEN is required when dry-run is false.");
    }
    const issueContext = getIssueContext({
      githubContext,
      payload,
      issueNumber: issue.number
    });
    await labelApplier({
      token,
      owner: issueContext.owner,
      repo: issueContext.repo,
      issueNumber: issueContext.issueNumber,
      labels: result.labelsToAdd
    });
    info2(`Applied labels: ${result.labelsToAdd.join(", ")}`);
  } catch (error) {
    setFailed2(toUserMessage(error));
  }
}
function getActionInputs(getInput2) {
  return {
    configPath: getInput2("config") || ".maintainer-agent.yml",
    mode: getInput2("mode") || "triage",
    dryRun: parseBooleanInput(getInput2("dry-run") || "false")
  };
}
function parseBooleanInput(value) {
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}
function printTriageSummary(info2, issueNumber, issueTitle, result) {
  info2(`Issue: ${issueNumber ? `#${issueNumber} ` : ""}${issueTitle}`);
  info2(
    `Labels to add: ${result.labelsToAdd.length > 0 ? result.labelsToAdd.join(", ") : "none"}`
  );
  if (result.matchedRules.length === 0) {
    info2("Matched rules: none");
    return;
  }
  info2("Matched rules:");
  for (const rule of result.matchedRules) {
    info2(`- ${rule.label}: ${rule.matchedKeywords.join(", ")}`);
  }
}
if (require.main === module) {
  void runAction();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runAction
});
//# sourceMappingURL=action.js.map