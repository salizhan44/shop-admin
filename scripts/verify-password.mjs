import assert from "node:assert/strict";
import { customerHasPassword } from "../src/lib/auth.shared.ts";
import {
  isCustomerCurrentPasswordBody,
  isCustomerPasswordChangeBody,
  resolveCurrentPasswordCheck,
  resolveCustomerPasswordChange,
  validateNewCustomerPassword,
} from "../src/lib/customer-profile.shared.ts";

assert.equal(customerHasPassword(null), false);
assert.equal(customerHasPassword(""), false);
assert.equal(customerHasPassword("hash"), true);

assert.equal(isCustomerPasswordChangeBody(null), false);
assert.equal(
  isCustomerPasswordChangeBody({ currentPassword: "oldpass12", newPassword: "newpass12" }),
  true,
);

assert.equal(validateNewCustomerPassword("short"), "Пароль не короче 8 символов");
assert.equal(validateNewCustomerPassword("longenough"), null);

assert.equal(
  resolveCustomerPasswordChange({
    hasStoredPassword: false,
    currentPassword: "anything",
    newPassword: "newpass12",
    currentPasswordMatches: false,
  }).error,
  "Этот аккаунт входит через Google",
);

assert.equal(
  resolveCustomerPasswordChange({
    hasStoredPassword: true,
    currentPassword: "",
    newPassword: "newpass12",
    currentPasswordMatches: false,
  }).error,
  "Укажите текущий пароль",
);

assert.equal(
  resolveCustomerPasswordChange({
    hasStoredPassword: true,
    currentPassword: "oldpass12",
    newPassword: "oldpass12",
    currentPasswordMatches: true,
  }).error,
  "Новый пароль должен отличаться",
);

assert.equal(
  resolveCustomerPasswordChange({
    hasStoredPassword: true,
    currentPassword: "oldpass12",
    newPassword: "newpass12",
    currentPasswordMatches: false,
  }).error,
  "Неверный текущий пароль",
);

assert.deepEqual(
  resolveCustomerPasswordChange({
    hasStoredPassword: true,
    currentPassword: "oldpass12",
    newPassword: "newpass12",
    currentPasswordMatches: true,
  }),
  { ok: true },
);

assert.equal(isCustomerCurrentPasswordBody({ currentPassword: "oldpass12" }), true);
assert.equal(
  resolveCurrentPasswordCheck({
    hasStoredPassword: false,
    currentPassword: "x",
    currentPasswordMatches: false,
  }).error,
  "Этот аккаунт входит через Google",
);
assert.equal(
  resolveCurrentPasswordCheck({
    hasStoredPassword: true,
    currentPassword: "oldpass12",
    currentPasswordMatches: false,
  }).error,
  "Неверный текущий пароль",
);
assert.deepEqual(
  resolveCurrentPasswordCheck({
    hasStoredPassword: true,
    currentPassword: "oldpass12",
    currentPasswordMatches: true,
  }),
  { ok: true },
);

console.log("password change invariants ok");
