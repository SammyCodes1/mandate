// Witnesses the Compact compiler expects after `npm run compile`.
// Each function returns the private state unchanged and the value the circuit asked for.
// The secret, the caps, and the salts never leave this object.

export type Bytes32 = Uint8Array;

export interface Terms {
  perPaymentCap: bigint;
  totalCap: bigint;
  maxPayments: bigint;
  recipients: [Bytes32, Bytes32, Bytes32, Bytes32];
}

export interface Purse {
  spent: bigint;
  payments: bigint;
}

export interface CreateOpening {
  terms: Terms;
  termsSalt: Bytes32;
  purseSalt: Bytes32;
}

export interface SpendOpening {
  terms: Terms;
  termsSalt: Bytes32;
  purse: Purse;
  purseSalt: Bytes32;
  nextPurseSalt: Bytes32;
  receiptSalt: Bytes32;
}

export interface MandatePrivateState {
  companySecret: Bytes32;
  agentSecret: Bytes32;
  createOpening: CreateOpening;
  spendOpening: SpendOpening;
}

export const witnesses = {
  companySecret: ({ privateState }: { privateState: MandatePrivateState }) =>
    [privateState, privateState.companySecret] as const,
  agentSecret: ({ privateState }: { privateState: MandatePrivateState }) =>
    [privateState, privateState.agentSecret] as const,
  createOpening: ({ privateState }: { privateState: MandatePrivateState }) =>
    [privateState, privateState.createOpening] as const,
  spendOpening: ({ privateState }: { privateState: MandatePrivateState }) =>
    [privateState, privateState.spendOpening] as const,
};
