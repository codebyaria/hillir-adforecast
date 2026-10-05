export const FORMULA_VERSION = "v1" as const;

export type FormulaVersion = typeof FORMULA_VERSION;

export type ProfitabilityStatus =
  | "profitable"
  | "break_even"
  | "needs_optimization";

export interface CalculationInput {
  productPrice: number;
  adSpend: number;
  costPerResult: number;
  averageOrderValue: number;
}

/**
 * Nilai decimal dikembalikan sebagai string agar aman untuk JSON, database
 * numeric, dan display tanpa mengubahnya kembali menjadi floating-point.
 */
export interface CalculationResult {
  formulaVersion: FormulaVersion;
  resultCount: string;
  revenue: string;
  profitAfterAds: string;
  roiPercentage: string;
  targetCpr: string;
  revenuePerResult: string;
  marginPerResult: string;
  status: ProfitabilityStatus;
  isCprHealthy: boolean;
}
