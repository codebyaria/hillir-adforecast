import { count, desc, eq } from "drizzle-orm";

import type { ProfitabilityStatus } from "../../shared/types.js";
import { getDatabase } from "../db/client.js";
import { calculations } from "../db/schema.js";

export interface StoredCalculation {
  id: string;
  userId: string;
  productPrice: string;
  adSpend: string;
  costPerResult: string;
  averageOrderValue: string;
  resultCount: string;
  revenue: string;
  profitAfterAds: string;
  roiPercentage: string;
  targetCpr: string;
  revenuePerResult: string;
  marginPerResult: string;
  status: ProfitabilityStatus;
  formulaVersion: string;
  createdAt: Date;
}

export type NewStoredCalculation = Omit<
  StoredCalculation,
  "id" | "createdAt"
>;

export interface CalculationPage {
  items: StoredCalculation[];
  total: number;
}

export interface CalculationRepository {
  createCalculation(input: NewStoredCalculation): Promise<StoredCalculation>;
  listCalculationsByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<CalculationPage>;
}

const calculationSelection = {
  id: calculations.id,
  userId: calculations.userId,
  productPrice: calculations.productPrice,
  adSpend: calculations.adSpend,
  costPerResult: calculations.costPerResult,
  averageOrderValue: calculations.averageOrderValue,
  resultCount: calculations.resultCount,
  revenue: calculations.revenue,
  profitAfterAds: calculations.profitAfterAds,
  roiPercentage: calculations.roiPercentage,
  targetCpr: calculations.targetCpr,
  revenuePerResult: calculations.revenuePerResult,
  marginPerResult: calculations.marginPerResult,
  status: calculations.status,
  formulaVersion: calculations.formulaVersion,
  createdAt: calculations.createdAt,
};

function asStoredCalculation(
  calculation: typeof calculations.$inferSelect,
): StoredCalculation {
  return {
    ...calculation,
    status: calculation.status as ProfitabilityStatus,
  };
}

export const drizzleCalculationRepository: CalculationRepository = {
  async createCalculation(input) {
    const [calculation] = await getDatabase()
      .insert(calculations)
      .values(input)
      .returning(calculationSelection);

    if (!calculation) {
      throw new Error("Simulasi gagal disimpan.");
    }

    return asStoredCalculation(calculation);
  },

  async listCalculationsByUser(userId, limit, offset) {
    return getDatabase().transaction(async (transaction) => {
      const [items, [totalRow]] = await Promise.all([
        transaction
          .select(calculationSelection)
          .from(calculations)
          .where(eq(calculations.userId, userId))
          .orderBy(desc(calculations.createdAt), desc(calculations.id))
          .limit(limit)
          .offset(offset),
        transaction
          .select({ value: count() })
          .from(calculations)
          .where(eq(calculations.userId, userId)),
      ]);

      return {
        items: items.map(asStoredCalculation),
        total: totalRow?.value ?? 0,
      };
    });
  },
};
