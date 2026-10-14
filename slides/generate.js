// Mandate, six slides for the Midnight buildathon.
// Visual system adapted from the finance_nft_marketplace_pitch_deck template:
// charcoal field, gold italic, mono labels, corner brackets.

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.author = "Samuel";
pres.title = "Mandate";
pres.subject = "Private spending policy for an AI agent on Midnight";

pres.defineLayout({ name: "CURIO", width: 20, height: 11.25 });
pres.layout = "CURIO";

const C = {
  bg: "0A0907",
  panel: "14110D",
  card: "2C2620",
  border: "4A3F33",
  mute: "85796A",
  text: "C7BDA9",
  gold: "C9A961",
  cream: "F4EBDC",
};

const F_HEAD = "Georgia";
const F_BODY = "Segoe UI";
const F_MONO = "Consolas";

const SW = 20;
const SH = 11.25;
const M = 1.04;
const TOP_LABEL_Y = 0.7;
const BOTTOM_Y = 10.6;
const RULE_Y = 0.85;

function addPageFrame(slide, num, sectionLabel) {
  slide.background = { color: C.bg };
  slide.addText(
    [
      { text: String(num).padStart(2, "0") + "  ", options: { color: C.mute, fontFace: F_MONO, fontSize: 11, charSpacing: 3 } },
      { text: sectionLabel, options: { color: C.gold, fontFace: F_MONO, fontSize: 11, charSpacing: 3, bold: true } },
    ],
    { x: M, y: TOP_LABEL_Y, w: 8, h: 0.3, margin: 0, valign: "middle" },
  );
  slide.addShape(pres.shapes.LINE, {
    x: M + 4.2,
    y: RULE_Y,
    w: SW - M - (M + 4.2),
    h: 0,
    line: { color: C.border, width: 0.75 },
  });
  slide.addText("MANDATE  ·  MIDNIGHT BUILDATHON", {
    x: M,
    y: BOTTOM_Y,
    w: 8,
    h: 0.3,
    margin: 0,
    color: C.mute,
    fontFace: F_MONO,
    fontSize: 10,
    charSpacing: 2,
  });
  slide.addText(String(num).padStart(2, "0") + "  /  06", {
    x: SW - M - 3,
    y: BOTTOM_Y,
    w: 3,
    h: 0.3,
    margin: 0,
    color: C.mute,
    fontFace: F_MONO,
    fontSize: 10,
    charSpacing: 2,
    align: "right",
  });
}

function addCornerBrackets(slide, x, y, w, h, color = C.border, size = 0.22, stroke = 1) {
  const s = size;
  slide.addShape(pres.shapes.LINE, { x, y, w: s, h: 0, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x, y, w: 0, h: s, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x: x + w - s, y, w: s, h: 0, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x: x + w, y, w: 0, h: s, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x, y: y + h, w: s, h: 0, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x, y: y + h - s, w: 0, h: s, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x: x + w - s, y: y + h, w: s, h: 0, line: { color, width: stroke } });
  slide.addShape(pres.shapes.LINE, { x: x + w, y: y + h - s, w: 0, h: s, line: { color, width: stroke } });
}

{
  const s = pres.addSlide();
  s.background = { color: "2C2620" };
  s.addText("MIDNIGHT BUILDATHON  ·  WAVE 2", {
    x: M, y: 0.7, w: 10, h: 0.35, margin: 0,
    color: C.mute, fontFace: F_MONO, fontSize: 14, charSpacing: 3,
  });
  s.addText("OCTOBER 2026", {
    x: SW - M - 4, y: 0.7, w: 4, h: 0.35, margin: 0,
    color: C.mute, fontFace: F_MONO, fontSize: 14, charSpacing: 3, align: "right",
  });
  s.addText("PRIVATE SPENDING POLICY", {
    x: M, y: 2.35, w: 12, h: 0.4, margin: 0,
    color: C.gold, fontFace: F_MONO, fontSize: 16, charSpacing: 4, bold: true,
  });
  s.addText("Mandate", {
    x: M, y: 2.9, w: 16, h: 1.8, margin: 0,
    fontFace: F_HEAD, fontSize: 108, color: C.cream,
  });
  s.addShape(pres.shapes.LINE, {
    x: M, y: 5.15, w: 6.2, h: 0, line: { color: C.border, width: 0.75 },
  });
  s.addText("Prove the agent stayed inside its mandate, and never publish the mandate.", {
    x: M, y: 5.5, w: 12, h: 1.5, margin: 0,
    color: C.cream, fontFace: F_HEAD, italic: true, fontSize: 28,
  });
  s.addText("SAMMYCODES1 / MANDATE", {
    x: M, y: BOTTOM_Y, w: 8, h: 0.3, margin: 0,
    color: C.mute, fontFace: F_MONO, fontSize: 12, charSpacing: 2,
  });
  s.addText("APACHE-2.0", {
    x: SW - M - 4, y: BOTTOM_Y, w: 4, h: 0.3, margin: 0,
    color: C.mute, fontFace: F_MONO, fontSize: 12, charSpacing: 2, align: "right",
  });
  s.addNotes("Say the one line: prove the agent stayed inside its mandate, and never publish the mandate.");
}

{
  const s = pres.addSlide();
  addPageFrame(s, 2, "PROBLEM");
  s.addText(
    [
      { text: "A company that gives an agent a wallet either sees ", options: { color: C.cream } },
      { text: "every payment", options: { color: C.gold, italic: true } },
      { text: ", or sees nothing.", options: { color: C.cream } },
    ],
    { x: M, y: 1.7, w: 16.5, h: 2.6, margin: 0, fontFace: F_HEAD, fontSize: 42 },
  );
  const cards = [
    ["01", "Open the wallet", "Every amount, recipient, and leftover is public. The agent cannot work without exposing the budget."],
    ["02", "Hide the wallet", "The company learns about a bad payment after the money has moved. There is no policy, only a balance."],
    ["03", "Mandate", "The company commits to the rules. The agent proves a payment fits. The ledger stores the proof, not the payment."],
  ];
  cards.forEach((card, i) => {
    const x = M + i * 5.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 5.15, w: 5.5, h: 4.5,
      fill: { color: C.panel },
    });
    addCornerBrackets(s, x, 5.15, 5.5, 4.5, C.gold, 0.22, 1.25);
    s.addText(card[0], {
      x: x + 0.35, y: 5.45, w: 4.8, h: 0.4, margin: 0,
      color: C.gold, fontFace: F_MONO, fontSize: 14, charSpacing: 2,
    });
    s.addText(card[1], {
      x: x + 0.35, y: 6.05, w: 4.8, h: 0.7, margin: 0,
      color: C.cream, fontFace: F_HEAD, fontSize: 26,
    });
    s.addText(card[2], {
      x: x + 0.35, y: 6.95, w: 4.8, h: 2.2, margin: 0,
      color: C.text, fontFace: F_BODY, fontSize: 16,
    });
  });
  s.addNotes("Neither extreme is acceptable. Mandate is the third column.");
}

{
  const s = pres.addSlide();
  addPageFrame(s, 3, "POLICY");
  s.addText(
    [
      { text: "Four rules. ", options: { color: C.cream } },
      { text: "None of them", options: { color: C.gold, italic: true } },
      { text: " land on the ledger.", options: { color: C.cream } },
    ],
    { x: M, y: 1.45, w: 17, h: 1.3, margin: 0, fontFace: F_HEAD, fontSize: 36 },
  );

  const rules = [
    ["100", "Per payment"],
    ["250", "Total"],
    ["3", "Payments"],
    ["4", "Recipient slots"],
  ];
  rules.forEach((rule, i) => {
    const x = M + i * 4.45;
    s.addText(rule[0], {
      x, y: 3.15, w: 4, h: 1.15, margin: 0,
      color: C.cream, fontFace: F_HEAD, fontSize: 64,
    });
    s.addText(rule[1].toUpperCase(), {
      x, y: 4.35, w: 4, h: 0.35, margin: 0,
      color: C.gold, fontFace: F_MONO, fontSize: 14, charSpacing: 2,
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: M, y: 5.4, w: 17.9, h: 4.5,
    fill: { color: C.panel },
  });
  const cols = [
    ["Public", "Company key, agent key, terms commitment, purse commitment, one nullifier per accepted payment, one receipt commitment."],
    ["Private", "The caps, the recipient list, the amount, the remaining budget, and every salt. A rejected payment writes nothing."],
    ["Why it holds", "The purse commitment is a chain. The agent cannot claim a smaller spent total than the last accepted payment."],
  ];
  cols.forEach((col, i) => {
    const x = M + 0.45 + i * 5.9;
    s.addText(col[0].toUpperCase(), {
      x, y: 5.7, w: 5.3, h: 0.35, margin: 0,
      color: C.gold, fontFace: F_MONO, fontSize: 13, charSpacing: 2,
    });
    s.addText(col[1], {
      x, y: 6.25, w: 5.3, h: 3.1, margin: 0,
      color: C.cream, fontFace: F_BODY, fontSize: 18,
    });
  });
  s.addNotes("Issue the mandate. Point at the public ledger. The caps are not on it.");
}

{
  const s = pres.addSlide();
  addPageFrame(s, 4, "PAYMENTS");
  s.addText("Same vendor. Two answers.", {
    x: M, y: 1.45, w: 16, h: 0.8, margin: 0,
    fontFace: F_HEAD, fontSize: 36, color: C.cream,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: M, y: 2.7, w: 8.5, h: 6.9, fill: { color: C.panel },
  });
  addCornerBrackets(s, M, 2.7, 8.5, 6.9, C.gold, 0.28, 1.5);
  s.addText("PAY 80", {
    x: M + 0.5, y: 3.1, w: 7.5, h: 0.4, margin: 0,
    color: C.gold, fontFace: F_MONO, fontSize: 16, charSpacing: 3,
  });
  s.addText("Accepted", {
    x: M + 0.5, y: 3.6, w: 7.5, h: 0.9, margin: 0,
    color: C.cream, fontFace: F_HEAD, fontSize: 40,
  });
  s.addText("The ledger gains a nullifier and a new purse commitment. The amount 80 is not a field on that ledger. The receipt is a commitment the auditor can open later.", {
    x: M + 0.5, y: 4.8, w: 7.4, h: 2.6, margin: 0,
    color: C.text, fontFace: F_BODY, fontSize: 20,
  });
  s.addText("NULLIFIERS  0  →  1", {
    x: M + 0.5, y: 8.5, w: 7.4, h: 0.4, margin: 0,
    color: C.cream, fontFace: F_MONO, fontSize: 16, charSpacing: 1,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: M + 9.3, y: 2.7, w: 8.5, h: 6.9, fill: { color: C.panel },
  });
  addCornerBrackets(s, M + 9.3, 2.7, 8.5, 6.9, C.border, 0.28, 1.5);
  s.addText("PAY 150", {
    x: M + 9.8, y: 3.1, w: 7.5, h: 0.4, margin: 0,
    color: C.mute, fontFace: F_MONO, fontSize: 16, charSpacing: 3,
  });
  s.addText("Rejected", {
    x: M + 9.8, y: 3.6, w: 7.5, h: 0.9, margin: 0,
    color: C.cream, fontFace: F_HEAD, fontSize: 40,
  });
  s.addText("The per-payment cap is 100. The assert fires before any write. The nullifier set does not grow. Replay of the accepted payment fails the same way: the purse commitment no longer matches.", {
    x: M + 9.8, y: 4.8, w: 7.4, h: 2.8, margin: 0,
    color: C.text, fontFace: F_BODY, fontSize: 20,
  });
  s.addText("NULLIFIERS  STAY  1", {
    x: M + 9.8, y: 8.5, w: 7.4, h: 0.4, margin: 0,
    color: C.cream, fontFace: F_MONO, fontSize: 16, charSpacing: 1,
  });
  s.addNotes("Pay 80 and point at the new nullifier. Pay 150 and point at the unchanged count. Then replay.");
}

{
  const s = pres.addSlide();
  addPageFrame(s, 5, "AUDITOR");
  s.addText(
    [
      { text: "Open one receipt. ", options: { color: C.cream } },
      { text: "Leave the rest shut.", options: { color: C.gold, italic: true } },
    ],
    { x: M, y: 1.55, w: 17, h: 1.2, margin: 0, fontFace: F_HEAD, fontSize: 40 },
  );
  s.addText("The company shares the salt for receipt 0. The auditor recomputes the commitment and matches it to the ledger. Receipt 1 stays a commitment. Revoke is the company's key, and a revoked mandate rejects the next spend.", {
    x: M, y: 3.05, w: 16.5, h: 1.5, margin: 0,
    color: C.text, fontFace: F_BODY, fontSize: 22,
  });

  const rows = [
    ["Receipt 0", "80 to the allowed vendor", "Opened"],
    ["Receipt 1", "Commitment only", "Closed"],
    ["Wrong agent", "A stranger's secret", "Rejected"],
    ["Revoke", "Company key required", "Status becomes REVOKED"],
  ];
  rows.forEach((row, i) => {
    const y = 5.0 + i * 1.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x: M, y, w: 17.9, h: 1.0, fill: { color: C.panel },
    });
    s.addText(row[0].toUpperCase(), {
      x: M + 0.4, y, w: 4.2, h: 1.0, margin: 0, valign: "middle",
      color: C.gold, fontFace: F_MONO, fontSize: 16, charSpacing: 1,
    });
    s.addText(row[1], {
      x: M + 4.8, y, w: 7.2, h: 1.0, margin: 0, valign: "middle",
      color: C.cream, fontFace: F_BODY, fontSize: 20,
    });
    s.addText(row[2].toUpperCase(), {
      x: M + 12.2, y, w: 5.3, h: 1.0, margin: 0, valign: "middle",
      color: C.text, fontFace: F_MONO, fontSize: 14, charSpacing: 1, align: "right",
    });
  });
  s.addNotes("Open receipt 0. Stop. Do not open the others.");
}

{
  const s = pres.addSlide();
  addPageFrame(s, 6, "PROOF");
  s.addText("What a judge can check.", {
    x: M, y: 1.45, w: 16, h: 0.8, margin: 0,
    fontFace: F_HEAD, fontSize: 36, color: C.cream,
  });

  const items = [
    ["01", "Repository", "github.com/SammyCodes1/mandate. Apache-2.0. Topic midnightntwrk. Compact source is contract/mandate.compact."],
    ["02", "Compiler", "Toolchain 0.31.1, language 0.23, runtime 0.16.0. That is the set the public networks accept. The keys are the mandate-compact artifact."],
    ["03", "Circuits", "chain/src/simulate.ts runs create, spend, reject, replay, wrong agent, and revoke inside the Compact runtime."],
    ["04", "Devnet", "chain.yml starts Midnight's local node, indexer, and proof server. The transcript is an artifact. That address is not on Preview or Preprod."],
  ];
  items.forEach((item, i) => {
    const y = 2.5 + i * 1.45;
    s.addText(item[0], {
      x: M, y, w: 1.2, h: 0.4, margin: 0,
      color: C.gold, fontFace: F_MONO, fontSize: 18,
    });
    s.addText(item[1], {
      x: M + 1.5, y, w: 4.2, h: 0.4, margin: 0,
      color: C.cream, fontFace: F_HEAD, fontSize: 24,
    });
    s.addText(item[2], {
      x: M + 6.0, y, w: 11.8, h: 1.05, margin: 0,
      color: C.text, fontFace: F_BODY, fontSize: 16,
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: M, y: 8.45, w: 17.9, h: 1.55, fill: { color: C.panel },
  });
  s.addText("WAVE 3", {
    x: M + 0.4, y: 8.65, w: 3, h: 0.3, margin: 0,
    color: C.gold, fontFace: F_MONO, fontSize: 13, charSpacing: 2,
  });
  s.addText("A public network once a wallet can be funded. Then Lace, a daily window, and one receipt disclosed on chain.", {
    x: M + 0.4, y: 9.05, w: 17, h: 0.7, margin: 0,
    color: C.cream, fontFace: F_HEAD, italic: true, fontSize: 22,
  });
  s.addNotes("Wave 3 is Lace on a public network once a wallet can be funded, plus a daily window and an on-chain disclose for one receipt. Do not claim a Preprod address.");
}

pres.writeFile({ fileName: "slides/Mandate.pptx" }).then(() => {
  console.log("wrote slides/Mandate.pptx");
});
