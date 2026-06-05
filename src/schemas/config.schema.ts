import { z } from 'zod';

export const labelRuleSchema = z.object({
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).optional()
});

export const configSchema = z.object({
  labels: z.record(labelRuleSchema).default({}),
  goodFirstIssue: z
    .object({
      enabled: z.boolean().default(false),
      labels: z.array(z.string()).default([]),
      include: z.array(z.string()).default([])
    })
    .optional(),
  releaseNotes: z
    .object({
      title: z.string().default('Release Notes'),
      groupByLabels: z.record(z.string()).default({}),
      includePullRequestLinks: z.boolean().default(true)
    })
    .optional()
});

export type ConfigSchema = z.infer<typeof configSchema>;
