// Local mirror of contract/mandate.compact.
//
// The rules match the circuit asserts. The hash is SHA-256, not Midnight's
// persistentCommit. The console uses this so a judge can click the four
// cases before the Compact toolchain is installed. It is not a proof.

export type Status = "ABSENT" | "ACTIVE" | "REVOKED";

export interface Terms {
  perPaymentCap: bigint;
  totalCap: bigint;
  maxPayments: bigint;
  recipients: [string, string, string, string];
}

export interface Purse {
  spent: bigint;
  payments: bigint;
}

export interface ReceiptOpening {
  index: bigint;
  amount: bigint;
  recipient: string;
  salt: string;
}

export interface PublicLedger {
  status: Status;
  companyKey: string | null;
  agentKey: string | null;
  termsCommitment: string | null;
  purseCommitment: string | null;
  nullifiers: string[];
  receipts: { index: bigint; commitment: string }[];
  receiptCount: bigint;
}

export interface MandateFile {
  terms: Terms;
  termsSalt: string;
  purse: Purse;
  purseSalt: string;
  receiptSalts: string[];
  companySecret: string;
  agentSecret: string;
}

export interface Mandate {
  ledger: PublicLedger;
  file: MandateFile | null;
}

const SAFE_TOTAL = 9223372036854775808n;
const EMPTY = "00".repeat(32);

// Demo commitment. Not Midnight persistentCommit. Same inputs, same output,
// so the console can show the privacy boundary without the proof server.
function mix(text: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function commit(label: string, payload: string): string {
  const text = `${label}|${payload}`;
  return [0x811c9dc5, 0x1b873593, 0x85ebca6b, 0xc2b2ae35]
    .map((seed) => mix(text, seed).toString(16).padStart(8, "0"))
    .join("");
}

export function bytes32(label: string): string {
  return commit("mandate:bytes", label);
}

export function freshSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function companyKey(secret: string): string {
  return commit("mandate:company", secret);
}

export function agentKey(secret: string): string {
  return commit("mandate:agent", secret);
}

function termsCommitment(terms: Terms, salt: string): string {
  const body = [
    terms.perPaymentCap.toString(),
    terms.totalCap.toString(),
    terms.maxPayments.toString(),
    ...terms.recipients,
  ].join(",");
  return commit("mandate:terms", `${body}|${salt}`);
}

function purseCommitment(purse: Purse, salt: string): string {
  return commit("mandate:purse", `${purse.spent}|${purse.payments}|${salt}`);
}

function receiptCommitment(amount: bigint, recipient: string, salt: string): string {
  return commit("mandate:receipt", `${amount}|${recipient}|${salt}`);
}

function nullifier(index: bigint): string {
  return commit("mandate:nullifier", index.toString());
}

export function emptyLedger(): PublicLedger {
  return {
    status: "ABSENT",
    companyKey: null,
    agentKey: null,
    termsCommitment: null,
    purseCommitment: null,
    nullifiers: [],
    receipts: [],
    receiptCount: 0n,
  };
}

export function issue(terms: Terms, companySecret = freshSalt(), agentSecret = freshSalt()): Mandate {
  if (terms.perPaymentCap <= 0n) throw new Error("Per-payment cap must be positive");
  if (terms.totalCap < terms.perPaymentCap) throw new Error("Total cap is below the per-payment cap");
  if (terms.maxPayments <= 0n) throw new Error("Payment allowance must be positive");
  if (terms.totalCap >= SAFE_TOTAL) throw new Error("Total cap is outside the safe range");
  if (terms.recipients.length !== 4) throw new Error("Mandate allows four recipient slots");

  const termsSalt = freshSalt();
  const purseSalt = freshSalt();
  const purse: Purse = { spent: 0n, payments: 0n };

  return {
    file: {
      terms,
      termsSalt,
      purse,
      purseSalt,
      receiptSalts: [],
      companySecret,
      agentSecret,
    },
    ledger: {
      status: "ACTIVE",
      companyKey: companyKey(companySecret),
      agentKey: agentKey(agentSecret),
      termsCommitment: termsCommitment(terms, termsSalt),
      purseCommitment: purseCommitment(purse, purseSalt),
      nullifiers: [],
      receipts: [],
      receiptCount: 0n,
    },
  };
}

export interface SpendInput {
  amount: bigint;
  recipient: string;
  agentSecret: string;
  // Replaying a spend means presenting the purse from before that spend.
  purse?: Purse;
  purseSalt?: string;
  nextPurseSalt?: string;
  receiptSalt?: string;
}

export function spend(mandate: Mandate, input: SpendInput): Mandate {
  const { ledger, file } = mandate;
  if (!file) throw new Error("Mandate is not active");
  if (ledger.status !== "ACTIVE") throw new Error("Mandate is not active");
  if (ledger.agentKey !== agentKey(input.agentSecret)) throw new Error("Wrong agent");

  const purse = input.purse ?? file.purse;
  const purseSalt = input.purseSalt ?? file.purseSalt;
  if (ledger.termsCommitment !== termsCommitment(file.terms, file.termsSalt)) {
    throw new Error("Terms do not match the mandate");
  }
  if (ledger.purseCommitment !== purseCommitment(purse, purseSalt)) {
    throw new Error("Purse does not match the mandate");
  }
  if (purse.payments !== ledger.receiptCount) {
    throw new Error("Purse count does not match the public sequence");
  }

  if (input.amount <= 0n) throw new Error("Amount must be positive");
  if (input.amount > file.terms.perPaymentCap) throw new Error("Payment exceeds the per-payment cap");
  if (purse.spent > file.terms.totalCap) throw new Error("Purse is already over the mandate");
  if (purse.spent + input.amount > file.terms.totalCap) throw new Error("Payment exceeds the mandate total");
  if (purse.payments >= file.terms.maxPayments) throw new Error("Mandate payment count is exhausted");
  if (input.recipient === EMPTY) throw new Error("Recipient is empty");
  if (!file.terms.recipients.includes(input.recipient)) {
    throw new Error("Recipient is outside the mandate");
  }

  const tag = nullifier(purse.payments);
  if (ledger.nullifiers.includes(tag)) throw new Error("Spend was already used");

  const nextPurse: Purse = {
    spent: purse.spent + input.amount,
    payments: purse.payments + 1n,
  };
  const nextPurseSalt = input.nextPurseSalt ?? freshSalt();
  const receiptSalt = input.receiptSalt ?? freshSalt();

  return {
    file: {
      ...file,
      purse: nextPurse,
      purseSalt: nextPurseSalt,
      receiptSalts: [...file.receiptSalts, receiptSalt],
    },
    ledger: {
      ...ledger,
      purseCommitment: purseCommitment(nextPurse, nextPurseSalt),
      nullifiers: [...ledger.nullifiers, tag],
      receipts: [
        ...ledger.receipts,
        { index: purse.payments, commitment: receiptCommitment(input.amount, input.recipient, receiptSalt) },
      ],
      receiptCount: ledger.receiptCount + 1n,
    },
  };
}

export function revoke(mandate: Mandate, companySecret: string): Mandate {
  if (mandate.ledger.status !== "ACTIVE" || !mandate.file) throw new Error("Mandate is not active");
  if (mandate.ledger.companyKey !== companyKey(companySecret)) throw new Error("Wrong company");
  return {
    file: mandate.file,
    ledger: { ...mandate.ledger, status: "REVOKED" },
  };
}

export function openReceipt(mandate: Mandate, opening: ReceiptOpening): { amount: bigint; recipient: string } {
  const row = mandate.ledger.receipts.find((item) => item.index === opening.index);
  if (!row) throw new Error("No such receipt");
  const expected = receiptCommitment(opening.amount, opening.recipient, opening.salt);
  if (row.commitment !== expected) throw new Error("Receipt does not match");
  return { amount: opening.amount, recipient: opening.recipient };
}

export function blankRecipients(first: string, second: string): [string, string, string, string] {
  return [first, second, EMPTY, EMPTY];
}

export { EMPTY as EMPTY_RECIPIENT };
