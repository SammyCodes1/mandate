import type { Metadata } from "next";
import { Console } from "../../components/Console";

export const metadata: Metadata = {
  title: "Console · Mandate",
  description: "Issue a mandate, spend inside the cap, and open one receipt. This screen uses a local stand-in, not a Midnight proof.",
};

export default function ConsolePage() {
  return <Console />;
}
