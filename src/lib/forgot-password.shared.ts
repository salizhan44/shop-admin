/** Номер WhatsApp магазина без +, только цифры. Можно переопределить env. */
export const DEFAULT_SHOP_WHATSAPP = "996555123456";

export const FORGOT_PASSWORD_WHATSAPP_TEXT =
  "Здравствуйте! Не могу войти в приложение магазина.";

export function normalizeWhatsAppPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function forgotPasswordMessage(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) {
    return FORGOT_PASSWORD_WHATSAPP_TEXT;
  }
  return `${FORGOT_PASSWORD_WHATSAPP_TEXT} Мой email: ${trimmed}`;
}

export function shopWhatsAppUrl(phoneRaw: string, text: string): string {
  const phone = normalizeWhatsAppPhone(phoneRaw);
  const query = encodeURIComponent(text);
  if (!phone) {
    return `https://wa.me/?text=${query}`;
  }
  return `https://wa.me/${phone}?text=${query}`;
}
