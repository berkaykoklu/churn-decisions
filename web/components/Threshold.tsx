"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Results } from "@/lib/types";

/** The threshold is not a modelling choice. Drag the cost of the offer and
 *  watch the break-even point move with it — no retraining, because the rule
 *  is C / (e·V) and the classifier appears nowhere in it. */
export default function Threshold({ results }: { results: Results }) {
  const sweep = results.cost_sweep;
  const start = Math.max(0, sweep.findIndex((s) => s.cost === results.offer.cost));
  const [i, setI] = useState(start);
  const still = useReducedMotion();

  const now = sweep[i] ?? sweep[0]!;
  const curve = results.value_curve;
  const maxValue = Math.max(...curve.map((c) => c.value));
  const minValue = Math.min(...curve.map((c) => c.value));

  const W = 560;
  const H = 210;
  const pad = 46;
  const x = (t: number) => pad + t * (W - pad - 16);
  const y = (v: number) => H - 34 - ((v - minValue) / (maxValue - minValue || 1)) * (H - 58);

  return (
    <div className="lift rounded-[14px] p-5 sm:p-7">
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <div>
          <p className="label">BREAK-EVEN THRESHOLD</p>
          <motion.p
            key={now.break_even}
            initial={still ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="display mt-1 text-[clamp(2.2rem,6vw,3.2rem)] text-flow tnum"
          >
            {now.break_even.toFixed(3)}
          </motion.p>
          <p className="mt-1 font-mono text-[0.72rem] text-low">
            {now.cost} / ({results.offer.effectiveness} × {results.offer.value_saved})
          </p>
        </div>
        <div>
          <p className="label">CUSTOMERS TREATED</p>
          <p className="display mt-1 text-[clamp(2.2rem,6vw,3.2rem)] tnum">{now.treated}</p>
          <p className="mt-1 font-mono text-[0.72rem] text-low">of {results.n_test.toLocaleString("en-US")}</p>
        </div>
        <div>
          <p className="label">VALUE AT THAT THRESHOLD</p>
          <p className="display mt-1 text-[clamp(2.2rem,6vw,3.2rem)] text-ok tnum">
            {now.value.toLocaleString("en-US")}
          </p>
          <p className="mt-1 font-mono text-[0.72rem] text-low">on held-out customers</p>
        </div>
      </div>

      <div className="diagram-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[440px]" role="img"
             aria-label="Expected value across thresholds, with the derived break-even point and the 0.5 convention marked.">
          <line x1={pad} y1={y(0)} x2={W - 16} y2={y(0)} stroke="var(--color-line-lit)" strokeDasharray="3 4" />
          <text x={pad - 8} y={y(0) + 3} textAnchor="end" fontSize="9" fill="var(--color-low)" fontFamily="var(--font-mono)">0</text>

          <motion.polyline
            points={curve.map((c) => `${x(c.threshold)},${y(c.value)}`).join(" ")}
            fill="none" stroke="var(--color-flow)" strokeWidth="2"
            initial={still ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
          />

          <line x1={x(0.5)} y1={y(maxValue)} x2={x(0.5)} y2={y(minValue)} stroke="var(--color-low)" strokeDasharray="4 3" />
          <text x={x(0.5)} y={H - 18} textAnchor="middle" fontSize="9" fill="var(--color-low)" fontFamily="var(--font-mono)">0.5 by habit</text>

          <motion.line
            x1={x(Math.min(now.break_even, 1))} x2={x(Math.min(now.break_even, 1))}
            y1={y(maxValue)} y2={y(minValue)}
            stroke="var(--color-flow)" strokeWidth="1.5"
            animate={{ x1: x(Math.min(now.break_even, 1)), x2: x(Math.min(now.break_even, 1)) }}
            transition={{ duration: 0.25 }}
          />
          <text x={x(Math.min(now.break_even, 1))} y={y(maxValue) - 5} textAnchor="middle" fontSize="9" fill="var(--color-flow)" fontFamily="var(--font-mono)">derived</text>

          <circle cx={x(results.peak.threshold)} cy={y(results.peak.value)} r="4.5" fill="var(--color-ok)" />
          <text x={W / 2} y={H - 3} textAnchor="middle" fontSize="9.5" fill="var(--color-low)" fontFamily="var(--font-mono)">THRESHOLD</text>
        </svg>
      </div>

      <label className="mt-5 block">
        <span className="label">DRAG THE COST OF THE RETENTION OFFER</span>
        <input
          type="range" min={0} max={sweep.length - 1} value={i}
          onChange={(e) => setI(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-flow)]"
          aria-label="Cost of the retention offer"
        />
      </label>
      <p className="mt-3 text-[0.86rem] leading-relaxed text-mid">
        Nothing is retrained as this moves. The threshold is a property of the
        offer, not of the classifier — which is also why a model whose
        probabilities are inflated applies it to the wrong customers.
      </p>
    </div>
  );
}
