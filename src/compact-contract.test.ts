import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const compiled = existsSync("contract/managed/mandate/contract/index.js");

// These run after `npm run compile` on Compact toolchain 0.31.1.
// Until that output exists, the suite is skipped and src/policy.test.ts
// covers the same four cases against the local rule mirror.
describe.skipIf(!compiled)("compiled mandate contract", () => {
  it("loads the generated module", async () => {
    const compiledContract = await import("../contract/managed/mandate/contract/index.js");
    expect(compiledContract.Contract).toBeTypeOf("function");
    expect(compiledContract.ledger).toBeTypeOf("function");
  });
});
