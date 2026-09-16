import assert from "node:assert/strict";
import { supportImageFileName } from "../src/lib/support.shared.ts";

assert.equal(
  supportImageFileName("/uploads/support/ticket-0.jpg?v=1"),
  "ticket-0.jpg",
);
assert.equal(supportImageFileName("/uploads/support/ticket-0.jpg"), "ticket-0.jpg");
assert.equal(supportImageFileName("/uploads/products/x.png"), null);
assert.equal(supportImageFileName("/uploads/support/../secret.jpg"), null);
assert.equal(supportImageFileName("/uploads/support/a/b.jpg"), null);

console.log("delete-account checks ok");
