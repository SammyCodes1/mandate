import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./SiteHeader";

const ADDRESS = "6eb77a70044e4992e0b55c56285b49b4711455e75067132851da8d4d237d1beb";
const RUN = "https://github.com/SammyCodes1/mandate/actions/runs/38522751539";

const publicLines = ["Company key and agent key", "Terms commitment and purse commitment", "A nullifier for each accepted payment"];
const privateLines = ["Payment amount", "Recipient", "What is left of the budget"];

const roles = [
  {
    title: "Company",
    body: "Commits to a per-payment cap, a total, a payment count, and four recipient slots.",
  },
  {
    title: "Agent",
    body: "Proves a payment fits. A rejected payment writes nothing.",
  },
  {
    title: "Auditor",
    body: "Opens one receipt with its salt. The other receipts stay commitments.",
  },
];

export function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-[1400px] items-center gap-8 px-4 pb-12 pt-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-14 md:px-8 md:pb-20 md:pt-16">
          <div className="rise">
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#d7a15f]">Private spending policy</p>
            <h1 className="mt-4 max-w-[12ch] text-4xl leading-[1.05] tracking-tight text-[#f6f1e8] md:text-6xl">
              Prove the spend. Hide the budget.
            </h1>
            <p className="mt-5 max-w-[38ch] text-base leading-relaxed text-[#c9c2b6]">
              A company sets the caps. The agent pays. Midnight records that it fit, and the amount stays off the ledger.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/console" className="btn-primary">
                Console
              </Link>
              <a href="#record" className="btn-ghost">
                Record
              </a>
            </div>
          </div>
          <Image
            src="/hero.jpg"
            alt="A closed ledger with a brass seal on a dark desk"
            width={1600}
            height={900}
            priority
            className="h-auto max-h-[46vh] w-full rounded-lg object-cover md:max-h-[52vh]"
          />
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto grid max-w-[1400px] md:grid-cols-2">
            <div className="px-4 py-16 md:px-8 md:py-24">
              <h2 className="text-3xl tracking-tight text-[#f6f1e8] md:text-4xl">On the ledger</h2>
              <ul className="mt-8 space-y-4 text-[17px] leading-snug text-[#f6f1e8]">
                {publicLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="border-t border-white/10 bg-[#161410] px-4 py-16 md:border-t-0 md:border-l md:px-8 md:py-24">
              <h2 className="text-3xl tracking-tight text-[#f6f1e8] md:text-4xl">Off the ledger</h2>
              <ul className="mt-8 space-y-4 text-[17px] leading-snug text-[#f6f1e8]">
                {privateLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
          <h2 className="max-w-[16ch] text-3xl tracking-tight text-[#f6f1e8] md:text-4xl">Three people, one file</h2>
          <div className="mt-10">
            {roles.map((role) => (
              <article key={role.title} className="grid gap-2 border-t border-white/10 py-7 md:grid-cols-[12rem_1fr] md:items-baseline md:gap-10">
                <h3 className="text-xl text-[#d7a15f]">{role.title}</h3>
                <p className="max-w-[52ch] text-base leading-relaxed text-[#c9c2b6]">{role.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="record" className="border-t border-white/10 bg-[#161410]">
          <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#d7a15f]">Chain run</p>
            <h2 className="mt-4 max-w-[18ch] text-3xl tracking-tight text-[#f6f1e8] md:text-4xl">
              Deployed on a local devnet
            </h2>
            <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[#c9c2b6]">
              GitHub Actions compiled the Compact contract, deployed it, and called it. That devnet ended with the job. A public explorer cannot open this address.
            </p>
            <a
              href={RUN}
              className="nav-link mt-8 block max-w-[40rem] break-all font-mono text-[15px] leading-relaxed text-[#d7a15f] underline decoration-white/20 underline-offset-4"
            >
              {ADDRESS}
            </a>
            <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[#c9c2b6]">
              The contract accepted create and a payment of 80. It rejected 150, a replay, and the wrong agent. Then it accepted revoke.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-8 text-[14px] text-[#b7b1a6] md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-[46ch] leading-relaxed">
            The console uses a local stand-in commitment. The Compact proof is the GitHub run. Apache-2.0.
          </p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/console" className="nav-link text-[#f6f1e8]">
              Console
            </Link>
            <a href="https://github.com/SammyCodes1/mandate" className="nav-link text-[#f6f1e8]">
              Source
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
