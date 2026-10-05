import Decimal from "decimal.js";

import {
  calculationInputSchema,
  type ValidatedCalculationInput,
} from "./validation.js";
import {
  FORMULA_VERSION,
  type CalculationInput,
  type CalculationResult,
  type ProfitabilityStatus,
} from "./types.js";

const CalculationDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

function toDecimal(value: number) {
  return new CalculationDecimal(value.toString());
}

function getProfitabilityStatus(
  profitAfterAds: InstanceType<typeof CalculationDecimal>,
): ProfitabilityStatus {
  if (profitAfterAds.isZero()) {
    return "break_even";
  }

  if (profitAfterAds.isPositive()) {
    return "profitable";
  }

  return "needs_optimization";
}

function calculateValidated(
  input: ValidatedCalculationInput,
): CalculationResult {
  const productPrice = toDecimal(input.productPrice);
  const adSpend = toDecimal(input.adSpend);
  const costPerResult = toDecimal(input.costPerResult);
  const averageOrderValue = toDecimal(input.averageOrderValue);

  const resultCount = adSpend.dividedBy(costPerResult);
  const revenue = resultCount.times(averageOrderValue);
  const profitAfterAds = revenue.minus(adSpend);
  const roiPercentage = profitAfterAds.dividedBy(adSpend).times(100);
  const targetCpr = productPrice.times("0.30");
  const revenuePerResult = averageOrderValue;
  const marginPerResult = averageOrderValue.minus(costPerResult);

  return {
    formulaVersion: FORMULA_VERSION,
    resultCount: resultCount.toFixed(6),
    revenue: revenue.toFixed(2),
    profitAfterAds: profitAfterAds.toFixed(2),
    roiPercentage: roiPercentage.toFixed(4),
    targetCpr: targetCpr.toFixed(2),
    revenuePerResult: revenuePerResult.toFixed(2),
    marginPerResult: marginPerResult.toFixed(2),
    status: getProfitabilityStatus(profitAfterAds),
    isCprHealthy: costPerResult.lessThanOrEqualTo(targetCpr),
  };
}

/**
 * Satu-satunya implementasi formula v1 yang dipakai frontend dan backend.
 * Fungsi ini deterministik, tidak membulatkan nilai antara, dan selalu
 * memvalidasi input sebelum menghitung hasil.
 */
export function calculateCampaign(input: CalculationInput): CalculationResult {
  return calculateValidated(calculationInputSchema.parse(input));
}
