import raw from "../public/results.json";
import Reliability from "@/components/Reliability";
import Reveal from "@/components/Reveal";
import Threshold from "@/components/Threshold";
import type { Results } from "@/lib/types";

const results = raw as Results;
const REPO = "https://github.com/berkaykoklu/churn-decisions";
const HOME = "https://berkaykoklu.vercel.app";

export default function Home() {
  const weighted = results.models.find((m) => m.name === "Class-weighted")!;
  const calibrated = results.models.find((m) => m.name === "Calibrated")!;
  const lost = results.peak.value - results.value_at_half.value;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[72rem] px-6 py-16 sm:py-24">
      <Reveal>
        <a href={HOME} className="font-mono text-[0.76rem] text-low transition-colors hover:text-mid">
          ← berkaykoklu.vercel.app
        </a>
        <h1 className="display mt-6 text-[clamp(2.3rem,6.5vw,4.2rem)]">
          From a churn probability<br />to a decision
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-relaxed text-mid">
          A churn model outputs a number per customer. Acting on it needs a
          threshold, and 0.5 is a convention with nothing behind it. The
          threshold follows from what a retention offer costs and what it saves
          — and it only works if the probabilities mean what they say, which is
          the part that usually goes unchecked.
        </p>
      </Reveal>

      <section className="mt-16 sm:mt-24">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">
            The probabilities have to be true
          </h2>
          <p className="mt-3 max-w-[64ch] text-mid">
            Class weighting is the standard reflex for imbalanced labels. It
            barely changes how well the model ranks customers, and it wrecks what
            the numbers mean — it was told the minority class is more common than
            it is, so it says so.
          </p>
        </Reveal>
        <div className="mt-8">
          <Reveal><Reliability models={results.models} churnRate={results.churn_rate} /></Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="mt-4 rounded-[14px] border border-block/35 bg-block/[0.06] p-5 sm:p-7">
            <p className="label mb-2" style={{ color: "var(--color-block)" }}>
              WHAT THAT COSTS
            </p>
            <p className="max-w-[64ch] text-[0.98rem] leading-relaxed text-hi">
              At the same break-even threshold, the class-weighted model sends an
              offer to{" "}
              <span className="font-mono font-semibold tnum">{weighted.treated_at_break_even}</span>{" "}
              customers and the calibrated one to{" "}
              <span className="font-mono font-semibold tnum">{calibrated.treated_at_break_even}</span>.
              More than double the spend, from a model whose AUC is{" "}
              <span className="font-mono tnum">{weighted.auc.toFixed(4)}</span> against{" "}
              <span className="font-mono tnum">{calibrated.auc.toFixed(4)}</span> — a difference no
              ranking metric would flag in review.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">
            Then the threshold is arithmetic
          </h2>
          <p className="mt-3 max-w-[64ch] text-mid">
            Treating a customer pays when the chance they leave, times the chance
            the offer works, times what they are worth, beats what the offer
            costs. Rearranged, that is a break-even probability —{" "}
            <span className="font-mono text-hi">p* = C / (e · V)</span> — and the
            classifier appears nowhere in it.
          </p>
        </Reveal>
        <div className="mt-8">
          <Reveal><Threshold results={results} /></Reveal>
        </div>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">What it adds up to</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { k: "DERIVED THRESHOLD", v: results.offer.break_even.toFixed(3), s: `${results.offer.cost} / (${results.offer.effectiveness} × ${results.offer.value_saved})` },
              { k: "BEST ON THIS SAMPLE", v: results.peak.threshold.toFixed(3), s: "the gap from derived is sampling noise" },
              { k: "LOST BY USING 0.5", v: lost.toLocaleString("en-US"), s: `${((lost / results.peak.value) * 100).toFixed(0)}% of the value on the table` },
            ].map((c, i) => (
              <Reveal key={c.k} delay={i * 0.05}>
                <div className="lift h-full rounded-[14px] p-5">
                  <p className="label">{c.k}</p>
                  <p className="display mt-2 text-[clamp(1.8rem,4.5vw,2.4rem)] tnum">{c.v}</p>
                  <p className="mt-2 text-[0.82rem] leading-snug text-mid">{c.s}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[64ch] text-[0.96rem] leading-relaxed text-mid">
              The derived threshold and the empirical best land close together,
              which is the check that matters: the arithmetic was not fitted to
              this sample, so agreeing with it is evidence the derivation holds
              rather than a coincidence engineered after the fact.
            </p>
          </Reveal>
        </Reveal>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">Limits</h2>
          <ul className="mt-6 max-w-[66ch] space-y-3 text-[0.94rem] leading-relaxed text-mid">
            <li>
              <span className="font-semibold text-hi">This is bank data, not game data.</span>{" "}
              Public player telemetry with real per-user features barely exists —
              studios keep it — and a synthetic stand-in would mean the numbers
              measured nothing. The method is the part that transfers.
            </li>
            <li>
              <span className="font-semibold text-hi">Cost, value and effectiveness are inputs, not findings.</span>{" "}
              I do not know a bank&rsquo;s real figures. The claim is that the
              threshold follows from whatever they are, which is why they are on
              a slider rather than asserted.
            </li>
            <li>
              <span className="font-semibold text-hi">Effectiveness is assumed constant.</span>{" "}
              In reality an offer works differently on different customers, and
              estimating that is uplift modelling — a harder problem than this
              one, and the honest next step rather than something quietly folded in.
            </li>
            <li>
              <span className="font-semibold text-hi">One split, one seed.</span>{" "}
              Held-out figures come from a single stratified split. Repeated
              splits would put an interval around every number here.
            </li>
          </ul>
        </Reveal>
      </section>

      <footer className="mt-20 border-t border-line pt-8 text-[0.84rem] text-low sm:mt-28">
        <a href={REPO} className="transition-colors hover:text-mid">
          Code, data and every figure on this page — github.com/berkaykoklu/churn-decisions
        </a>
      </footer>
    </main>
  );
}
