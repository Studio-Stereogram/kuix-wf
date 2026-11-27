// The "tired of scrolling?" prompt: everything on the feed, written as one
// Markdown brief someone can paste into the AI they already use. It is built
// from the same content as the page, so the two never drift apart (and it
// carries the same DRAFT facts until those are replaced).
import { closing, hero, impact, industries, order, partners, people, phases, services, smallPrint, stack, studio, values, work } from "./feed";

const plain = (s: string) => s.replace(/\[|\]/g, "").replace(/ /g, " ");
const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
// Lower-cases a leading capital mid-sentence, but leaves acronyms and names
// that carry more capitals (AI, QA, SaaS) as they are.
const lc = (s: string) => s.replace(/^([A-Z])([a-z]*)\b/, (w, a: string, b: string) => (/[A-Z]/.test(s.slice(w.length).split(" ")[0]) ? w : a.toLowerCase() + b));
const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0];

export function briefing(): string {
  const leads = order.map((w) => `${people[w].name} (${lc(people[w].role)})`);
  return [
    `# KUIX, in one prompt`,
    ``,
    `I want to know whether KUIX is right for my project. Below is what they say about themselves. Answer only from it; if something isn't covered, say so and suggest writing to ${closing.email}. Keep it short and plain. Start by asking me what I'm building.`,
    ``,
    `## Who we are`,
    `${plain(hero.title)} ${firstSentence(plain(hero.text))} ${leads.slice(0, -1).join(", ")} and ${leads[leads.length - 1]} lead it. The rest of the studio: ${lc(studio.team.note)}.`,
    list(impact.map((i) => `${i.value}${i.suffix} ${lc(i.label)} (${lc(i.note)})`)),
    ``,
    `## How we think`,
    list(values.map((v) => `${v.title}. ${v.body}`)),
    ``,
    `## How we work`,
    list(
      services.map((s, i) => {
        const p = phases[i];
        const when = p ? ` (${lc(p.length)})` : "";
        const get = p ? ` You leave with ${lc(p.get)}` : "";
        return `${s.title}${when}: ${s.body}${get} Includes ${s.deliverables.map(lc).join(", ")}.`;
      }),
    ),
    smallPrint,
    `Stack: ${stack.map((t) => (t.startsWith("Your ") ? lc(t) : t)).join(", ")}.`,
    ``,
    `## Where we work`,
    list(industries.map((d) => `${d.name}: ${d.body}`)),
    ``,
    `## Selected work`,
    list(work.map((w) => `${w.client}: ${lc(w.platform)}, ${w.sector} (${w.status === "active" ? "ongoing" : "delivered"}, ${w.year})`)),
    `Trusted by ${partners.join(", ")}.`,
    ``,
    `## Getting in touch`,
    `${closing.email}. ${plain(closing.small)}`,
    ``,
  ].join("\n");
}
