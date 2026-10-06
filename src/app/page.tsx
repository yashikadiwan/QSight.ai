import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

const PILLARS = [
  {
    title: "Scan in a real browser",
    body: "QSight.ai opens the site, signs in with the test account you provide, and captures pages, headings, buttons, and screenshots.",
  },
  {
    title: "A clear map of the product",
    body: "Pages are labeled as login, listing, cart, or checkout, then grouped into features so you can review the site without reading raw URLs.",
  },
  {
    title: "You choose the test cases",
    body: "After the map, add your own journeys, requirements, or user stories, or review the cases QSight.ai generated. Nothing runs until you confirm.",
  },
  {
    title: "Results with evidence",
    body: "Only the cases you approved are run. Each one is marked pass, fail, or blocked, and includes a screenshot.",
  },
  {
    title: "Reliable on simple sites",
    body: "If a site is too complex or unclear, QSight.ai stops. Phase 1 is built for shops like Sauce Demo, where the goal is a complete, accurate run.",
  },
  {
    title: "Change your mind before you run",
    body: "Start with your stories or with QSight.ai's generated cases. You can switch before the suite starts.",
  },
];

const LOOP = [
  {
    name: "Scan",
    body: "The crawler opens the URL, walks reachable pages, and stores a screenshot of each one.",
  },
  {
    name: "Map",
    body: "The understander labels pages and features. You keep what matters and skip the rest.",
  },
  {
    name: "Approve",
    body: "After the map, either paste journeys, requirements, and user stories, or review the AI-generated cases.",
  },
  {
    name: "Run",
    body: "A real browser plays the suite. You get a short report you can hand to the team.",
  },
];

const SOURCES = [
  {
    name: "Your journeys",
    give: "Journeys, requirements, or user stories",
    store: "Cases drafted from what you wrote, reviewed before run",
  },
  {
    name: "AI-generated cases",
    give: "The map from the crawler and understander",
    store: "A suite you can tick, untick, and run with screenshots",
  },
];

export default function OverviewPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="marketing" />

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
        <p className="eyebrow">Website QA for sites we can finish</p>
        <h1 className="display mt-4 max-w-3xl text-4xl leading-[1.12] sm:text-6xl">
          See the map.
          <br />
          Approve the suite.
          <br />
          Keep the proof.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white">
          QSight.ai crawls a website and maps the pages. Then you either give us
          journeys, requirements, and user stories — or review the AI-generated
          cases. A real browser runs only what you approve.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/start" className="btn">
            Start testing
          </Link>
          <a href="#how" className="btn-ghost">
            How a run works
          </a>
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">Inside the product</p>
          <h2 className="display mt-3 max-w-xl text-3xl">
            Built around a crawler and an understander — not a click recorder.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-white">
            You point QSight.ai at a site. It walks pages and names features. After
            the map, you choose how cases get into the suite.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((item) => (
              <article key={item.title} className="card p-5">
                <h3 className="text-[15px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-white">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">A single run</p>
          <h2 className="display mt-3 text-3xl">Scan, map, approve, run.</h2>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white">
            Four steps. You stay in the middle of them.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((step, index) => (
              <article key={step.name} className="card p-5">
                <p className="font-mono text-xs text-[#3eea8a]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.name}</h3>
                <p className="mt-2 text-base leading-relaxed text-white">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start-with" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">After the map</p>
          <h2 className="display mt-3 max-w-2xl text-3xl">
            Two ways to build the cases.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-white">
            The crawler and understander go first. On the test cases step you
            pick: give us your journeys, or review and use our AI-generated suite.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
            <div className="hidden grid-cols-[1fr_1.1fr_1.2fr] bg-[#123526] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white sm:grid">
              <span>On the cases step</span>
              <span>You provide</span>
              <span>QSight.ai produces</span>
            </div>
            {SOURCES.map((row) => (
              <div
                key={row.name}
                className="grid gap-1 border-t border-[var(--line)] px-5 py-4 sm:grid-cols-[1fr_1.1fr_1.2fr] sm:gap-4"
              >
                <p className="text-base font-semibold text-white">{row.name}</p>
                <p className="text-base text-white">{row.give}</p>
                <p className="text-base text-white">{row.store}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="display max-w-xl text-3xl">
            Point it at a site and see the map.
          </h2>
          <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-white">
            Phase 1 is tuned for Sauce Demo. Scan the site, confirm the map, then
            choose how the cases are built.
          </p>
          <Link href="/start" className="btn mt-8">
            Start testing
          </Link>
        </div>
      </section>
    </div>
  );
}
