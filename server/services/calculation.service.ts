import Decimal from "decimal.js";

import { calculateCampaign } from "../../shared/calculation.js";
import type {
  CalculationPagination,
  ValidatedCalculationInput,
} from "../../shared/validation.js";
import type {
  CalculationRepository,
  NewStoredCalculation,
  StoredCalculation,
} from "../repositories/calculation.repository.js";

function money(value: number) {
  return new Decimal(value.toString()).toFixed(2);
}

function toCalculationResponse(calculation: StoredCalculation) {
  const { userId: _userId, ...response } = calculation;

  return {
    ...response,
    createdAt: response.createdAt.toISOString(),
  };
}

export class CalculationService {
  constructor(private readonly repository: CalculationRepository) {}

  async create(userId: string, input: ValidatedCalculationInput) {
    const result = calculateCampaign(input);
    const snapshot: NewStoredCalculation = {
      userId,
      productPrice: money(input.productPrice),
      adSpend: money(input.adSpend),
      costPerResult: money(input.costPerResult),
      averageOrderValue: money(input.averageOrderValue),
      resultCount: result.resultCount,
      revenue: result.revenue,
      profitAfterAds: result.profitAfterAds,
      roiPercentage: result.roiPercentage,
      targetCpr: result.targetCpr,
      revenuePerResult: result.revenuePerResult,
      marginPerResult: result.marginPerResult,
      status: result.status,
      formulaVersion: result.formulaVersion,
    };

    const calculation = await this.repository.createCalculation(snapshot);

    return toCalculationResponse(calculation);
  }

  async list(userId: string, pagination: CalculationPagination) {
    const offset = (pagination.page - 1) * pagination.limit;
    const { items, total } = await this.repository.listCalculationsByUser(
      userId,
      pagination.limit,
      offset,
    );

    return {
      data: items.map(toCalculationResponse),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
      },
    };
  }
}
