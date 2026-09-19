export type Status = "shipped" | "v1_1" | "planned";
export type Outcome = "private" | "your-mac" | "memory" | "automation" | "notebooks";

export interface Feature {
  id: string;
  name: string;
  outcome: Outcome;
  status: Status;
  headline: string;
  summary: string;
  detail: string;
  screenshot: string;
  requires: string[];
}

export const OUTCOMES: { id: Outcome; title: string; blurb: string; href: string }[] = [
  { id: "private",    title: "Runs entirely on your Mac",     blurb: "Your words, your mail, your calendar never leave the machine.", href: "/private" },
  { id: "your-mac",   title: "Works inside your real apps",   blurb: "Calendar, Mail, Contacts, Notes, Reminders. The ones you already use.", href: "/your-mac" },
  { id: "memory",     title: "Remembers you",                 blurb: "Facts you tell it once stay known, across every conversation.", href: "/capabilities#memory" },
  { id: "automation", title: "Does things while you are away", blurb: "Briefs, watches, reminders, and skills that run on their own.", href: "/automation" },
  { id: "notebooks",  title: "Grounded in your own sources",  blurb: "Ask questions of your documents and get cited answers.", href: "/notebooks" },
];

export const visible = (fs: Feature[]) => fs.filter((f) => f.status === "shipped");
export const comingSoon = (fs: Feature[]) => fs.filter((f) => f.status === "v1_1");

export function groupByOutcome(fs: Feature[]) {
  const shown = fs.filter((f) => f.status !== "planned");
  return OUTCOMES
    .map((o) => ({ outcome: o.id, title: o.title, features: shown.filter((f) => f.outcome === o.id) }))
    .filter((g) => g.features.length > 0);
}
