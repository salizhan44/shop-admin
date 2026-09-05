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

export function validateAvatarUrl(avatarUrl: string): string | null {
  if (avatarUrl.length === 0) {
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
