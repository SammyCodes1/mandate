// Mutable session the witnesses read. The chain stores commitments, not this object.
// Swapping a field here is how the tests present a stale purse or the wrong agent.

export type Purse = { spent: bigint; payments: bigint };

export type Terms = {
  perPaymentCap: bigint;
  totalCap: bigint;
  maxPayments: bigint;
  recipients: Uint8Array[];
};

export type Session = {
  companySecret: Uint8Array;
  agentSecret: Uint8Array;
  terms: Terms;
  termsSalt: Uint8Array;
  purse: Purse;
  purseSalt: Uint8Array;
  createdPurseSalt: Uint8Array;
  nextPurseSalt: Uint8Array;
  receiptSalt: Uint8Array;
  lastReceiptSalt: Uint8Array;
};

type PrivateState = { note: string };

function salt(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

function labeled(fill: number): Uint8Array {
  return new Uint8Array(32).fill(fill);
}

export const vendor = labeled(0x11);
export const payroll = labeled(0x22);
export const emptyRecipient = new Uint8Array(32);

export function createSession(): Session {
  const purseSalt = salt();
  const receiptSalt = salt();
  return {
    companySecret: salt(),
    agentSecret: salt(),
    terms: {
      perPaymentCap: 100n,
      totalCap: 250n,
      maxPayments: 3n,
      recipients: [vendor, payroll, emptyRecipient, emptyRecipient],
    },
    termsSalt: salt(),
    purse: { spent: 0n, payments: 0n },
    purseSalt,
    createdPurseSalt: purseSalt,
    nextPurseSalt: salt(),
    receiptSalt,
    lastReceiptSalt: receiptSalt,
  };
}

export function witnessesFor(session: Session) {
  return {
    companySecret: ({ privateState }: { privateState: PrivateState }) =>
      [privateState, session.companySecret] as [PrivateState, Uint8Array],
    agentSecret: ({ privateState }: { privateState: PrivateState }) =>
      [privateState, session.agentSecret] as [PrivateState, Uint8Array],
    createOpening: ({ privateState }: { privateState: PrivateState }) =>
      [
        privateState,
        {
          terms: session.terms,
          termsSalt: session.termsSalt,
          purseSalt: session.purseSalt,
        },
      ] as const,
    spendOpening: ({ privateState }: { privateState: PrivateState }) =>
      [
        privateState,
        {
          terms: session.terms,
          termsSalt: session.termsSalt,
          purse: session.purse,
          purseSalt: session.purseSalt,
          nextPurseSalt: session.nextPurseSalt,
          receiptSalt: session.receiptSalt,
        },
      ] as const,
  };
}

export const initialPrivateState: PrivateState = {
  note: "witnesses read the live session",
};

export function advancePurse(session: Session, amount: bigint) {
  session.lastReceiptSalt = session.receiptSalt;
  session.purse = {
    spent: session.purse.spent + amount,
    payments: session.purse.payments + 1n,
  };
  session.purseSalt = session.nextPurseSalt;
  session.nextPurseSalt = salt();
  session.receiptSalt = salt();
}

export function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}
