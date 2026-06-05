import { z } from "zod";

export const signerSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  order: z.number().int().min(0).optional(),
});

export const sendContractSchema = z.object({
  templateId: z.string().uuid(),
  signers: z.array(signerSchema).min(1),
  fields: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  metadata: z.record(z.unknown()).optional(),
  matchId: z.string().optional(),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  label: z.string().optional(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
  send: z.boolean().default(true),
  isTest: z.boolean().default(false),
});

export type SendContractInput = z.infer<typeof sendContractSchema>;

export const listContractsQuerySchema = z.object({
  templateId: z.string().uuid().optional(),
  status: z
    .enum([
      "draft",
      "sent",
      "in_progress",
      "signed",
      "cancelled",
      "expired",
      "failed",
      "declined",
    ])
    .optional(),
  matchId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;

export const blueinkWebhookSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  event_date: z.string(),
  account_id: z.string().optional(),
  payload: z
    .object({
      bundle_id: z.string().optional(),
      packet_id: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type BlueinkWebhookPayload = z.infer<typeof blueinkWebhookSchema>;
