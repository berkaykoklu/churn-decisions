"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Model } from "@/lib/types";

/** Predicted probability against the rate that actually occurred. A model that
 *  says 30% should be right 30% of the time, so a well-calibrated one sits on
 *  the diagonal. The class-weighted model sits well below it — it was told the
 *  minority class is more common than it is, and it says so. */
export default function Reliability({ models, churnRate }: { models: Model[]; churnRate: number }) {
  const [sel, setSel] = useState(models.length - 1);
  const still = useReducedMotion();
  const model = models[sel] ?? models[0]!;

  const W = 420;
  const H = 300;
  const pad = 42;
  const x = (v: number) => pad + v * (W - pad - 14);
  const y = (v: number) => H - pad - v * (H - pad - 14);

  const off = model.mean_predicted - churnRate;

  return (
    <div className="lift rounded-[14px] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {models.map((m, i) => (
          <button
            key={m.name}
            type="button"
            aria-pressed={i === sel}
            onClick={() => setSel(i)}
            className={`rounded-md border px-3 py-1.5 text-[0.82rem] transition-colors ${
              i === sel
                ? "border-flow/50 bg-flow/10 font-medium text-hi"
                : "border-line bg-raised text-low hover:text-mid"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="diagram-scroll">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img"
               aria-label="Predicted probability against observed churn rate; a calibrated model follows the diagonal.">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={x(t)} y1={y(0)} x2={x(t)} y2={y(1)} stroke="var(--color-line)" strokeDasharray="2 5" />
                <line x1={x(0)} y1={y(t)} x2={x(1)} y2={y(t)} stroke="var(--color-line)" strokeDasharray="2 5" />
                <text x={x(t)} y={H - pad + 15} textAnchor="middle" fontSize="9" fill="var(--color-low)" fontFamily="var(--font-mono)">{t}</text>
                <text x={pad - 8} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--color-low)" fontFamily="var(--font-mono)">{t}</text>
              </g>
            ))}

            <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-line-ctl)" strokeWidth="1.5" />
            <text x={x(0.72)} y={y(0.78)} fontSize="9" fill="var(--color-mid)" fontFamily="var(--font-mono)">perfect</text>

            <motion.polyline
              key={model.name}
              points={model.reliability.map((r) => `${x(r.predicted)},${y(r.observed)}`).join(" ")}
              fill="none" stroke="var(--color-flow)" strokeWidth="2"
              initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            />
            {model.reliability.map((r) => (
              <circle key={r.predicted} cx={x(r.predicted)} cy={y(r.observed)}
                      r={Math.max(2.5, Math.min(7, Math.sqrt(r.count) / 6))}
                      fill="var(--color-flow)" opacity="0.9" />
            ))}

            <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="9.5" fill="var(--color-low)" fontFamily="var(--font-mono)">PREDICTED</text>
            <text x="11" y={H / 2} textAnchor="middle" fontSize="9.5" fill="var(--color-low)" fontFamily="var(--font-mono)" transform={`rotate(-90 11 ${H / 2})`}>OBSERVED</text>
          </svg>
        </div>

        <div className="space-y-4">
          <div>
            <p className="label">SAYS ON AVERAGE</p>
            <p className="display mt-1 text-[2.2rem] tnum"
               style={{ color: Math.abs(off) > 0.05 ? "var(--color-block)" : "var(--color-ok)" }}>
              {(model.mean_predicted * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-[0.82rem] text-mid">
              against {(churnRate * 100).toFixed(1)}% who actually left
              {Math.abs(off) > 0.05 && (
                <span style={{ color: "var(--color-block)" }}>
                  {" "}— inflated by {((off / churnRate) * 100).toFixed(0)}%
                </span>
              )}
            </p>
          </div>
          <div className="border-t border-line pt-4 font-mono text-[0.78rem] tnum">
            <div className="flex justify-between"><span className="text-low">Brier</span><span>{model.brier.toFixed(4)}</span></div>
            <div className="mt-1.5 flex justify-between"><span className="text-low">AUC</span><span>{model.auc.toFixed(4)}</span></div>
          </div>
          <p className="border-t border-line pt-4 text-[0.82rem] leading-relaxed text-mid">
            AUC barely moves between these models. It measures ranking, and
            ranking survives any monotonic distortion of the probabilities — so
            it cannot see this failure at all.
          </p>
        </div>
      </div>
    </div>
  );
}
