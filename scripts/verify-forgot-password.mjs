import assert from "node:assert/strict";
import { canAccessSupport } from "../src/lib/roles.shared.ts";
import { getDashboardNavItems } from "../src/lib/dashboard-nav.shared.ts";
import {
  filterCustomersBySearch,
  resolveStaffCustomerPasswordReset,
  toCustomerStaffPublic,
} from "../src/lib/customers.shared.ts";
import {
  DEFAULT_SHOP_WHATSAPP,
  forgotPasswordMessage,
  normalizeWhatsAppPhone,
  shopWhatsAppUrl,
} from "../src/lib/forgot-password.shared.ts";

assert.equal(canAccessSupport("OWNER"), true);
assert.equal(canAccessSupport("SUPPORT"), true);
assert.equal(canAccessSupport("WAREHOUSE"), false);
assert.equal(canAccessSupport("ACCOUNTANT"), false);
assert.ok(
  getDashboardNavItems("OWNER").some((item) => item.href === "/dashboard/customers"),
);
assert.ok(
  getDashboardNavItems("SUPPORT").some((item) => item.href === "/dashboard/customers"),
);
assert.ok(
  !getDashboardNavItems("WAREHOUSE").some(
    (item) => item.href === "/dashboard/customers",
  ),
);

assert.equal(
  resolveStaffCustomerPasswordReset({
    hasStoredPassword: false,
    newPassword: "newpass12",
  }).error,
  "Этот аккаунт входит через Google",
);
assert.equal(
  resolveStaffCustomerPasswordReset({
    hasStoredPassword: true,
    newPassword: "short",
  }).error,
  "Пароль не короче 8 символов",
);
assert.deepEqual(
  resolveStaffCustomerPasswordReset({
    hasStoredPassword: true,
    newPassword: "newpass12",
  }),
  { ok: true },
);

const listed = toCustomerStaffPublic({
  id: "c1",
  name: "Айдана",
  email: "aidana@local.test",
  passwordHash: "hash",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});
assert.equal(listed.hasPassword, true);
assert.equal(
  filterCustomersBySearch([listed], "aidana").length,
  1,
);
assert.equal(filterCustomersBySearch([listed], "нет такого").length, 0);

assert.equal(normalizeWhatsAppPhone("+996 555 12-34-56"), "996555123456");
const url = shopWhatsAppUrl(DEFAULT_SHOP_WHATSAPP, forgotPasswordMessage("a@b.c"));
assert.ok(url.startsWith("https://wa.me/996555123456?text="));
assert.ok(url.includes(encodeURIComponent("a@b.c")));

console.log("forgot-password/whatsapp checks ok");
