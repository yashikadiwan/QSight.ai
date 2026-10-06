import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

const PILLARS = [
  {
    title: "Scan in a real browser",
    body: "Opens the site, signs in, and captures pages and screenshots.",
  },
  {
    title: "A clear map of the product",
    body: "Pages and features are named so you are not reading raw URLs.",
  },
  {
    title: "You choose the test cases",
    body: "Add your journeys or review AI cases. Nothing runs until you confirm.",
  },
  {
    title: "Results with evidence",
    body: "Each approved case is pass, fail, or blocked, with a screenshot.",
  },
  {
    title: "Reliable on simple sites",
    body: "If the site is too complex, QSight.ai stops instead of guessing.",
  },
  {
    title: "Change your mind before you run",
    body: "Switch between your stories and AI cases before the suite starts.",
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
    <div className="home min-h-screen">
      <SiteHeader variant="marketing" />

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
        <p className="eyebrow">Website QA for sites we can finish</p>
        <h1 className="display mt-4 max-w-3xl text-4xl leading-[1.12] sm:text-6xl">
          See the map.
          <br />
          Approve the suite.
          <br />
          <span className="text-[#3eea8a]">Keep the proof.</span>
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
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {["Real-browser scan", "Map you confirm", "Proof on every case"].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-[#3eea8a] bg-[#123526] px-4 py-3 text-sm font-semibold text-[#3eea8a]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="band border-y-2 border-[#3eea8a]">
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
              <article key={item.title} className="card overflow-hidden p-0">
                <div className="h-2 bg-[#3eea8a]" />
                <div className="p-5">
                  <h3 className="text-[15px] font-semibold text-[#3eea8a]">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-white">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="band-green border-b-2 border-[#3eea8a]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">A single run</p>
          <h2 className="display mt-3 text-3xl">Scan, map, approve, run.</h2>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white">
            Four steps. You stay in the middle of them.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((step, index) => (
              <article key={step.name} className="card p-5">
                <p className="font-mono text-sm font-bold text-[#3eea8a]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[#3eea8a]">{step.name}</h3>
                <p className="mt-2 text-base leading-relaxed text-white">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start-with" className="border-b-2 border-[#3eea8a]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">After the map</p>
          <h2 className="display mt-3 max-w-2xl text-3xl">
            Two ways to build the cases.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-white">
            The crawler and understander go first. On the test cases step you
            pick: give us your journeys, or review and use our AI-generated suite.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border-2 border-[#3eea8a] bg-[#113326]">
            <div className="hidden grid-cols-[1fr_1.1fr_1.2fr] bg-[#3eea8a] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#04140c] sm:grid">
              <span>On the cases step</span>
              <span>You provide</span>
              <span>QSight.ai produces</span>
            </div>
            {SOURCES.map((row) => (
              <div
                key={row.name}
                className="grid gap-1 border-t-2 border-[#3eea8a] px-5 py-4 sm:grid-cols-[1fr_1.1fr_1.2fr] sm:gap-4"
              >
                <p className="text-base font-semibold text-[#3eea8a]">{row.name}</p>
                <p className="text-base text-white">{row.give}</p>
                <p className="text-base text-white">{row.store}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#123526]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="rounded-2xl border-2 border-[#3eea8a] bg-[#0d2a1c] p-6 sm:p-8">
            <h2 className="display max-w-xl text-3xl text-[#3eea8a]">
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
        </div>
      </section>
    </div>
  );
}
