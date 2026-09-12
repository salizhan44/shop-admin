export const STAFF_PRESENCE_STATUSES = [
  "online",
  "offline",
  "lunch",
] as const;

export type StaffPresenceStatus = (typeof STAFF_PRESENCE_STATUSES)[number];

export type StaffPresenceOption = {
  value: StaffPresenceStatus;
  label: string;
};

export const STAFF_PRESENCE_OPTIONS: readonly StaffPresenceOption[] = [
  { value: "online", label: "Онлайн" },
  { value: "offline", label: "Офлайн" },
  { value: "lunch", label: "На обеде" },
];

export const DEFAULT_STAFF_PRESENCE: StaffPresenceStatus = "online";

export function isStaffPresenceStatus(
  value: unknown,
): value is StaffPresenceStatus {
  return (
    typeof value === "string" &&
    (STAFF_PRESENCE_STATUSES as readonly string[]).includes(value)
  );
}

export function parseStaffPresenceStatus(
  value: unknown,
): StaffPresenceStatus {
  return isStaffPresenceStatus(value) ? value : DEFAULT_STAFF_PRESENCE;
}

export function staffPresenceLabel(status: StaffPresenceStatus): string {
  switch (status) {
    case "online":
      return "Онлайн";
    case "offline":
      return "Офлайн";
    case "lunch":
      return "На обеде";
  }
}

export function staffPresenceStorageKey(email: string): string {
  return `staff-presence:${email.trim().toLowerCase()}`;
}

export type StaffDirectoryPresence = "online" | "offline";

export function staffDirectoryPresence(
  email: string,
  stored?: string | null,
): StaffDirectoryPresence {
  if (stored === "online") {
    return "online";
  }
  if (stored === "offline" || stored === "lunch") {
    return "offline";
  }
  let sum = 0;
  const key = email.trim().toLowerCase();
  for (let index = 0; index < key.length; index += 1) {
    sum += key.charCodeAt(index);
  }
  return sum % 2 === 0 ? "online" : "offline";
}

export function staffDirectoryPresenceLabel(
  status: StaffDirectoryPresence,
): string {
  return status === "online" ? "Онлайн" : "Офлайн";
}

export function staffInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    const first = parts[0] ?? "";
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
}
