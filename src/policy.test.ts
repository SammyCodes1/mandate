import { describe, expect, it } from "vitest";
import {
  agentKey,
  blankRecipients,
  bytes32,
  emptyLedger,
  freshSalt,
  issue,
  openReceipt,
  revoke,
  spend,
  type Mandate,
  type Purse,
} from "./policy";

const vendor = bytes32("vendor-a");
const payroll = bytes32("payroll-b");
const outsider = bytes32("outsider");

function issued(): Mandate {
  return issue({
    perPaymentCap: 100n,
    totalCap: 250n,
    maxPayments: 3n,
    recipients: blankRecipients(vendor, payroll),
  });
}

function pay(mandate: Mandate, amount: bigint, recipient = vendor, secret?: string): Mandate {
  return spend(mandate, {
    amount,
    recipient,
    agentSecret: secret ?? mandate.file!.agentSecret,
  });
}

describe("mandate policy", () => {
  it("starts with no public amounts", () => {
    const mandate = issued();
    expect(mandate.ledger.status).toBe("ACTIVE");
    expect(mandate.ledger.receipts).toEqual([]);
    expect(mandate.ledger.nullifiers).toEqual([]);
    expect(mandate.ledger.termsCommitment).not.toBe(mandate.file!.terms.perPaymentCap.toString());
    expect(emptyLedger().status).toBe("ABSENT");
  });

  it("accepts a payment under the cap and publishes only a commitment", () => {
    const mandate = pay(issued(), 80n);
    expect(mandate.ledger.receiptCount).toBe(1n);
    expect(mandate.ledger.receipts).toHaveLength(1);
    expect(mandate.ledger.receipts[0]).toEqual({
      index: 0n,
      commitment: expect.any(String),
    });
    expect(mandate.ledger.nullifiers).toHaveLength(1);
    expect(mandate.file!.purse).toEqual({ spent: 80n, payments: 1n });
    expect(mandate.ledger.receipts[0]!.commitment).not.toBe(vendor);
    expect(mandate.ledger.nullifiers[0]).not.toBe(vendor);
  });

  it("rejects a payment over the per-payment cap and leaves the ledger unchanged", () => {
    const before = issued();
    expect(() => pay(before, 150n)).toThrow("Payment exceeds the per-payment cap");
    expect(before.ledger.receiptCount).toBe(0n);
    expect(before.ledger.nullifiers).toEqual([]);
  });

  it("rejects a replay of the same purse opening", () => {
    const first = issued();
    const purse: Purse = { ...first.file!.purse };
    const purseSalt = first.file!.purseSalt;
    const once = spend(first, {
      amount: 40n,
      recipient: vendor,
      agentSecret: first.file!.agentSecret,
      nextPurseSalt: freshSalt(),
      receiptSalt: freshSalt(),
    });
    expect(() =>
      spend(once, {
        amount: 40n,
        recipient: vendor,
        agentSecret: once.file!.agentSecret,
        purse,
        purseSalt,
      }),
    ).toThrow("Purse does not match the mandate");
  });

  it("rejects a spend from the wrong agent", () => {
    const mandate = issued();
    expect(agentKey("stranger-secret") === mandate.ledger.agentKey).toBe(false);
    expect(() => pay(mandate, 20n, vendor, "stranger-secret")).toThrow("Wrong agent");
    expect(mandate.ledger.nullifiers).toEqual([]);
  });

  it("rejects a later payment that would break the total", () => {
    const twice = pay(pay(issued(), 100n), 100n);
    expect(twice.file!.purse.spent).toBe(200n);
    expect(() => pay(twice, 80n)).toThrow("Payment exceeds the mandate total");
    expect(twice.ledger.receiptCount).toBe(2n);
  });

  it("rejects a recipient outside the mandate", () => {
    expect(() => pay(issued(), 10n, outsider)).toThrow("Recipient is outside the mandate");
  });

  it("lets an auditor open one receipt and not a made-up one", () => {
    const mandate = pay(issued(), 80n);
    const salt = mandate.file!.receiptSalts[0]!;
    expect(openReceipt(mandate, { index: 0n, amount: 80n, recipient: vendor, salt })).toEqual({
      amount: 80n,
      recipient: vendor,
    });
    expect(() =>
      openReceipt(mandate, { index: 0n, amount: 81n, recipient: vendor, salt }),
    ).toThrow("Receipt does not match");
    expect(() =>
      openReceipt(mandate, { index: 1n, amount: 80n, recipient: vendor, salt }),
    ).toThrow("No such receipt");
  });

  it("stops spending after the company revokes", () => {
    const mandate = issued();
    const closed = revoke(mandate, mandate.file!.companySecret);
    expect(closed.ledger.status).toBe("REVOKED");
    expect(() => pay(closed, 10n)).toThrow("Mandate is not active");
    expect(() => revoke(closed, closed.file!.companySecret)).toThrow("Mandate is not active");
  });

  it("rejects a company secret that does not match", () => {
    expect(() => revoke(issued(), "not-the-company")).toThrow("Wrong company");
  });
});
