export const BLUEINK_STATUSES = [
  "dr",
  "se",
  "st",
  "co",
  "ca",
  "ex",
  "fa",
] as const;

export type BlueinkStatus = (typeof BLUEINK_STATUSES)[number];

export const DOMAIN_STATUSES = [
  "draft",
  "sent",
  "in_progress",
  "signed",
  "cancelled",
  "expired",
  "failed",
  "declined",
] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

const BLUEINK_TO_DOMAIN: Record<BlueinkStatus, DomainStatus> = {
  dr: "draft",
  se: "sent",
  st: "in_progress",
  co: "signed",
  ca: "cancelled",
  ex: "expired",
  fa: "failed",
};

const DOMAIN_TO_BLUEINK: Record<DomainStatus, BlueinkStatus | null> = {
  draft: "dr",
  sent: "se",
  in_progress: "st",
  signed: "co",
  cancelled: "ca",
  expired: "ex",
  failed: "fa",
  declined: null,
};

export function mapBlueinkToDomain(status: string): DomainStatus {
  const mapped = BLUEINK_TO_DOMAIN[status as BlueinkStatus];
  return mapped ?? "sent";
}

export function mapDomainToBlueink(status: DomainStatus): BlueinkStatus | null {
  return DOMAIN_TO_BLUEINK[status];
}

export const WEBHOOK_EVENT_STATUS_MAP: Record<string, DomainStatus> = {
  bundle_sent: "sent",
  packet_viewed: "in_progress",
  packet_complete: "in_progress",
  bundle_complete: "signed",
  bundle_cancelled: "cancelled",
  bundle_error: "failed",
  packet_declined: "declined",
};
