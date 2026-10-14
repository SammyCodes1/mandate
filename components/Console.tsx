"use client";

import { useState } from "react";
import { Buildings, Eye, Robot, SealCheck } from "@phosphor-icons/react";
import { SiteHeader } from "./SiteHeader";
import {
  blankRecipients,
  bytes32,
  issue,
  openReceipt,
  revoke,
  spend,
  type Mandate,
  type Purse,
  type ReceiptOpening,
} from "../src/policy";

const vendor = bytes32("vendor-a");
const payroll = bytes32("payroll-b");

const demoTerms = {
  perPaymentCap: 100n,
  totalCap: 250n,
  maxPayments: 3n,
  recipients: blankRecipients(vendor, payroll),
};

type Log = { tone: "ok" | "no" | "info"; text: string };

function short(value: string | null): string {
  if (!value) return "empty";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-white/10 py-2.5">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[#b7b1a6]">{label}</dt>
      <dd className="truncate font-mono text-[13px] text-[#f3efe6]">{value}</dd>
    </div>
  );
}

export function Console() {
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [priorPurse, setPriorPurse] = useState<{ purse: Purse; salt: string } | null>(null);
  const [opened, setOpened] = useState<ReceiptOpening | null>(null);
  const [log, setLog] = useState<Log>({
    tone: "info",
    text: "No mandate yet. The public ledger is empty.",
  });

  const ledger = mandate?.ledger;

  function note(tone: Log["tone"], text: string) {
    setLog({ tone, text });
  }

  function onIssue() {
    const next = issue(demoTerms);
    setMandate(next);
    setPriorPurse(null);
    setOpened(null);
    note("ok", "Mandate issued. Caps and recipients stay in the private file. The ledger holds two commitments.");
  }

  function onSpend(amount: bigint, secret?: string) {
    if (!mandate?.file) {
      note("no", "Issue a mandate first.");
      return;
    }
    const before = mandate.ledger.nullifiers.length;
    const snapshot = { purse: { ...mandate.file.purse }, salt: mandate.file.purseSalt };
    try {
      const next = spend(mandate, {
        amount,
        recipient: vendor,
        agentSecret: secret ?? mandate.file.agentSecret,
      });
      setMandate(next);
      setPriorPurse(snapshot);
      note(
        "ok",
        `Spend of ${amount.toString()} accepted. The ledger gained a nullifier and a receipt commitment. The amount is not on it.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spend failed";
      note("no", `${message}. Nullifiers stayed at ${before}.`);
    }
  }

  function onReplay() {
    if (!mandate?.file || !priorPurse) {
      note("no", "Make a payment before replaying it.");
      return;
    }
    const before = mandate.ledger.nullifiers.length;
    try {
      spend(mandate, {
        amount: 80n,
        recipient: vendor,
        agentSecret: mandate.file.agentSecret,
        purse: priorPurse.purse,
        purseSalt: priorPurse.salt,
      });
      note("no", "Replay was accepted. That is a bug.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replay failed";
      note("no", `${message}. Nullifiers stayed at ${before}.`);
    }
  }

  function onRevoke() {
    if (!mandate?.file) {
      note("no", "Issue a mandate first.");
      return;
    }
    try {
      setMandate(revoke(mandate, mandate.file.companySecret));
      note("ok", "Mandate revoked. Later spends cannot land.");
    } catch (error) {
      note("no", error instanceof Error ? error.message : "Revoke failed");
    }
  }

  function onOpen() {
    if (!mandate?.file || mandate.file.receiptSalts.length === 0) {
      note("no", "There is no receipt to open.");
      return;
    }
    const salt = mandate.file.receiptSalts[0]!;
    const opening: ReceiptOpening = { index: 0n, amount: 80n, recipient: vendor, salt };
    try {
      openReceipt(mandate, opening);
      setOpened(opening);
      note("ok", "Receipt 0 opened for the auditor. Later receipts stay closed.");
    } catch (error) {
      note("no", error instanceof Error ? error.message : "Open failed");
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl tracking-tight text-[#f6f1e8] md:text-4xl">Console</h1>
            <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-[#c9c2b6]">
              Issue a mandate, then try a payment that fits, one that does not, a replay, and the wrong agent.
            </p>
          </div>
        </div>

        <p
          className={`mt-6 rounded-lg border px-4 py-3 text-[15px] leading-relaxed ${
            log.tone === "ok"
              ? "border-[#3f6f52] bg-[#1a2a20] text-[#d7ecdf]"
              : log.tone === "no"
                ? "border-[#8a4b3a] bg-[#2a1c18] text-[#f0d2c8]"
                : "border-white/10 bg-[#171512] text-[#e7e1d6]"
          }`}
          role="status"
        >
          {log.text}
        </p>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="grid gap-3">
            <section className="rounded-lg border border-white/10 bg-[#171512] p-4">
              <div className="flex items-center gap-2 text-[#f6f1e8]">
                <Buildings size={18} weight="duotone" />
                <h2 className="text-[15px] font-medium">Company</h2>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-[#c9c2b6]">
                Per payment 100. Total 250. Three payments. Recipients: vendor and payroll.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={onIssue}>
                  Issue mandate
                </button>
                <button type="button" className="btn-ghost" onClick={onRevoke}>
                  Revoke
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#171512] p-4">
              <div className="flex items-center gap-2 text-[#f6f1e8]">
                <Robot size={18} weight="duotone" />
                <h2 className="text-[15px] font-medium">Agent</h2>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-[#c9c2b6]">
                Pays the vendor. A rejected payment does not appear on the ledger.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => onSpend(80n)}>
                  Pay 80
                </button>
                <button type="button" className="btn-ghost" onClick={() => onSpend(150n)}>
                  Pay 150
                </button>
                <button type="button" className="btn-ghost" onClick={onReplay}>
                  Replay
                </button>
                <button type="button" className="btn-ghost" onClick={() => onSpend(20n, "stranger-secret")}>
                  Wrong agent
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#171512] p-4">
              <div className="flex items-center gap-2 text-[#f6f1e8]">
                <Eye size={18} weight="duotone" />
                <h2 className="text-[15px] font-medium">Auditor</h2>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-[#c9c2b6]">
                Opens receipt 0 only, and only when the company has shared that salt.
              </p>
              <button type="button" className="btn-primary mt-4" onClick={onOpen}>
                Open receipt 0
              </button>
              {opened ? (
                <p className="mt-3 font-mono text-[13px] text-[#f6f1e8]">
                  Receipt 0: {opened.amount.toString()} to vendor
                </p>
              ) : (
                <p className="mt-3 text-[13px] text-[#b7b1a6]">No receipt opened.</p>
              )}
            </section>
          </div>

          <section className="rounded-lg border border-white/10 bg-[#12100e] p-5 md:p-6">
            <div className="mb-2 flex items-center gap-2 text-[#f6f1e8]">
              <SealCheck size={18} weight="duotone" />
              <h2 className="text-[15px] font-medium">Public ledger</h2>
            </div>
            <dl>
              <LedgerRow label="Status" value={ledger?.status ?? "ABSENT"} />
              <LedgerRow label="Company key" value={short(ledger?.companyKey ?? null)} />
              <LedgerRow label="Agent key" value={short(ledger?.agentKey ?? null)} />
              <LedgerRow label="Terms" value={short(ledger?.termsCommitment ?? null)} />
              <LedgerRow label="Purse" value={short(ledger?.purseCommitment ?? null)} />
              <LedgerRow label="Nullifiers" value={String(ledger?.nullifiers.length ?? 0)} />
              <LedgerRow label="Receipts" value={String(ledger?.receiptCount ?? 0n)} />
            </dl>
            <p className="mt-4 text-[13px] leading-relaxed text-[#b7b1a6]">
              Local rules and a stand-in commitment. The Compact contract is compiled with toolchain 0.31.1 in GitHub Actions. This screen is not a Midnight proof.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
