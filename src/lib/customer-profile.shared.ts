export const AVATAR_URL_MAX_LENGTH = 1_500_000;
export const HOME_ADDRESS_MAX_LENGTH = 500;
export const CUSTOMER_NAME_MAX_LENGTH = 80;
export const CUSTOMER_NAME_MIN_LENGTH = 1;

export type CustomerProfileUpdateBody = {
  name?: string;
  homeAddress?: string;
  /** Пустая строка или null — удалить аватар. */
  avatarUrl?: string | null;
};

export function isCustomerProfileUpdateBody(
  value: unknown,
): value is CustomerProfileUpdateBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const body = value as Record<string, unknown>;
  if ("name" in body && typeof body.name !== "string") {
    return false;
  }
  if (
    "homeAddress" in body &&
    typeof body.homeAddress !== "string"
  ) {
    return false;
  }
  if (
    "avatarUrl" in body &&
    body.avatarUrl !== null &&
    typeof body.avatarUrl !== "string"
  ) {
    return false;
  }
  return (
    "name" in body || "homeAddress" in body || "avatarUrl" in body
  );
}

export function validateCustomerName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < CUSTOMER_NAME_MIN_LENGTH) {
    return "Укажите имя";
  }
  if (trimmed.length > CUSTOMER_NAME_MAX_LENGTH) {
    return `Имя не длиннее ${CUSTOMER_NAME_MAX_LENGTH} символов`;
  }
  return null;
}

export function validateHomeAddress(
  homeAddress: string,
): string | null {
  const trimmed = homeAddress.trim();
  if (trimmed.length > HOME_ADDRESS_MAX_LENGTH) {
    return `Адрес не длиннее ${HOME_ADDRESS_MAX_LENGTH} символов`;
  }
  return null;
}

export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;

export type CustomerPasswordChangeBody = {
  currentPassword: string;
  newPassword: string;
};

export function isCustomerPasswordChangeBody(
  value: unknown,
): value is CustomerPasswordChangeBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.currentPassword === "string" &&
    typeof body.newPassword === "string"
  );
}

export type CustomerCurrentPasswordBody = {
  currentPassword: string;
};

export function isCustomerCurrentPasswordBody(
  value: unknown,
): value is CustomerCurrentPasswordBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.currentPassword === "string";
}

export function resolveCurrentPasswordCheck(input: {
  hasStoredPassword: boolean;
  currentPassword: string;
  currentPasswordMatches: boolean;
}): { ok: true } | { error: string } {
  if (!input.hasStoredPassword) {
    return { error: "Этот аккаунт входит через Google" };
  }
  if (input.currentPassword.length === 0) {
    return { error: "Укажите текущий пароль" };
  }
  if (!input.currentPasswordMatches) {
    return { error: "Неверный текущий пароль" };
  }
  return { ok: true };
}

export function validateNewCustomerPassword(password: string): string | null {
  if (password.length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    return `Пароль не короче ${CUSTOMER_PASSWORD_MIN_LENGTH} символов`;
  }
  return null;
}

export function resolveCustomerPasswordChange(input: {
  hasStoredPassword: boolean;
  currentPassword: string;
  newPassword: string;
  currentPasswordMatches: boolean;
}): { ok: true } | { error: string } {
  if (!input.hasStoredPassword) {
    return { error: "Этот аккаунт входит через Google" };
  }
  if (input.currentPassword.length === 0) {
    return { error: "Укажите текущий пароль" };
  }
  const newError = validateNewCustomerPassword(input.newPassword);
  if (newError) {
    return { error: newError };
  }
  if (input.newPassword === input.currentPassword) {
    return { error: "Новый пароль должен отличаться" };
  }
  if (!input.currentPasswordMatches) {
    return { error: "Неверный текущий пароль" };
  }
  return { ok: true };
}

export function validateAvatarUrl(avatarUrl: string): string | null {
  if (avatarUrl.length === 0) {
    return null;
  }
  if (avatarUrl.startsWith("/uploads/avatars/")) {
    return null;
  }
  if (avatarUrl.length > AVATAR_URL_MAX_LENGTH) {
    return "Файл аватарки слишком большой — выберите фото поменьше";
  }
  if (!avatarUrl.startsWith("data:image/")) {
    return "Нужна картинка";
  }
  return null;
}
