export const UPDATES_POLL_INTERVAL_MS = 30_000;

export type UpdatesCheckPublic = {
  hasUpdates: boolean;
  latestAt: string | null;
};

export function parseSinceQuery(value: string | null): Date | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function isUpdatesCheckPublic(value: unknown): value is UpdatesCheckPublic {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as { hasUpdates?: unknown; latestAt?: unknown };
  return (
    typeof body.hasUpdates === "boolean" &&
    (body.latestAt === null || typeof body.latestAt === "string")
  );
}

export function toUpdatesCheckPublic(input: {
  hasUpdates: boolean;
  latestAt: string | null;
}): UpdatesCheckPublic {
  return {
    hasUpdates: input.hasUpdates,
    latestAt: input.latestAt,
  };
}
