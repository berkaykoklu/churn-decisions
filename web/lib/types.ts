export type ReliabilityPoint = { predicted: number; observed: number; count: number };

export type Model = {
  name: string;
  auc: number;
  brier: number;
  mean_predicted: number;
  treated_at_break_even: number;
  reliability: ReliabilityPoint[];
};

export type CurvePoint = { threshold: number; value: number; treated: number };

export type Results = {
  n_test: number;
  churn_rate: number;
  offer: { cost: number; value_saved: number; effectiveness: number; break_even: number };
  models: Model[];
  value_curve: CurvePoint[];
  peak: CurvePoint;
  value_at_half: CurvePoint;
  cost_sweep: { cost: number; break_even: number; best_threshold: number; value: number; treated: number }[];
};
