import { z } from 'zod';

const nonEmptyTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, 'Must be a non-empty string.'));

const nonEmptyStringArray = z.array(nonEmptyTrimmedString).min(1, 'Must include at least one value.');

export const labelRuleSchema = z
  .object({
    include: nonEmptyStringArray
  })
  .strict();

export const goodFirstIssueSchema = z
  .object({
    enabled: z.boolean().default(false),
    labels: z.array(nonEmptyTrimmedString).default([]),
    include: z.array(nonEmptyTrimmedString).default([])
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.enabled) {
      return;
    }

    if (value.labels.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['labels'],
        message: 'Must include at least one label when goodFirstIssue is enabled.'
      });
    }

    if (value.include.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['include'],
        message: 'Must include at least one keyword when goodFirstIssue is enabled.'
      });
    }
  });

export const releaseNotesSchema = z
  .object({
    title: nonEmptyTrimmedString.default('Release Notes'),
    groupByLabels: z.record(nonEmptyTrimmedString).default({}),
    includePullRequestLinks: z.boolean().default(true)
  })
  .strict();

export const configSchema = z
  .object({
    labels: z
      .record(labelRuleSchema)
      .refine((labels) => Object.keys(labels).length > 0, 'Must configure at least one label.'),
    goodFirstIssue: goodFirstIssueSchema.optional(),
    releaseNotes: releaseNotesSchema.optional()
  })
  .strict();

export type ConfigSchema = z.infer<typeof configSchema>;
