import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8">
        <h1 className="text-4xl tracking-tight text-[#f6f1e8]">This page is not here.</h1>
        <p className="mt-4 max-w-[36ch] text-[#c9c2b6]">The address does not match a page in Mandate.</p>
        <Link href="/" className="btn-primary mt-8">
          Home
        </Link>
      </main>
    </>
  );
}
