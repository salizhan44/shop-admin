export const SESSION_PING_SECONDS_MIN = 1;
export const SESSION_PING_SECONDS_MAX = 180;

export type SessionPingBody = {
  seconds: number;
};

export function isSessionPingBody(value: unknown): value is SessionPingBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.seconds === "number" &&
    Number.isInteger(body.seconds) &&
    body.seconds >= SESSION_PING_SECONDS_MIN &&
    body.seconds <= SESSION_PING_SECONDS_MAX
  );
}

export function averageAppSeconds(totals: readonly number[]): number {
  if (totals.length === 0) {
    return 0;
  }
  const sum = totals.reduce((acc, value) => acc + Math.max(0, value), 0);
  return Math.round(sum / totals.length);
}

export function formatAppDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (restMinutes === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${restMinutes} мин`;
}
